/**
 * Google Drive connector — syncs files to Supabase pgvector.
 *
 * Flow:
 *  1. Load + decrypt OAuth tokens from DB
 *  2. List all supported files from Google Drive
 *  3. For each file: export/download, parse, chunk, embed, store
 *  4. Update source status in DB
 */

import { google } from "googleapis";
import { prisma } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/openai";
import { chunkText } from "@/modules/ai/chunker";
import crypto from "crypto";

// Supported Google Drive MIME types → how we export them
const SUPPORTED_MIME_TYPES: Record<string, { exportMime: string; fileType: string }> = {
  "application/vnd.google-apps.document": {
    exportMime: "text/plain",
    fileType: "google_doc",
  },
  "application/vnd.google-apps.spreadsheet": {
    exportMime: "text/csv",
    fileType: "google_sheet",
  },
  "application/pdf": {
    exportMime: "application/pdf",
    fileType: "pdf",
  },
  "text/plain": {
    exportMime: "text/plain",
    fileType: "txt",
  },
  "text/markdown": {
    exportMime: "text/plain",
    fileType: "markdown",
  },
};

/**
 * Recursively fetch all subfolders under a given Google Drive folder ID.
 */
async function getAllSubfolderIds(
  driveClient: ReturnType<typeof google.drive>,
  rootFolderId: string
): Promise<string[]> {
  const folderIds = [rootFolderId];
  const queue = [rootFolderId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    try {
      const res = await driveClient.files.list({
        q: `'${currentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: "files(id)",
        pageSize: 100,
      });
      const children = res.data.files ?? [];
      for (const child of children) {
        if (child.id && !folderIds.includes(child.id)) {
          folderIds.push(child.id);
          queue.push(child.id);
        }
      }
    } catch (err) {
      console.warn(`[Google Drive] Failed to list children of folder ${currentId}:`, err);
    }
  }
  return folderIds;
}

export async function syncGoogleDrive(sourceId: string): Promise<void> {
  console.log(`[Google Drive] 🔄 Starting sync — source: ${sourceId}`);

  // ── 1. Load source ─────────────────────────────────────────
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error(`Source ${sourceId} not found`);
  if (!source.refreshToken) throw new Error(`Source ${sourceId} has no refresh token`);

  // ── 2. Build OAuth client ───────────────────────────────────
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: decrypt(source.refreshToken),
    access_token: source.accessToken ? decrypt(source.accessToken) : undefined,
  });

  // Persist refreshed tokens back to DB automatically
  oauth2Client.on("tokens", async (tokens) => {
    const updateData: Record<string, unknown> = {};
    if (tokens.access_token) updateData.accessToken = encrypt(tokens.access_token);
    if (tokens.expiry_date) updateData.tokenExpiry = new Date(tokens.expiry_date);
    if (Object.keys(updateData).length > 0) {
      await prisma.source.update({ where: { id: sourceId }, data: updateData });
    }
  });

  const driveClient = google.drive({ version: "v3", auth: oauth2Client });

  // ── 3. Mark source as syncing ───────────────────────────────
  await prisma.source.update({
    where: { id: sourceId },
    data: { status: "syncing", errorMessage: null },
  });

  let totalIndexed = 0;
  let pageToken: string | undefined;

  const mimeQuery = Object.keys(SUPPORTED_MIME_TYPES)
    .map((t) => `mimeType = '${t}'`)
    .join(" or ");

  try {
    // ── 4. Build restricted folder query if configured ─────────
    const config = (source.config as Record<string, unknown>) || {};
    const folderId = config.folderId as string | undefined;
    let query = `trashed = false and (${mimeQuery})`;

    if (folderId) {
      console.log(`[Google Drive] Restricted to folder: ${folderId}`);
      const allowedFolderIds = await getAllSubfolderIds(driveClient, folderId);
      const parentConditions = allowedFolderIds
        .map((id) => `'${id}' in parents`)
        .join(" or ");
      
      // If we have parents, query them. If not, only matching the root folder.
      if (parentConditions) {
        query = `trashed = false and (${parentConditions}) and (${mimeQuery})`;
      } else {
        query = `trashed = false and '${folderId}' in parents and (${mimeQuery})`;
      }
    }

    // ── 5. Paginate through all matching files ─────────────────
    do {
      const listResponse = await driveClient.files.list({
        pageSize: 100,
        pageToken,
        fields:
          "nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink, size)",
        q: query,
        orderBy: "modifiedTime desc",
      });

      const files = listResponse.data.files ?? [];
      pageToken = listResponse.data.nextPageToken ?? undefined;

      for (const file of files) {
        if (!file.id || !file.name || !file.mimeType) continue;

        try {
          const indexed = await processFile(
            {
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              webViewLink: file.webViewLink ?? undefined,
              modifiedTime: file.modifiedTime ?? undefined,
            },
            sourceId,
            source.workspaceId,
            driveClient
          );
          if (indexed) totalIndexed++;
        } catch (fileErr) {
          // Log but continue — don't let one file kill the whole sync
          console.error(`[Google Drive] ⚠️ Error processing "${file.name}":`, fileErr);
        }
      }
    } while (pageToken);

    // ── 6. Mark synced ─────────────────────────────────────────
    await prisma.source.update({
      where: { id: sourceId },
      data: {
        status: "synced",
        lastSyncedAt: new Date(),
        itemsIndexed: { increment: totalIndexed },
      },
    });

    console.log(`[Google Drive] ✅ Sync complete — indexed ${totalIndexed} files`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Google Drive] ❌ Sync failed:`, msg);
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: "error", errorMessage: msg },
    });
    throw err;
  }
}

// ── Per-file processing ─────────────────────────────────────────────────────

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
}

async function processFile(
  file: DriveFile,
  sourceId: string,
  workspaceId: string,
  driveClient: ReturnType<typeof google.drive>
): Promise<boolean> {
  const meta = SUPPORTED_MIME_TYPES[file.mimeType];
  if (!meta) return false;

  // ── Extract text ─────────────────────────────────────────────
  let rawContent = "";

  if (file.mimeType.startsWith("application/vnd.google-apps.")) {
    // Native Google formats — use export API
    const res = await driveClient.files.export(
      { fileId: file.id, mimeType: meta.exportMime },
      { responseType: "text" }
    );
    rawContent = String(res.data);
  } else if (file.mimeType === "application/pdf") {
    // Binary download → parse PDF
    const res = await driveClient.files.get(
      { fileId: file.id, alt: "media" },
      { responseType: "arraybuffer" }
    );
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfImport = require("pdf-parse");
    const PDFParseClass = pdfImport.PDFParse || (typeof pdfImport === "function" ? pdfImport : pdfImport.default);
    
    // Set the worker source statically before parsing in Node.js to prevent fake worker resolution failure
    try {
      PDFParseClass.setWorker(require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs"));
    } catch (e) {
      console.warn("[Google Drive] Failed to set local pdf.js worker:", e);
    }

    const parser = new PDFParseClass({ data: Buffer.from(res.data as ArrayBuffer) });
    const parsed = await parser.getText();
    rawContent = parsed.text;
    await parser.destroy();
  } else {
    // Plain text / markdown
    const res = await driveClient.files.get(
      { fileId: file.id, alt: "media" },
      { responseType: "text" }
    );
    rawContent = String(res.data);
  }

  if (!rawContent || rawContent.trim().length < 20) {
    console.log(`[Google Drive] ↩️  Skipped "${file.name}" — no extractable content`);
    return false;
  }

  // ── Deduplication via content hash ───────────────────────────
  const contentHash = crypto.createHash("sha256").update(rawContent).digest("hex");

  const existing = await prisma.document.findUnique({
    where: { sourceId_externalId: { sourceId, externalId: file.id } },
    select: { id: true, contentHash: true },
  });

  if (existing?.contentHash === contentHash) {
    console.log(`[Google Drive] ↩️  Skipped "${file.name}" — unchanged`);
    return false;
  }

  // ── Upsert document record ───────────────────────────────────
  const document = await prisma.document.upsert({
    where: { sourceId_externalId: { sourceId, externalId: file.id } },
    create: {
      workspaceId,
      sourceId,
      externalId: file.id,
      title: file.name,
      fileType: meta.fileType,
      url: file.webViewLink,
      rawContent,
      contentHash,
      indexedAt: new Date(),
    },
    update: {
      title: file.name,
      rawContent,
      contentHash,
      indexedAt: new Date(),
    },
  });

  // ── Delete stale chunks ──────────────────────────────────────
  await supabaseAdmin
    .from("document_chunks")
    .delete()
    .eq("document_id", document.id);

  // ── Chunk → Embed → Store ────────────────────────────────────
  const chunks = chunkText(rawContent, file.name);
  console.log(
    `[Google Drive] 📄 "${file.name}" → ${chunks.length} chunks`
  );

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content);

    const { error } = await supabaseAdmin.from("document_chunks").insert({
      workspace_id: workspaceId,
      document_id: document.id,
      source_id: sourceId,
      content: chunk.content,
      chunk_index: chunk.chunkIndex,
      token_count: chunk.tokenCount,
      embedding,  // pgvector accepts JS number[] directly via Supabase JS client
      metadata: {
        document_title: file.name,
        file_type: meta.fileType,
        url: file.webViewLink ?? null,
        source_type: "google_drive",
        modified_time: file.modifiedTime ?? null,
      },
    });

    if (error) {
      console.error(`[Google Drive] ❌ Failed to insert chunk:`, error.message);
    }
  }

  return true;
}
