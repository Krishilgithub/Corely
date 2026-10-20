# 📓 Corely — Notion Connector Implementation Guide

> **Status:** Implementation Guide  
> **Prerequisite:** Google Drive Connector implemented ✅ | Supabase + pgvector set up ✅  
> **Goal:** Connect Notion workspace → Fetch pages/databases → Parse → Embed → Store in Supabase pgvector → Query via RAG

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Step 1: Notion Integration Setup (Developer Portal)](#2-step-1-notion-integration-setup-developer-portal)
3. [Step 2: Install Required Packages](#3-step-2-install-required-packages)
4. [Step 3: Environment Variables](#4-step-3-environment-variables)
5. [Step 4: Prisma Schema Update](#5-step-4-prisma-schema-update)
6. [Step 5: OAuth Connect Route](#6-step-5-oauth-connect-route)
7. [Step 6: OAuth Callback Route](#7-step-6-oauth-callback-route)
8. [Step 7: Notion Sync Connector Module](#8-step-7-notion-sync-connector-module)
9. [Step 8: Sync Trigger Route (Manual Re-sync)](#9-step-8-sync-trigger-route-manual-re-sync)
10. [Step 9: Sources UI — Add Notion Card](#10-step-9-sources-ui-add-notion-card)
11. [Step 10: RAG Integration (Already Works)](#11-step-10-rag-integration-already-works)
12. [Step 11: Testing the Full Flow](#12-step-11-testing-the-full-flow)
13. [Troubleshooting](#13-troubleshooting)
14. [Complete File Checklist](#14-complete-file-checklist)

---

## 1. Architecture Overview

```
User clicks "Connect Notion"
         │
         ▼
Notion OAuth 2.0 (Notion Developer Portal)
         │  (returns authorization code + bot_id + workspace_name)
         ▼
Next.js Callback Route → Exchange code for access_token
         │  (stores encrypted access_token + workspace metadata in Supabase)
         │  (no refresh_token — Notion tokens do NOT expire)
         ▼
Background Sync (inline async, same as Google Drive)
┌──────────────────────────────────────────────────────────────┐
│  1. Fetch all shared pages/databases via Notion API          │
│  2. For each Page: fetch full block tree (recursive)         │
│  3. For each Database: fetch all rows as pages              │
│  4. Extract plain text from all block types                  │
│  5. Chunk text into 400-word segments (shared chunker)       │
│  6. Generate OpenAI embeddings (shared generateEmbedding)    │
│  7. Store vectors in Supabase pgvector (document_chunks)     │
│  8. Store document metadata in Supabase postgres (documents) │
│  9. Update source status → "synced"                          │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
"Ask Corely" — Existing RAG pipeline (zero changes needed)
```

### Key Differences vs Google Drive

| Aspect | Google Drive | Notion |
|--------|-------------|--------|
| Auth type | OAuth 2.0 with refresh tokens | OAuth 2.0, **no expiry** on access token |
| Token storage | `accessToken` + `refreshToken` (both encrypted) | `accessToken` only (encrypted) |
| Content fetch | Drive API (files.list + files.export) | Notion API (search → blocks.children) |
| Content types | Docs, Sheets, PDFs, TXT | Pages, Databases, Sub-pages |
| Pagination | `nextPageToken` | `next_cursor` (Notion cursor-based) |

---

## 2. Step 1: Notion Integration Setup (Developer Portal)

### 2.1 Create a New Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"New integration"**
3. Fill in:
   - **Name**: `Corely` (or your app name)
   - **Logo**: Optional — upload your Corely logo
   - **Associated workspace**: Select the workspace you want to test with
   - **Type**: Select **"Public integration"** (required for OAuth, not internal)
4. Click **"Submit"**

### 2.2 Configure OAuth Settings

After creation, go to the **"Distribution"** tab of your integration:

1. Toggle **"Public Integration"** to **ON**
2. Set **"Redirect URIs"** to:
   ```
   http://localhost:3000/api/sources/notion/callback
   ```
   > For production, add: `https://your-domain.com/api/sources/notion/callback`
3. Under **"OAuth Domain & URIs"**, save your changes
4. Copy your credentials from the **"Secrets"** tab:
   - `OAuth client ID` → This is your `NOTION_CLIENT_ID`
   - `OAuth client secret` → This is your `NOTION_CLIENT_SECRET`

### 2.3 Set Required Capabilities

In the **"Capabilities"** tab, ensure these are enabled:
- ✅ **Read content** (required to fetch pages and blocks)
- ✅ **Read user information including email** (for identifying the workspace)

> ⚠️ **Important**: With Public OAuth integrations, users must explicitly share specific pages or databases with your integration. There is no way to access ALL workspace content without user explicitly granting access per-page.

---

## 3. Step 2: Install Required Packages

```bash
npm install @notionhq/client
```

The Notion SDK (`@notionhq/client`) is the official Notion client. It handles:
- OAuth token exchange
- Paginated block fetching
- Block content type parsing

> No additional PDF parsers needed — Notion content is always structured JSON (no binary files).

---

## 4. Step 3: Environment Variables

Add the following to your `.env.local` file:

```bash
# ── Notion OAuth ────────────────────────────────────────────────────────────
NOTION_CLIENT_ID=your_notion_oauth_client_id_here
NOTION_CLIENT_SECRET=your_notion_oauth_client_secret_here
NOTION_REDIRECT_URI=http://localhost:3000/api/sources/notion/callback

# ── Already set (no changes needed) ─────────────────────────────────────────
ENCRYPTION_KEY=your_32_char_encryption_key        # already exists
NEXT_PUBLIC_APP_URL=http://localhost:3000          # already exists
```

**Retrieve these values from:**
- `NOTION_CLIENT_ID`: Notion Developer Portal → Your Integration → Secrets → OAuth client ID
- `NOTION_CLIENT_SECRET`: Notion Developer Portal → Your Integration → Secrets → OAuth client secret

---

## 5. Step 4: Prisma Schema Update

The Prisma `Source` model already has all the fields needed. You only need to update the comment on the `type` field to document the new type value:

**File:** `prisma/schema.prisma`

```diff
model Source {
  id           String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  ...
- type         String    // 'google_drive'
+ type         String    // 'google_drive' | 'notion'
  ...
  accessToken  String?   @map("access_token")   // AES encrypted
  refreshToken String?   @map("refresh_token")  // AES encrypted (null for Notion)
  ...
  config       Json      @default("{}")
  ...
}
```

**No database migration needed** — the `Source` table already supports Notion:
- `accessToken` stores the encrypted Notion access token
- `refreshToken` will be `null` (Notion tokens don't expire)
- `config` (JSON) stores `{ workspaceId, workspaceName, workspaceIcon, botId }`
- `type` = `"notion"`

Run `prisma generate` to update the generated client:
```bash
npm run prisma:generate
```

---

## 6. Step 5: OAuth Connect Route

Create the file: `app/api/sources/notion/connect/route.ts`

```typescript
/**
 * GET /api/sources/notion/connect
 * Redirects the user to Notion's OAuth consent page.
 * After the user approves, Notion redirects back to /api/sources/notion/callback
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const workspaceId = searchParams.get("workspaceId") ?? "default";
  const userId = searchParams.get("userId") ?? "default";

  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Notion OAuth not configured. Check NOTION_CLIENT_ID and NOTION_REDIRECT_URI." },
      { status: 500 }
    );
  }

  // Encode state to pass workspaceId + userId through the OAuth round-trip
  const state = Buffer.from(JSON.stringify({ workspaceId, userId })).toString("base64");

  // Build the Notion OAuth authorization URL
  const authUrl = new URL("https://api.notion.com/v1/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("owner", "user");  // 'user' = user grants, 'workspace' = admin grants all
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
```

---

## 7. Step 6: OAuth Callback Route

Create the file: `app/api/sources/notion/callback/route.ts`

```typescript
/**
 * GET /api/sources/notion/callback
 * Notion redirects here after the user completes the OAuth consent flow.
 * We exchange the authorization code for a permanent access token and save the source.
 */

import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  // ── User denied access ────────────────────────────────────────
  if (error) {
    console.warn("[Notion Callback] User denied access:", error);
    return NextResponse.redirect(
      `${BASE_URL}/dashboard/sources?error=access_denied`
    );
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(
      `${BASE_URL}/dashboard/sources?error=missing_params`
    );
  }

  // ── Parse state ───────────────────────────────────────────────
  let workspaceId: string;
  let userId: string;
  try {
    ({ workspaceId, userId } = JSON.parse(
      Buffer.from(stateRaw, "base64").toString("utf-8")
    ));
  } catch {
    return NextResponse.redirect(
      `${BASE_URL}/dashboard/sources?error=invalid_state`
    );
  }

  // ── Exchange authorization code for access token ──────────────
  // Notion uses HTTP Basic Auth: Base64("clientId:clientSecret")
  const clientId = process.env.NOTION_CLIENT_ID!;
  const clientSecret = process.env.NOTION_CLIENT_SECRET!;
  const redirectUri = process.env.NOTION_REDIRECT_URI!;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  let tokenData: {
    access_token: string;
    bot_id: string;
    workspace_id: string;
    workspace_name: string;
    workspace_icon: string | null;
    owner: { type: string; user?: { name?: string; person?: { email?: string } } };
  };

  try {
    const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errBody}`);
    }

    tokenData = await tokenResponse.json();
  } catch (err) {
    console.error("[Notion Callback] Token exchange failed:", err);
    return NextResponse.redirect(
      `${BASE_URL}/dashboard/sources?error=token_exchange_failed`
    );
  }

  // ── Verify token works by fetching workspace info ─────────────
  const notionClient = new Client({ auth: tokenData.access_token });
  let ownerName = tokenData.workspace_name ?? "Notion Workspace";
  let ownerEmail = "";

  try {
    // Attempt to get the user's email from the owner field
    if (tokenData.owner?.type === "user" && tokenData.owner.user) {
      ownerName = tokenData.owner.user.name ?? ownerName;
      ownerEmail = tokenData.owner.user.person?.email ?? "";
    }
  } catch (err) {
    console.warn("[Notion Callback] Could not extract owner info:", err);
  }

  // ── Ensure workspace & user exist ────────────────────────────
  await prisma.workspace.upsert({
    where: { id: workspaceId },
    create: {
      id: workspaceId,
      name: "My Workspace",
      slug: `workspace-${workspaceId.slice(0, 8)}`,
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      workspaceId,
      email: ownerEmail || `user-${userId.slice(0, 8)}@corely.local`,
      name: ownerName || "Workspace Admin",
      role: "admin",
    },
    update: {},
  });

  // ── Save source with encrypted access token ───────────────────
  // Note: Notion access tokens do NOT expire — no refresh token needed.
  const sourceName = `${tokenData.workspace_name ?? "Notion"} (Notion)`;

  const source = await prisma.source.create({
    data: {
      workspaceId,
      userId,
      type: "notion",
      name: sourceName,
      status: "idle",
      accessToken: encrypt(tokenData.access_token),
      refreshToken: null,  // Notion has no refresh tokens
      config: {
        notionWorkspaceId: tokenData.workspace_id,
        workspaceName: tokenData.workspace_name,
        workspaceIcon: tokenData.workspace_icon,
        botId: tokenData.bot_id,
        ownerEmail,
      },
    },
  });

  // ── Trigger background sync ───────────────────────────────────
  import("@/modules/sources/connectors/notion")
    .then(({ syncNotion }) => {
      syncNotion(source.id).catch((err) => {
        console.error(`[Notion Callback] Background sync failed for ${source.id}:`, err);
      });
    })
    .catch((err) => {
      console.error("[Notion Callback] Failed to load Notion sync module:", err);
    });

  console.log(`[Notion Callback] ✅ Source created: ${source.id} — sync triggered`);

  return NextResponse.redirect(
    `${BASE_URL}/dashboard/sources?connected=notion&sourceId=${source.id}`
  );
}
```

---

## 8. Step 7: Notion Sync Connector Module

Create the file: `modules/sources/connectors/notion.ts`

```typescript
/**
 * Notion connector — syncs all shared pages and databases to Supabase pgvector.
 *
 * Flow:
 *  1. Load + decrypt access token from DB
 *  2. Search for all pages/databases accessible to the integration
 *  3. For each Page: recursively fetch all block content
 *  4. For each Database: fetch all row-pages and their block content
 *  5. Extract plain text from all block types
 *  6. Chunk → Embed → Store in Supabase
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

// Maximum depth to recurse into nested blocks (prevents infinite loops on deeply nested pages)
const MAX_BLOCK_DEPTH = 5;

// ── Main sync entry point ──────────────────────────────────────────────────

export async function syncNotion(sourceId: string): Promise<void> {
  console.log(`[Notion] 🔄 Starting sync — source: ${sourceId}`);

  // ── 1. Load source ─────────────────────────────────────────────
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error(`Source ${sourceId} not found`);
  if (!source.accessToken) throw new Error(`Source ${sourceId} has no access token`);

  // ── 2. Build Notion client ─────────────────────────────────────
  const notion = new Client({ auth: decrypt(source.accessToken) });

  // ── 3. Mark source as syncing ──────────────────────────────────
  await prisma.source.update({
    where: { id: sourceId },
    data: { status: "syncing", errorMessage: null },
  });

  let totalIndexed = 0;

  try {
    // ── 4. Fetch all accessible pages & databases ──────────────────
    // The Notion search API returns all pages/databases the integration has access to.
    let startCursor: string | undefined = undefined;
    const processedIds = new Set<string>();

    do {
      const searchResponse = await notion.search({
        filter: { value: "page", property: "object" },
        page_size: 100,
        start_cursor: startCursor,
      });

      for (const result of searchResponse.results) {
        if (!isFullPage(result)) continue;
        if (processedIds.has(result.id)) continue;
        processedIds.add(result.id);

        try {
          const indexed = await processPage(
            result,
            sourceId,
            source.workspaceId,
            notion
          );
          if (indexed) totalIndexed++;
        } catch (pageErr) {
          console.error(`[Notion] ⚠️ Error processing page "${result.id}":`, pageErr);
        }
      }

      startCursor = searchResponse.has_more ? searchResponse.next_cursor ?? undefined : undefined;
    } while (startCursor);

    // ── 5. Also fetch database entries ────────────────────────────
    let dbCursor: string | undefined = undefined;
    do {
      const dbSearchResponse = await notion.search({
        filter: { value: "database", property: "object" },
        page_size: 100,
        start_cursor: dbCursor,
      });

      for (const result of dbSearchResponse.results) {
        if (!isFullDatabase(result)) continue;

        // Fetch all rows in this database
        let rowCursor: string | undefined = undefined;
        do {
          const rowResponse = await notion.databases.query({
            database_id: result.id,
            page_size: 100,
            start_cursor: rowCursor,
          });

          for (const row of rowResponse.results) {
            if (!isFullPage(row)) continue;
            if (processedIds.has(row.id)) continue;
            processedIds.add(row.id);

            try {
              const indexed = await processPage(
                row,
                sourceId,
                source.workspaceId,
                notion
              );
              if (indexed) totalIndexed++;
            } catch (rowErr) {
              console.error(`[Notion] ⚠️ Error processing DB row "${row.id}":`, rowErr);
            }
          }

          rowCursor = rowResponse.has_more ? rowResponse.next_cursor ?? undefined : undefined;
        } while (rowCursor);
      }

      dbCursor = dbSearchResponse.has_more ? dbSearchResponse.next_cursor ?? undefined : undefined;
    } while (dbCursor);

    // ── 6. Mark synced ─────────────────────────────────────────────
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

// ── Per-page processing ────────────────────────────────────────────────────

async function processPage(
  page: PageObjectResponse,
  sourceId: string,
  workspaceId: string,
  notion: Client
): Promise<boolean> {
  // ── Extract title from page properties ────────────────────────
  const title = extractPageTitle(page);

  // ── Recursively get all block content ─────────────────────────
  const rawContent = await extractBlockContent(notion, page.id, 0);

  if (!rawContent || rawContent.trim().length < 20) {
    console.log(`[Notion] ↩️  Skipped "${title}" — no extractable content`);
    return false;
  }

  // Prepend title to content for better context in RAG
  const fullContent = `# ${title}\n\n${rawContent}`;

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

  // ── Delete stale chunks ───────────────────────────────────────
  await supabaseAdmin
    .from("document_chunks")
    .delete()
    .eq("document_id", document.id);

  // ── Chunk → Embed → Store ─────────────────────────────────────
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
      console.error(`[Notion] ❌ Failed to insert chunk:`, error.message);
    }
  }

  return true;
}

// ── Text extraction helpers ────────────────────────────────────────────────

/**
 * Recursively fetch and extract plain text from all blocks of a page.
 */
async function extractBlockContent(
  notion: Client,
  blockId: string,
  depth: number
): Promise<string> {
  if (depth > MAX_BLOCK_DEPTH) return "";

  const parts: string[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: cursor,
    });

    for (const block of response.results) {
      if (!("type" in block)) continue;
      const typedBlock = block as BlockObjectResponse;

      const blockText = extractTextFromBlock(typedBlock);
      if (blockText) parts.push(blockText);

      // Recurse into child blocks (nested pages, toggles, columns, etc.)
      if (typedBlock.has_children && depth < MAX_BLOCK_DEPTH) {
        const childText = await extractBlockContent(notion, typedBlock.id, depth + 1);
        if (childText) parts.push(childText);
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return parts.join("\n");
}

/**
 * Extract the plain text string from a single Notion block.
 * Handles the most common block types.
 */
function extractTextFromBlock(block: BlockObjectResponse): string {
  const type = block.type;

  // Helper to join rich text array to plain string
  const richText = (arr: Array<{ plain_text: string }>): string =>
    arr.map((t) => t.plain_text).join("");

  switch (type) {
    case "paragraph":
      return richText(block.paragraph.rich_text);
    case "heading_1":
      return `# ${richText(block.heading_1.rich_text)}`;
    case "heading_2":
      return `## ${richText(block.heading_2.rich_text)}`;
    case "heading_3":
      return `### ${richText(block.heading_3.rich_text)}`;
    case "bulleted_list_item":
      return `• ${richText(block.bulleted_list_item.rich_text)}`;
    case "numbered_list_item":
      return `${richText(block.numbered_list_item.rich_text)}`;
    case "to_do":
      return `[${block.to_do.checked ? "x" : " "}] ${richText(block.to_do.rich_text)}`;
    case "toggle":
      return richText(block.toggle.rich_text);
    case "quote":
      return `> ${richText(block.quote.rich_text)}`;
    case "callout":
      return richText(block.callout.rich_text);
    case "code":
      return `\`\`\`${block.code.language}\n${richText(block.code.rich_text)}\n\`\`\``;
    case "equation":
      return block.equation.expression;
    case "table_row":
      return block.table_row.cells
        .map((cell) => richText(cell))
        .join(" | ");
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
 * Extract the title from a Notion page object.
 * Handles both regular pages (title property) and database rows (Name property).
 */
function extractPageTitle(page: PageObjectResponse): string {
  const props = page.properties;

  // Try common title property names
  for (const key of ["title", "Title", "Name", "name", "Page"]) {
    const prop = props[key];
    if (prop && prop.type === "title" && prop.title.length > 0) {
      return prop.title.map((t) => t.plain_text).join("");
    }
  }

  // Fallback: scan all properties for a title-type
  for (const prop of Object.values(props)) {
    if (prop.type === "title" && prop.title.length > 0) {
      return prop.title.map((t) => t.plain_text).join("");
    }
  }

  return "Untitled";
}
```

---

## 9. Step 8: Sync Trigger Route (Manual Re-sync)

The existing `/api/sources/[sourceId]/sync/route.ts` needs a small update to support the `notion` source type.

**File:** `app/api/sources/[sourceId]/sync/route.ts`

Find the section that handles source types and add `notion`:

```diff
  if (source.type === "google_drive") {
    import("@/modules/sources/connectors/google-drive")
      .then(({ syncGoogleDrive }) => {
        syncGoogleDrive(source.id).catch((err) => {
          console.error(`[Manual Sync] Direct background sync failed for ${source.id}:`, err);
        });
      })
      .catch((err) => {
        console.error("[Manual Sync] Failed to dynamically load sync module:", err);
      });
+ } else if (source.type === "notion") {
+   import("@/modules/sources/connectors/notion")
+     .then(({ syncNotion }) => {
+       syncNotion(source.id).catch((err) => {
+         console.error(`[Manual Sync] Notion sync failed for ${source.id}:`, err);
+       });
+     })
+     .catch((err) => {
+       console.error("[Manual Sync] Failed to dynamically load Notion sync module:", err);
+     });
  } else {
    console.warn(`[Manual Sync] ⚠️ Ingestion sync for type "${source.type}" is not supported yet.`);
```

---

## 10. Step 9: Sources UI — Add Notion Card

### 10.1 Add Notion to Available Sources List

**File:** `app/dashboard/sources/components/SourcesMain.tsx`

Find where the "Connect a Source" section is, and add a Notion connector card:

```tsx
// Add this to your available sources/connector cards section

{/* Notion Connector Card */}
<div className="source-available-card" id="notion-connector-card">
  <div className="source-card-icon notion-icon">
    {/* Notion logo SVG */}
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#000"/>
      <path
        d="M5 5.5C5 4.67 5.67 4 6.5 4H15L19 8V18.5C19 19.33 18.33 20 17.5 20H6.5C5.67 20 5 19.33 5 18.5V5.5Z"
        fill="white"
      />
      <path d="M14 4L19 9H15C14.45 9 14 8.55 14 8V4Z" fill="#E6E6E6"/>
      <path d="M8 11H16M8 14H13" stroke="#999" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  </div>
  <div className="source-card-body">
    <h4 className="source-card-title">Notion</h4>
    <p className="source-card-desc">
      Connect your Notion workspace to sync pages and databases.
    </p>
  </div>
  <button
    className="source-card-btn"
    id="connect-notion-btn"
    onClick={() => {
      const workspaceId = "00000000-0000-0000-0000-000000000001";
      const userId = "00000000-0000-0000-0000-000000000002";
      window.location.href = `/api/sources/notion/connect?workspaceId=${workspaceId}&userId=${userId}`;
    }}
  >
    Connect
  </button>
</div>
```

### 10.2 Add Notion Source Icon to Connected Sources List

In the same file, find where source type icons are rendered (likely in a switch/map over `source.type`) and add:

```tsx
// In your source type icon renderer
case "notion":
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#000"/>
      <path d="M5 5.5C5 4.67 5.67 4 6.5 4H15L19 8V18.5C19 19.33 18.33 20 17.5 20H6.5C5.67 20 5 19.33 5 18.5V5.5Z" fill="white"/>
      <path d="M14 4L19 9H15C14.45 9 14 8.55 14 8V4Z" fill="#E6E6E6"/>
      <path d="M8 11H16M8 14H13" stroke="#999" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
```

---

## 11. Step 10: RAG Integration (Already Works)

The existing RAG pipeline in `/api/ask/route.ts` queries `document_chunks` by `workspace_id` — **no changes are required**. Notion content will automatically appear in RAG results once synced, because:

1. The sync stores chunks in the same `document_chunks` Supabase table
2. The metadata includes `source_type: "notion"` for proper attribution
3. The `Ask Corely` interface already displays source citations per chunk

---

## 12. Step 11: Testing the Full Flow

### 12.1 Pre-flight Checks

```bash
# 1. Verify environment variables are set
echo $NOTION_CLIENT_ID
echo $NOTION_CLIENT_SECRET
echo $NOTION_REDIRECT_URI

# 2. Confirm the package is installed
node -e "require('@notionhq/client'); console.log('✅ Notion SDK available')"

# 3. Ensure dev server is running
npm run dev
```

### 12.2 Share Pages with Your Integration (Critical Step)

> ⚠️ **This is the most commonly missed step.**

Before testing, you must explicitly share Notion pages with your integration:
1. Open any page in Notion
2. Click **"..."** (three dots) in the top right → **"Connections"**
3. Find your integration name → Click to enable
4. Repeat for each page/database you want to sync

Alternatively, share an entire top-level page (which shares all its children).

### 12.3 Test OAuth Flow

```
1. Open: http://localhost:3000/dashboard/sources
2. Click "Connect Notion"
3. You'll be redirected to Notion's authorization page
4. Select which pages to grant access → Click "Allow access"
5. You should be redirected back to /dashboard/sources?connected=notion&sourceId=...
6. The source card should appear with status "syncing"
7. After a few seconds/minutes, status should change to "synced"
```

### 12.4 Verify Data in Supabase

```sql
-- Check the source was created
SELECT id, name, type, status, items_indexed, last_synced_at
FROM sources WHERE type = 'notion';

-- Check documents were synced
SELECT title, file_type, url FROM documents
WHERE source_id = '<your-source-id>'
ORDER BY indexed_at DESC;

-- Check chunks were embedded
SELECT COUNT(*) as chunk_count FROM document_chunks
WHERE source_id = '<your-source-id>';
```

### 12.5 Test RAG Query

```
1. Open: http://localhost:3000/dashboard/ask-corely
2. Ask a question that should be answered from your Notion content
3. Verify the answer includes Notion page citations
```

---

## 13. Troubleshooting

### Error: `"Could not find integration with id..."`
**Cause:** The integration isn't shared on the pages you're trying to sync.  
**Fix:** In Notion, share the page with your integration via **... → Connections → [Your Integration]**.

---

### Error: `"token_exchange_failed"` on callback
**Cause:** The `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`, or `NOTION_REDIRECT_URI` is wrong.  
**Fix:**
1. Check your `.env.local` values against the Notion Developer Portal
2. Ensure the redirect URI in `.env.local` exactly matches what's registered in the portal (no trailing slashes)

---

### Error: `"missing_params"` on callback
**Cause:** The state parameter was not passed through the OAuth flow.  
**Fix:** Ensure the connect route properly sets the `state` query parameter and the redirect URL is correct.

---

### Status stays `"syncing"` forever
**Cause:** The background sync crashed or is still running.  
**Fix:**
1. Check the terminal running `npm run dev` for error messages
2. Check `npm run worker:dev` logs
3. Force reset:
```sql
UPDATE sources SET status = 'idle', error_message = NULL WHERE type = 'notion';
```
Then trigger a manual sync via the UI.

---

### No pages synced (itemsIndexed = 0)
**Cause:** No pages were shared with your integration.  
**Fix:** Share at least one top-level Notion page with your integration and re-sync.

---

### `"Rate limit reached"` errors from Notion API
**Cause:** Notion has rate limits of ~3 requests/second for integrations.  
**Fix:** Add exponential backoff in the sync connector. Notion returns `HTTP 429` with a `Retry-After` header.

Add to the connector:
```typescript
async function retryable<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = (err as { status?: number }).status === 429;
      if (isRateLimit && i < retries - 1) {
        await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}
```

---

## 14. Complete File Checklist

Use this checklist when implementing the Notion connector:

### New Files to Create

- [ ] `app/api/sources/notion/connect/route.ts` — OAuth initiation endpoint
- [ ] `app/api/sources/notion/callback/route.ts` — OAuth callback + token exchange
- [ ] `modules/sources/connectors/notion.ts` — Full sync engine

### Existing Files to Modify

- [ ] `app/api/sources/[sourceId]/sync/route.ts` — Add `notion` branch
- [ ] `app/dashboard/sources/components/SourcesMain.tsx` — Add Notion card + icon
- [ ] `prisma/schema.prisma` — Update `type` field comment (no migration needed)

### Environment Variables to Set

- [ ] `NOTION_CLIENT_ID` — From Notion Developer Portal
- [ ] `NOTION_CLIENT_SECRET` — From Notion Developer Portal
- [ ] `NOTION_REDIRECT_URI` — `http://localhost:3000/api/sources/notion/callback`

### Notion Developer Portal Configuration

- [ ] Created a **Public** integration (not Internal)
- [ ] Set redirect URI to match `NOTION_REDIRECT_URI`
- [ ] Enabled **Read content** capability
- [ ] Enabled **Read user information including email** capability
- [ ] (Testing) Shared at least one Notion page with the integration

### Verification Checklist

- [ ] `npm run build` passes with zero errors
- [ ] OAuth flow completes (source appears in dashboard)
- [ ] Source status changes from `syncing` → `synced`
- [ ] `documents` table has entries for synced pages
- [ ] `document_chunks` table has vectors with `source_type: "notion"`
- [ ] Ask Corely returns answers citing Notion pages

---

## Appendix: Notion Block Types Reference

| Block Type | Extracted As |
|-----------|-------------|
| `paragraph` | Plain text |
| `heading_1` | `# Heading` |
| `heading_2` | `## Heading` |
| `heading_3` | `### Heading` |
| `bulleted_list_item` | `• Item` |
| `numbered_list_item` | `Item text` |
| `to_do` | `[x] Item` or `[ ] Item` |
| `toggle` | Toggle title text (children fetched recursively) |
| `quote` | `> Quote text` |
| `callout` | Callout text |
| `code` | `` ```lang\ncode\n``` `` |
| `equation` | Math expression string |
| `table_row` | `Cell 1 \| Cell 2 \| ...` |
| `divider` | `---` |
| `child_page` | `[Sub-page: Title]` |
| `child_database` | `[Database: Title]` |
| `image`, `video`, `file`, `pdf`, `embed` | *Skipped (no text content)* |
| `synced_block`, `template`, `link_to_page` | Recursed into for children |

---

*Generated for Corely MVP — Notion Connector v1.0*  
*Last updated: May 2026*
