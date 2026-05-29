/**
 * Slack connector — syncs Slack channels and messages to Supabase pgvector.
 */

import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/openai";
import { chunkText } from "@/modules/ai/chunker";
import crypto from "crypto";

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

  try {
    // Fetch public channels
    const channelsRes = await fetch("https://slack.com/api/conversations.list?types=public_channel&exclude_archived=true", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const channelsData = await channelsRes.json();

    if (!channelsData.ok) {
      throw new Error(`Slack API error (channels): ${channelsData.error}`);
    }

    const channels = channelsData.channels || [];
    console.log(`[Slack] Found ${channels.length} public channels`);

    for (const channel of channels) {
      const channelId = channel.id;
      const channelName = channel.name;

      // Join the channel if not already in it (some workspaces require it for history)
      await fetch("https://slack.com/api/conversations.join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ channel: channelId })
      });

      // Fetch history (messages)
      const historyRes = await fetch(`https://slack.com/api/conversations.history?channel=${channelId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const historyData = await historyRes.json();

      if (!historyData.ok) {
        console.warn(`[Slack] Failed to fetch history for channel ${channelName}: ${historyData.error}`);
        continue;
      }

      const messages = historyData.messages || [];
      if (messages.length === 0) continue;

      // Group messages into a single document representing recent channel history
      // Alternatively, we could create a Document for each thread or day.
      // We'll create one Document per channel for simplicity in this MVP.
      
      const docTitle = `#${channelName}`;
      const docExternalId = `slack-channel-${channelId}`;
      const docUrl = `slack://channel?id=${channelId}&team=${(source.config as Record<string, any>)?.teamId || ""}`;
      
      // Combine message text
      const contentParts = messages
        .filter((m: any) => m.type === "message" && m.text)
        .reverse() // chronological order
        .map((m: any) => `[${new Date(parseFloat(m.ts) * 1000).toLocaleString()}] User ${m.user || 'Unknown'}: ${m.text}`);
      
      const rawContent = contentParts.join("\n\n");
      if (!rawContent.trim()) continue;

      const contentHash = crypto.createHash("md5").update(rawContent).digest("hex");

      const existingDoc = await prisma.document.findUnique({
        where: { sourceId_externalId: { sourceId, externalId: docExternalId } },
      });

      if (existingDoc && existingDoc.contentHash === contentHash) {
        console.log(`[Slack] Channel ${docTitle} unmodified, skipping.`);
        continue; // Unmodified
      }

      // Upsert Document
      const doc = await prisma.document.upsert({
        where: { sourceId_externalId: { sourceId, externalId: docExternalId } },
        update: { title: docTitle, rawContent, contentHash, url: docUrl, indexedAt: new Date() },
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
        },
      });

      // Delete old chunks
      await prisma.documentChunk.deleteMany({ where: { documentId: doc.id } });
      const { error: pgError } = await supabaseAdmin.from("document_chunks").delete().eq("document_id", doc.id);
      if (pgError) console.error(`[Slack] Supabase delete error: ${pgError.message}`);

      // Chunk and embed
      const chunks = chunkText(rawContent, docTitle);
      for (const chunk of chunks) {
        const chunkTextContent = chunk.content;
        const i = chunk.chunkIndex;
        const embedding = await generateEmbedding(chunkTextContent);

        const dbChunk = await prisma.documentChunk.create({
          data: {
            workspaceId: source.workspaceId,
            sourceId: sourceId,
            documentId: doc.id,
            content: chunkTextContent,
            chunkIndex: i,
          },
        });

        const { error: insertErr } = await supabaseAdmin.from("document_chunks").insert({
          id: dbChunk.id,
          document_id: doc.id,
          workspace_id: source.workspaceId,
          content: chunkTextContent,
          embedding,
          metadata: { source: "slack", channelName },
        });

        if (insertErr) {
          console.error(`[Slack] Supabase insert error for chunk: ${insertErr.message}`);
        }
      }

      totalIndexed++;
      console.log(`[Slack] Indexed channel: ${docTitle} (${chunks.length} chunks)`);
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
  } catch (error: any) {
    console.error("[Slack] ❌ Sync failed:", error);
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: "error", errorMessage: error.message },
    });
  }
}
