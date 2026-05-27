import { google, gmail_v1 } from "googleapis";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/openai";
import { chunkText } from "@/modules/ai/chunker";
import { buildGmailThreadDocument } from "@/modules/sources/connectors/gmail-utils";

const DEFAULT_QUERY = "newer_than:180d -category:promotions -category:social";
const MAX_THREADS_PER_SYNC = 100;

export async function syncGmail(sourceId: string): Promise<void> {
  console.log(`[Gmail] Starting sync - source: ${sourceId}`);

  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error(`Source ${sourceId} not found`);
  if (!source.refreshToken) throw new Error(`Source ${sourceId} has no refresh token`);

  const clientId = process.env.GMAIL_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Gmail OAuth is not configured");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({
    refresh_token: decrypt(source.refreshToken),
    access_token: source.accessToken ? decrypt(source.accessToken) : undefined,
  });

  oauth2Client.on("tokens", async (tokens) => {
    const updateData: Record<string, unknown> = {};
    if (tokens.access_token) updateData.accessToken = encrypt(tokens.access_token);
    if (tokens.expiry_date) updateData.tokenExpiry = new Date(tokens.expiry_date);
    if (Object.keys(updateData).length > 0) {
      await prisma.source.update({ where: { id: sourceId }, data: updateData });
    }
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  await prisma.source.update({
    where: { id: sourceId },
    data: { status: "syncing", errorMessage: null },
  });

  let totalIndexed = 0;

  try {
    const config = (source.config as Record<string, unknown>) || {};
    const query = buildQuery(config);
    const threadIds = await listThreadIds(gmail, query);

    for (const threadId of threadIds) {
      try {
        const thread = await gmail.users.threads.get({
          userId: "me",
          id: threadId,
          format: "full",
        });

        const doc = buildGmailThreadDocument(thread.data);
        if (!doc.externalId || doc.rawContent.trim().length < 20) continue;

        const indexed = await indexThreadDocument(doc, sourceId, source.workspaceId);
        if (indexed) totalIndexed++;
      } catch (threadErr) {
        console.error(`[Gmail] Error processing thread "${threadId}":`, threadErr);
      }
    }

    let latestHistoryId = config.historyId as string | undefined;
    try {
      const profile = await gmail.users.getProfile({ userId: "me" });
      latestHistoryId = profile.data.historyId ?? latestHistoryId;
    } catch (err) {
      console.warn("[Gmail] Could not refresh profile historyId:", err);
    }

    await prisma.source.update({
      where: { id: sourceId },
      data: {
        status: "synced",
        lastSyncedAt: new Date(),
        itemsIndexed: { increment: totalIndexed },
        config: {
          ...config,
          query,
          historyId: latestHistoryId ?? null,
          lastSyncedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`[Gmail] Sync complete - indexed ${totalIndexed} threads`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Gmail] Sync failed:", msg);
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: "error", errorMessage: msg },
    });
    throw err;
  }
}

async function listThreadIds(gmail: gmail_v1.Gmail, query: string): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const response = await gmail.users.threads.list({
      userId: "me",
      q: query,
      maxResults: Math.min(50, MAX_THREADS_PER_SYNC - ids.length),
      pageToken,
    });

    for (const thread of response.data.threads ?? []) {
      if (thread.id) ids.push(thread.id);
      if (ids.length >= MAX_THREADS_PER_SYNC) break;
    }

    pageToken =
      ids.length < MAX_THREADS_PER_SYNC
        ? response.data.nextPageToken ?? undefined
        : undefined;
  } while (pageToken);

  return ids;
}

function buildQuery(config: Record<string, unknown>): string {
  const configuredQuery = typeof config.query === "string" ? config.query.trim() : "";
  if (configuredQuery) return configuredQuery;

  const lastSyncedAt = typeof config.lastSyncedAt === "string" ? config.lastSyncedAt : "";
  if (!lastSyncedAt) return DEFAULT_QUERY;

  const date = new Date(lastSyncedAt);
  if (Number.isNaN(date.getTime())) return DEFAULT_QUERY;

  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `after:${yyyy}/${mm}/${dd} -category:promotions -category:social`;
}

async function indexThreadDocument(
  doc: ReturnType<typeof buildGmailThreadDocument>,
  sourceId: string,
  workspaceId: string
): Promise<boolean> {
  const contentHash = crypto.createHash("sha256").update(doc.rawContent).digest("hex");

  const existing = await prisma.document.findUnique({
    where: { sourceId_externalId: { sourceId, externalId: doc.externalId } },
    select: { id: true, contentHash: true },
  });

  if (existing?.contentHash === contentHash) {
    console.log(`[Gmail] Skipped "${doc.title}" - unchanged`);
    return false;
  }

  const document = await prisma.document.upsert({
    where: { sourceId_externalId: { sourceId, externalId: doc.externalId } },
    create: {
      workspaceId,
      sourceId,
      externalId: doc.externalId,
      title: doc.title,
      fileType: doc.fileType,
      url: doc.url,
      rawContent: doc.rawContent,
      contentHash,
      indexedAt: new Date(),
    },
    update: {
      title: doc.title,
      fileType: doc.fileType,
      url: doc.url,
      rawContent: doc.rawContent,
      contentHash,
      indexedAt: new Date(),
    },
  });

  await supabaseAdmin.from("document_chunks").delete().eq("document_id", document.id);

  const chunks = chunkText(doc.rawContent, doc.title);
  console.log(`[Gmail] "${doc.title}" -> ${chunks.length} chunks`);

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content);

    const { error } = await supabaseAdmin.from("document_chunks").insert({
      workspace_id: workspaceId,
      document_id: document.id,
      source_id: sourceId,
      content: chunk.content,
      chunk_index: chunk.chunkIndex,
      token_count: chunk.tokenCount,
      embedding,
      metadata: doc.metadata,
    });

    if (error) {
      console.error(`[Gmail] Failed to insert chunk for "${doc.title}":`, error.message);
    }
  }

  return true;
}
