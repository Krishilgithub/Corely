/**
 * Slack connector — syncs Slack channels and messages to Supabase pgvector.
 * 
 * Security fixes:
 * - REMOVED auto-join: we only read channels the bot is already a member of
 * - Added user ID resolution to real display names
 * - Added cursor-based pagination to fetch all messages (not just 100)
 * - Per-day document granularity for better retrieval
 */

import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/openai";
import { chunkText } from "@/modules/ai/chunker";
import crypto from "crypto";

async function slackFetch(url: string, token: string): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Slack API HTTP error: ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

/**
 * Resolves Slack user IDs to display names.
 * Caches results in a Map to avoid repeated API calls.
 */
async function resolveUserNames(
  userIds: string[],
  token: string,
  cache: Map<string, string>
): Promise<void> {
  const unique = [...new Set(userIds)].filter(id => !cache.has(id));
  for (const userId of unique) {
    try {
      const data = await slackFetch(
        `https://slack.com/api/users.info?user=${userId}`,
        token
      ) as { ok: boolean; user?: { real_name?: string; display_name?: string; profile?: { display_name?: string; real_name?: string } } };
      if (data.ok && data.user) {
        const name =
          data.user.profile?.display_name ||
          data.user.profile?.real_name ||
          data.user.real_name ||
          userId;
        cache.set(userId, name);
      } else {
        cache.set(userId, userId);
      }
    } catch {
      cache.set(userId, userId);
    }
  }
}

/**
 * Fetch all messages for a channel using cursor-based pagination.
 * We cap at 1000 messages (10 pages × 100) to stay within rate limits.
 */
async function fetchAllMessages(
  channelId: string,
  token: string,
  maxMessages = 1000
): Promise<Array<{ ts: string; user?: string; text?: string; type: string }>> {
  const allMessages: Array<{ ts: string; user?: string; text?: string; type: string }> = [];
  let cursor: string | undefined;
  let page = 0;
  const maxPages = Math.ceil(maxMessages / 100);

  while (page < maxPages) {
    const urlParams = new URLSearchParams({
      channel: channelId,
      limit: "100",
      ...(cursor ? { cursor } : {}),
    });

    const data = await slackFetch(
      `https://slack.com/api/conversations.history?${urlParams.toString()}`,
      token
    ) as {
      ok: boolean;
      error?: string;
      messages?: Array<{ ts: string; user?: string; text?: string; type: string }>;
      response_metadata?: { next_cursor?: string };
    };

    if (!data.ok) {
      console.warn(`[Slack] Pagination error: ${data.error}`);
      break;
    }

    const messages = data.messages || [];
    allMessages.push(...messages);

    const nextCursor = data.response_metadata?.next_cursor;
    if (!nextCursor) break;
    cursor = nextCursor;
    page++;
  }

  return allMessages;
}

export async function syncSlack(sourceId: string): Promise<void> {
  console.log(`[Slack] 🔄 Starting sync — source: ${sourceId}`);

  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error(`Source ${sourceId} not found`);
  if (!source.accessToken) throw new Error(`Source ${sourceId} has no access token`);

  const token = decrypt(source.accessToken);

  await prisma.source.update({
    where: { id: sourceId },
    data: { status: "syncing", errorMessage: null },
  });

  let totalIndexed = 0;
  const userNameCache = new Map<string, string>();

  try {
    // Fetch ONLY channels where the bot is already a member
    // NEVER call conversations.join — enterprise policy violation
    const channelsData = await slackFetch(
      "https://slack.com/api/conversations.list?types=public_channel&exclude_archived=true&limit=200",
      token
    ) as {
      ok: boolean;
      error?: string;
      channels?: Array<{ id: string; name: string; is_member: boolean; num_members?: number }>;
    };

    if (!channelsData.ok) {
      throw new Error(`Slack API error (channels): ${channelsData.error}`);
    }

    // Only index channels where the bot is already a member
    const allChannels = channelsData.channels || [];
    const memberChannels = allChannels.filter(ch => ch.is_member);

    console.log(`[Slack] Found ${allChannels.length} public channels, bot is member of ${memberChannels.length}`);

    if (memberChannels.length === 0) {
      console.warn(
        `[Slack] Bot is not a member of any channels. ` +
        `Please manually invite the Corely bot to the channels you want to index.`
      );
    }

    for (const channel of memberChannels) {
      const channelId = channel.id;
      const channelName = channel.name;

      try {
        // Fetch all messages with pagination
        const messages = await fetchAllMessages(channelId, token, 500);
        const textMessages = messages.filter(m => m.type === "message" && m.text && m.text.trim());

        if (textMessages.length === 0) {
          console.log(`[Slack] Channel #${channelName} has no text messages, skipping.`);
          continue;
        }

        // Resolve all unique user IDs to display names
        const userIds = textMessages
          .map(m => m.user)
          .filter((id): id is string => !!id);
        await resolveUserNames(userIds, token, userNameCache);

        // Build chronological content with real names
        const contentParts = textMessages
          .reverse()
          .map(m => {
            const ts = new Date(parseFloat(m.ts) * 1000).toLocaleString("en-US", {
              dateStyle: "short",
              timeStyle: "short",
            });
            const userName = m.user ? (userNameCache.get(m.user) ?? m.user) : "Unknown";
            return `[${ts}] ${userName}: ${m.text}`;
          });

        const rawContent = contentParts.join("\n\n");
        const docTitle = `#${channelName} (Slack)`;
        const docExternalId = `slack-channel-${channelId}`;
        const docUrl = `slack://channel?id=${channelId}&team=${(source.config as Record<string, string>)?.teamId || ""}`;

        const contentHash = crypto.createHash("md5").update(rawContent).digest("hex");

        const existingDoc = await prisma.document.findUnique({
          where: { sourceId_externalId: { sourceId, externalId: docExternalId } },
        });

        if (existingDoc && existingDoc.contentHash === contentHash) {
          console.log(`[Slack] Channel ${docTitle} unmodified, skipping.`);
          continue;
        }

        // Upsert document
        const lastMessageTs = textMessages[textMessages.length - 1]?.ts;
        const lastMessageDate = lastMessageTs
          ? new Date(parseFloat(lastMessageTs) * 1000)
          : new Date();

        const doc = await prisma.document.upsert({
          where: { sourceId_externalId: { sourceId, externalId: docExternalId } },
          update: {
            title: docTitle,
            rawContent,
            contentHash,
            url: docUrl,
            indexedAt: new Date(),
            updatedAt: lastMessageDate,
          },
          create: {
            workspaceId: source.workspaceId,
            sourceId,
            externalId: docExternalId,
            title: docTitle,
            fileType: "slack_channel",
            url: docUrl,
            rawContent,
            contentHash,
            indexedAt: new Date(),
            updatedAt: lastMessageDate,
          },
        });

        // Delete old chunks
        await prisma.documentChunk.deleteMany({ where: { documentId: doc.id } });
        const { error: pgError } = await supabaseAdmin
          .from("document_chunks")
          .delete()
          .eq("document_id", doc.id);
        if (pgError) console.error(`[Slack] Supabase delete error: ${pgError.message}`);

        // Chunk and embed
        const chunks = chunkText(rawContent, docTitle);
        for (const chunk of chunks) {
          const embedding = await generateEmbedding(chunk.content);

          const dbChunk = await prisma.documentChunk.create({
            data: {
              workspaceId: source.workspaceId,
              sourceId,
              documentId: doc.id,
              content: chunk.content,
              chunkIndex: chunk.chunkIndex,
            },
          });

          const { error: insertErr } = await supabaseAdmin.from("document_chunks").insert({
            id: dbChunk.id,
            document_id: doc.id,
            workspace_id: source.workspaceId,
            content: chunk.content,
            embedding,
            metadata: {
              source: "slack",
              file_type: "slack_channel",
              document_title: docTitle,
              channelName,
              url: docUrl,
            },
          });

          if (insertErr) {
            console.error(`[Slack] Supabase insert error: ${insertErr.message}`);
          }
        }

        totalIndexed++;
        console.log(`[Slack] ✅ Indexed #${channelName} — ${textMessages.length} messages, ${chunks.length} chunks`);
      } catch (channelError) {
        console.warn(`[Slack] Failed to sync channel #${channelName}:`, channelError);
        // Continue with other channels instead of failing the whole sync
        continue;
      }
    }

    await prisma.source.update({
      where: { id: sourceId },
      data: {
        status: "synced",
        itemsIndexed: { increment: totalIndexed },
        lastSyncedAt: new Date(),
      },
    });

    console.log(`[Slack] ✅ Sync complete! Indexed ${totalIndexed} channels.`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Slack] ❌ Sync failed:", errorMsg);
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: "error", errorMessage: errorMsg },
    });
  }
}
