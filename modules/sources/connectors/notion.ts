/**
 * Notion connector — syncs all shared pages and databases to Supabase pgvector.
 *
 * Flow:
 *  1. Load + decrypt access token from DB
 *  2. Search all pages/databases the integration can access
 *  3. For each Page: recursively fetch all block content
 *  4. For each Database: fetch all row-pages and their blocks
 *  5. Extract plain text from every block type
 *  6. Chunk → Embed → Store in Supabase document_chunks
 *  7. Update source status in DB
 */

import { Client, isFullPage, isFullDatabase } from "@notionhq/client";
import type {
  BlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/openai";
import { chunkText } from "@/modules/ai/chunker";
import crypto from "crypto";

// Maximum recursion depth for nested blocks (prevents infinite loops)
const MAX_BLOCK_DEPTH = 5;

// ── Main sync entry point ──────────────────────────────────────────────────────

export async function syncNotion(sourceId: string): Promise<void> {
  console.log(`[Notion] 🔄 Starting sync — source: ${sourceId}`);

  // ── 1. Load source ─────────────────────────────────────────────────
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error(`Source ${sourceId} not found`);
  if (!source.accessToken) throw new Error(`Source ${sourceId} has no access token`);

  // ── 2. Build Notion client ─────────────────────────────────────────
  const notion = new Client({ auth: decrypt(source.accessToken) });

  // ── 3. Mark source as syncing ──────────────────────────────────────
  await prisma.source.update({
    where: { id: sourceId },
    data: { status: "syncing", errorMessage: null },
  });

  let totalIndexed = 0;
  const processedIds = new Set<string>();

  try {
    // ── 4. Sync all pages ─────────────────────────────────────────────
    let pageCursor: string | undefined = undefined;
    do {
      const searchResponse = await withRetry(() =>
        notion.search({
          filter: { value: "page", property: "object" },
          page_size: 100,
          start_cursor: pageCursor,
        })
      );

      for (const result of searchResponse.results) {
        if (!isFullPage(result) || processedIds.has(result.id)) continue;
        processedIds.add(result.id);

        try {
          const indexed = await processPage(result, sourceId, source.workspaceId, notion);
          if (indexed) totalIndexed++;
        } catch (err) {
          console.error(`[Notion] ⚠️ Error processing page "${result.id}":`, err);
        }
      }

      pageCursor = searchResponse.has_more
        ? (searchResponse.next_cursor ?? undefined)
        : undefined;
    } while (pageCursor);

    // ── 5. Sync all database rows ──────────────────────────────────────
    let dbCursor: string | undefined = undefined;
    do {
      const dbSearch = await withRetry(() =>
        notion.search({
          filter: { value: "database" as any, property: "object" },
          page_size: 100,
          start_cursor: dbCursor,
        })
      );

      for (const db of dbSearch.results as any[]) {
        if (!isFullDatabase(db)) continue;

        let rowCursor: string | undefined = undefined;
        do {
          const rows = await withRetry(() =>
            notion.request<{
              results: any[];
              has_more: boolean;
              next_cursor: string | null;
            }>({
              path: `databases/${db.id}/query`,
              method: "post",
              body: {
                page_size: 100,
                start_cursor: rowCursor,
              },
            })
          );

          for (const row of rows.results) {
            if (!isFullPage(row) || processedIds.has(row.id)) continue;
            processedIds.add(row.id);

            try {
              const indexed = await processPage(row, sourceId, source.workspaceId, notion);
              if (indexed) totalIndexed++;
            } catch (err) {
              console.error(`[Notion] ⚠️ Error processing DB row "${row.id}":`, err);
            }
          }

          rowCursor = rows.has_more ? (rows.next_cursor ?? undefined) : undefined;
        } while (rowCursor);
      }

      dbCursor = dbSearch.has_more ? (dbSearch.next_cursor ?? undefined) : undefined;
    } while (dbCursor);

    // ── 6. Mark synced ─────────────────────────────────────────────────
    await prisma.source.update({
      where: { id: sourceId },
      data: {
        status: "synced",
        lastSyncedAt: new Date(),
        itemsIndexed: { increment: totalIndexed },
      },
    });

    console.log(`[Notion] ✅ Sync complete — indexed ${totalIndexed} pages`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Notion] ❌ Sync failed:`, msg);
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: "error", errorMessage: msg },
    });
    throw err;
  }
}

// ── Per-page processing ────────────────────────────────────────────────────────

async function processPage(
  page: PageObjectResponse,
  sourceId: string,
  workspaceId: string,
  notion: Client
): Promise<boolean> {
  const title = extractPageTitle(page);

  // Recursively extract all block text
  const bodyContent = await extractBlockContent(notion, page.id, 0);

  if (!bodyContent || bodyContent.trim().length < 20) {
    console.log(`[Notion] ↩️  Skipped "${title}" — no extractable content`);
    return false;
  }

  const fullContent = `# ${title}\n\n${bodyContent}`;

  // ── Deduplication via content hash ────────────────────────────
  const contentHash = crypto.createHash("sha256").update(fullContent).digest("hex");

  const existing = await prisma.document.findUnique({
    where: { sourceId_externalId: { sourceId, externalId: page.id } },
    select: { id: true, contentHash: true },
  });

  if (existing?.contentHash === contentHash) {
    console.log(`[Notion] ↩️  Skipped "${title}" — unchanged`);
    return false;
  }

  // ── Upsert document record ────────────────────────────────────
  const document = await prisma.document.upsert({
    where: { sourceId_externalId: { sourceId, externalId: page.id } },
    create: {
      workspaceId,
      sourceId,
      externalId: page.id,
      title,
      fileType: "notion_page",
      url: page.url,
      rawContent: fullContent,
      contentHash,
      indexedAt: new Date(),
    },
    update: {
      title,
      rawContent: fullContent,
      contentHash,
      indexedAt: new Date(),
    },
  });

  // ── Delete stale chunks ────────────────────────────────────────
  await supabaseAdmin
    .from("document_chunks")
    .delete()
    .eq("document_id", document.id);

  // ── Chunk → Embed → Store ──────────────────────────────────────
  const chunks = chunkText(fullContent, title);
  console.log(`[Notion] 📄 "${title}" → ${chunks.length} chunks`);

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
      metadata: {
        document_title: title,
        file_type: "notion_page",
        url: page.url,
        source_type: "notion",
        last_edited_time: page.last_edited_time,
      },
    });

    if (error) {
      console.error(`[Notion] ❌ Failed to insert chunk for "${title}":`, error.message);
    }
  }

  return true;
}

// ── Block content extraction ───────────────────────────────────────────────────

async function extractBlockContent(
  notion: Client,
  blockId: string,
  depth: number
): Promise<string> {
  if (depth > MAX_BLOCK_DEPTH) return "";

  const parts: string[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await withRetry(() =>
      notion.blocks.children.list({
        block_id: blockId,
        page_size: 100,
        start_cursor: cursor,
      })
    );

    for (const block of response.results) {
      if (!("type" in block)) continue;
      const typedBlock = block as BlockObjectResponse;

      const blockText = extractTextFromBlock(typedBlock);
      if (blockText) parts.push(blockText);

      if (typedBlock.has_children && depth < MAX_BLOCK_DEPTH) {
        const childText = await extractBlockContent(notion, typedBlock.id, depth + 1);
        if (childText) parts.push(childText);
      }
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return parts.join("\n");
}

/**
 * Extract plain text from a single Notion block object.
 */
function extractTextFromBlock(block: BlockObjectResponse): string {
  const rt = (arr: Array<{ plain_text: string }>): string =>
    arr.map((t) => t.plain_text).join("");

  switch (block.type) {
    case "paragraph":
      return rt(block.paragraph.rich_text);
    case "heading_1":
      return `# ${rt(block.heading_1.rich_text)}`;
    case "heading_2":
      return `## ${rt(block.heading_2.rich_text)}`;
    case "heading_3":
      return `### ${rt(block.heading_3.rich_text)}`;
    case "bulleted_list_item":
      return `• ${rt(block.bulleted_list_item.rich_text)}`;
    case "numbered_list_item":
      return rt(block.numbered_list_item.rich_text);
    case "to_do":
      return `[${block.to_do.checked ? "x" : " "}] ${rt(block.to_do.rich_text)}`;
    case "toggle":
      return rt(block.toggle.rich_text);
    case "quote":
      return `> ${rt(block.quote.rich_text)}`;
    case "callout":
      return rt(block.callout.rich_text);
    case "code":
      return `\`\`\`${block.code.language}\n${rt(block.code.rich_text)}\n\`\`\``;
    case "equation":
      return block.equation.expression;
    case "table_row":
      return block.table_row.cells.map((cell) => rt(cell)).join(" | ");
    case "divider":
      return "---";
    case "child_page":
      return `[Sub-page: ${block.child_page.title}]`;
    case "child_database":
      return `[Database: ${block.child_database.title}]`;
    default:
      return "";
  }
}

/**
 * Extract the title from a Notion page. Works for both regular pages
 * and database rows (which may use "Name" instead of "title").
 */
function extractPageTitle(page: PageObjectResponse): string {
  const props = page.properties;

  for (const key of ["title", "Title", "Name", "name", "Page"]) {
    const prop = props[key];
    if (prop && prop.type === "title" && prop.title.length > 0) {
      return prop.title.map((t) => t.plain_text).join("");
    }
  }

  // Fallback: scan all properties for a title-typed one
  for (const prop of Object.values(props)) {
    if (prop.type === "title" && prop.title.length > 0) {
      return prop.title.map((t) => t.plain_text).join("");
    }
  }

  return "Untitled";
}

// ── Rate limit–aware retry wrapper ────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 429 && attempt < retries - 1) {
        const delay = 1000 * 2 ** attempt; // 1s, 2s, 4s
        console.warn(`[Notion] Rate limited — retrying in ${delay}ms`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("[Notion] Max retries exceeded");
}
