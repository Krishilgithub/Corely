# 🗂️ Corely MVP — Feature 1: Google Drive Connector

> **Status:** Implementation Guide
> **Prerequisite:** Supabase project already set up ✅
> **Goal:** Connect Google Drive → Parse documents → Embed → Store in Supabase (pgvector) → Query via RAG

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Step 1: Supabase Database Schema](#step-1-supabase-database-schema)
3. [Step 2: Enable pgvector in Supabase](#step-2-enable-pgvector-in-supabase)
4. [Step 3: Google Cloud Console Setup](#step-3-google-cloud-console-setup)
5. [Step 4: Install All Required Packages](#step-4-install-all-required-packages)
6. [Step 5: Environment Variables](#step-5-environment-variables)
7. [Step 6: Prisma Schema](#step-6-prisma-schema)
8. [Step 7: Google Drive OAuth Flow (Backend)](#step-7-google-drive-oauth-flow-backend)
9. [Step 8: Document Ingestion Pipeline](#step-8-document-ingestion-pipeline)
10. [Step 9: Background Worker (BullMQ)](#step-9-background-worker-bullmq)
11. [Step 10: RAG Query Pipeline](#step-10-rag-query-pipeline)
12. [Step 11: Connect the Sources UI](#step-11-connect-the-sources-ui)
13. [Step 12: Testing the Full Flow](#step-12-testing-the-full-flow)
14. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
User clicks "Connect Google Drive"
         │
         ▼
Google OAuth 2.0 (Google Cloud Console)
         │  (returns authorization code)
         ▼
Next.js API Route → Exchange code for tokens
         │  (stores refresh_token in Supabase)
         ▼
BullMQ Job Queue (Redis) ← enqueue "sync-google-drive" job
         │
         ▼
Background Worker
┌─────────────────────────────────────────────────────┐
│  1. Fetch file list from Google Drive API           │
│  2. Download each file (Docs, Sheets, PDFs, txt)    │
│  3. Parse file content (text extraction)            │
│  4. Chunk text into segments (512 tokens each)      │
│  5. Generate embeddings (OpenAI text-embedding-3)   │
│  6. Store vectors in Supabase pgvector              │
│  7. Store document metadata in Supabase postgres    │
│  8. Update source sync status                       │
└─────────────────────────────────────────────────────┘
         │
         ▼
"Ask Corely" Query
┌─────────────────────────────────────────────────────┐
│  1. Embed the user's question                       │
│  2. pgvector similarity search → top-K chunks       │
│  3. Build prompt with retrieved context             │
│  4. Stream response from GPT-4o                     │
│  5. Return answer + source attributions             │
└─────────────────────────────────────────────────────┘
```

---

## Step 1: Supabase Database Schema

Go to your **Supabase Dashboard → SQL Editor** and run these SQL statements one by one.

### 1.1 Enable Required Extensions

```sql
-- Enable pgvector for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 1.2 Workspaces Table

```sql
CREATE TABLE workspaces (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'free',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 1.3 Users Table

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL,
  name            TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 1.4 Sources Table

```sql
CREATE TABLE sources (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  type            TEXT NOT NULL,                     -- 'google_drive' | 'notion' | 'slack' ...
  name            TEXT NOT NULL,                     -- Display name, e.g. "My Drive"
  status          TEXT NOT NULL DEFAULT 'idle',      -- 'idle' | 'syncing' | 'synced' | 'error'
  error_message   TEXT,
  -- OAuth tokens (encrypted in production)
  access_token    TEXT,
  refresh_token   TEXT,
  token_expiry    TIMESTAMPTZ,
  -- Sync metadata
  last_synced_at  TIMESTAMPTZ,
  items_indexed   INTEGER NOT NULL DEFAULT 0,
  -- Source-specific config (JSON)
  config          JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast workspace lookups
CREATE INDEX idx_sources_workspace_id ON sources(workspace_id);
```

### 1.5 Documents Table

```sql
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_id       UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  -- Original file metadata
  external_id     TEXT NOT NULL,          -- Google Drive file ID
  title           TEXT NOT NULL,
  file_type       TEXT,                   -- 'doc' | 'sheet' | 'pdf' | 'txt'
  url             TEXT,                   -- Link back to original file
  -- Extracted content
  raw_content     TEXT,                   -- Full extracted text
  summary         TEXT,                   -- AI-generated summary (optional)
  -- Sync status
  indexed_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Deduplication
  content_hash    TEXT,
  UNIQUE(source_id, external_id)
);

CREATE INDEX idx_documents_source_id ON documents(source_id);
CREATE INDEX idx_documents_workspace_id ON documents(workspace_id);
```

### 1.6 Document Chunks Table (with pgvector)

```sql
CREATE TABLE document_chunks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  source_id       UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  -- Chunk content
  content         TEXT NOT NULL,
  chunk_index     INTEGER NOT NULL,           -- Position within document
  token_count     INTEGER,
  -- The actual vector embedding (1536 dims for text-embedding-3-small)
  embedding       vector(1536),
  -- Metadata for filtering
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_chunks_workspace_id ON document_chunks(workspace_id);
-- HNSW index for fast approximate nearest-neighbor search
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### 1.7 Memory Table

```sql
CREATE TABLE memory_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,   -- 'fact' | 'decision' | 'person' | 'pinned_qa'
  content         TEXT NOT NULL,
  source_doc_id   UUID REFERENCES documents(id),
  embedding       vector(1536),
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 1.8 Create the Similarity Search Function

```sql
-- This function is called during RAG to find relevant chunks
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding   vector(1536),
  workspace_filter  UUID,
  match_threshold   FLOAT DEFAULT 0.7,
  match_count       INT DEFAULT 5
)
RETURNS TABLE (
  id          UUID,
  content     TEXT,
  document_id UUID,
  source_id   UUID,
  metadata    JSONB,
  similarity  FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.content,
    dc.document_id,
    dc.source_id,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE
    dc.workspace_id = workspace_filter
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## Step 2: Enable pgvector in Supabase

pgvector is already available in Supabase but must be activated:

1. Go to **Supabase Dashboard**
2. Click **Database** → **Extensions**
3. Search for **vector**
4. Toggle it **ON**

> **Note:** The `CREATE EXTENSION IF NOT EXISTS vector;` SQL above also handles this. Either method works.

---

## Step 3: Google Cloud Console Setup

### 3.1 Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project** (top nav) → **New Project**
3. Name it: `Corely Production` (or similar)
4. Click **Create**

### 3.2 Enable Required APIs

1. In the left sidebar, go to **APIs & Services → Library	**
2. Search for and **Enable** these APIs:
   - `Google Drive API`
   - `Google Docs API` ← Needed to export Docs as plain text
   - `Google Sheets API` ← Needed to read Sheets content

### 3.3 Configure the OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** user type → **Create**
3. Fill in:
   - **App name:** `Corely`
   - **User support email:** your email
   - **Developer contact email:** your email
4. Click **Save and Continue**
5. On **Scopes** page, click **Add or Remove Scopes** and add:
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/documents.readonly`
   - `https://www.googleapis.com/auth/spreadsheets.readonly`
6. Click **Update** → **Save and Continue**
7. On **Test users** page, add your own email for testing
8. Click **Save and Continue** → **Back to Dashboard**

> ⚠️ **IMPORTANT:** For production, you'll need to submit the app for Google's verification review. For development/testing, the "Test users" you add can use the integration without verification.

### 3.4 Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. Select **Application type: Web application**
4. **Name:** `Corely Web Client`
5. Under **Authorized redirect URIs**, add:
   - For development: `http://localhost:3000/api/sources/google-drive/callback`
   - For production: `https://corely-khaki.vercel.app/api/sources/google-drive/callback`
6. Click **Create**
7. **Copy and save** the `Client ID` and `Client Secret` — you'll need these in Step 5.

---

## Step 4: Install All Required Packages

Run the following in your project root (`d:\Projects\Company Brain\corely`):

```powershell
# Core data and auth
npm install @supabase/supabase-js prisma @prisma/client

# Google APIs
npm install googleapis

# AI and embeddings
npm install openai ai

# Background job queue
npm install bullmq ioredis

# Document text extraction
npm install pdf-parse mammoth

# Text chunking utility
npm install langchain @langchain/openai

# Encryption for storing tokens securely
npm install crypto-js
npm install --save-dev @types/crypto-js

# Utility
npm install dotenv zod
```

### Initialize Prisma

```powershell
npx prisma init --datasource-provider postgresql
```

This creates a `prisma/schema.prisma` file. You'll update it in Step 6.

---

## Step 5: Environment Variables

Create or update your `.env.local` file:

```env
# ─── App ─────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── Supabase ────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...

# Direct database URL for Prisma (from Supabase → Settings → Database → Connection string → URI)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# ─── Google OAuth ─────────────────────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/sources/google-drive/callback

# ─── OpenAI ───────────────────────────────────────────────────
OPENAI_API_KEY=sk-proj-your-openai-key

# ─── Redis (for BullMQ job queue) ─────────────────────────────
# Option A: Local Redis (for development)
REDIS_URL=redis://localhost:6379

# Option B: Upstash Redis (recommended for production)
# UPSTASH_REDIS_URL=rediss://your-upstash-url
# UPSTASH_REDIS_TOKEN=your-upstash-token

# ─── Token Encryption ─────────────────────────────────────────
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-32-byte-hex-encryption-key

# ─── Worker ───────────────────────────────────────────────────
# Set to 'worker' when running the background worker process
NODE_ROLE=api
```

### How to get Supabase URLs:

1. Go to **Supabase Dashboard → Settings → API**
2. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **Settings → Database → Connection string** → select **URI** → copy it into `DATABASE_URL` and `DIRECT_URL`

---

## Step 6: Prisma Schema

Update `prisma/schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  directUrl         = env("DIRECT_URL")
  extensions        = [vector, uuid_ossp(map: "uuid-ossp")]
}

model Workspace {
  id        String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  name      String
  slug      String   @unique
  plan      String   @default("free")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  users     User[]
  sources   Source[]
  documents Document[]
  chunks    DocumentChunk[]

  @@map("workspaces")
}

model User {
  id          String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  workspaceId String    @map("workspace_id") @db.Uuid
  email       String    @unique
  name        String?
  avatarUrl   String?   @map("avatar_url")
  role        String    @default("member")
  createdAt   DateTime  @default(now()) @map("created_at")

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  sources     Source[]

  @@map("users")
}

model Source {
  id            String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  workspaceId   String    @map("workspace_id") @db.Uuid
  userId        String    @map("user_id") @db.Uuid
  type          String                              // 'google_drive'
  name          String
  status        String    @default("idle")          // 'idle' | 'syncing' | 'synced' | 'error'
  errorMessage  String?   @map("error_message")
  accessToken   String?   @map("access_token")      // Encrypted
  refreshToken  String?   @map("refresh_token")     // Encrypted
  tokenExpiry   DateTime? @map("token_expiry")
  lastSyncedAt  DateTime? @map("last_synced_at")
  itemsIndexed  Int       @default(0) @map("items_indexed")
  config        Json      @default("{}")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  workspace     Workspace  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user          User       @relation(fields: [userId], references: [id])
  documents     Document[]

  @@map("sources")
}

model Document {
  id          String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  workspaceId String    @map("workspace_id") @db.Uuid
  sourceId    String    @map("source_id") @db.Uuid
  externalId  String    @map("external_id")
  title       String
  fileType    String?   @map("file_type")
  url         String?
  rawContent  String?   @map("raw_content")
  contentHash String?   @map("content_hash")
  indexedAt   DateTime? @map("indexed_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  workspace   Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  source      Source          @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  chunks      DocumentChunk[]

  @@unique([sourceId, externalId])
  @@map("documents")
}

model DocumentChunk {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  workspaceId String   @map("workspace_id") @db.Uuid
  documentId  String   @map("document_id") @db.Uuid
  sourceId    String   @map("source_id") @db.Uuid
  content     String
  chunkIndex  Int      @map("chunk_index")
  tokenCount  Int?     @map("token_count")
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")

  // NOTE: The `embedding` vector column is managed directly via Supabase SQL,
  // not through Prisma (Prisma doesn't support vector type yet).
  // Prisma manages all other columns; raw SQL handles vector insert/query.

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  document    Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@map("document_chunks")
}
```

### Run Prisma Migrations

```powershell
# Generate the Prisma client
npx prisma generate

# Push the schema to your Supabase database
npx prisma db push
```

> **Note:** The vector embedding column on `document_chunks` was already created via raw SQL in Step 1. Prisma manages the other columns. Embeddings are inserted using the Supabase JS client directly.

---

## Step 7: Google Drive OAuth Flow (Backend)

Create the following API route files:

### 7.1 Initiate OAuth — `app/api/sources/google-drive/connect/route.ts`

```typescript
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",      // Gets a refresh_token
    prompt: "consent",           // Forces consent screen every time (ensures refresh_token)
    scope: scopes,
    // Pass your workspace/user context in state
    state: JSON.stringify({
      workspaceId: "YOUR_WORKSPACE_ID", // Replace with actual session workspace ID
      userId: "YOUR_USER_ID",           // Replace with actual session user ID
    }),
  });

  return NextResponse.redirect(authUrl);
}
```

### 7.2 OAuth Callback — `app/api/sources/google-drive/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import CryptoJS from "crypto-js";
import { sourceQueue } from "@/workers/queues";

const prisma = new PrismaClient();

function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, process.env.ENCRYPTION_KEY!).toString();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle user denial
  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=access_denied`);
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?error=missing_params`);
  }

  const { workspaceId, userId } = JSON.parse(stateRaw);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Exchange the authorization code for tokens
  const { tokens } = await oauth2Client.getToken(code);

  // Get user's Drive info for the display name
  oauth2Client.setCredentials(tokens);
  const driveClient = google.drive({ version: "v3", auth: oauth2Client });
  const aboutResponse = await driveClient.about.get({ fields: "user" });
  const driveName = `${aboutResponse.data.user?.displayName}'s Drive`;

  // Save the source to the database with encrypted tokens
  const source = await prisma.source.create({
    data: {
      workspaceId,
      userId,
      type: "google_drive",
      name: driveName,
      status: "idle",
      accessToken:  tokens.access_token  ? encrypt(tokens.access_token)  : null,
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      tokenExpiry:  tokens.expiry_date   ? new Date(tokens.expiry_date)  : null,
      config: {
        email: aboutResponse.data.user?.emailAddress,
      },
    },
  });

  // Immediately enqueue the first sync job
  await sourceQueue.add("sync-google-drive", {
    sourceId: source.id,
    workspaceId,
  }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });

  // Redirect to sources page
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sources?connected=google_drive`
  );
}
```

### 7.3 Sync Status API — `app/api/sources/[sourceId]/status/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { sourceId: string } }
) {
  const source = await prisma.source.findUnique({
    where: { id: params.sourceId },
    select: {
      id: true,
      name: true,
      status: true,
      itemsIndexed: true,
      lastSyncedAt: true,
      errorMessage: true,
    },
  });

  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  return NextResponse.json(source);
}
```

### 7.4 Trigger Manual Sync — `app/api/sources/[sourceId]/sync/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sourceQueue } from "@/workers/queues";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { sourceId: string } }
) {
  const source = await prisma.source.findUnique({
    where: { id: params.sourceId },
  });

  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  await sourceQueue.add("sync-google-drive", {
    sourceId: source.id,
    workspaceId: source.workspaceId,
  });

  await prisma.source.update({
    where: { id: params.sourceId },
    data: { status: "syncing" },
  });

  return NextResponse.json({ message: "Sync started" });
}
```

---

## Step 8: Document Ingestion Pipeline

### 8.1 Token Decryption Utility — `lib/crypto.ts`

```typescript
import CryptoJS from "crypto-js";

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, process.env.ENCRYPTION_KEY!).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.ENCRYPTION_KEY!);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

### 8.2 Supabase Admin Client — `lib/supabase-admin.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

// Use the service role key — only use server-side, NEVER expose to client
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
```

### 8.3 OpenAI Client — `lib/openai.ts`

```typescript
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",   // 1536 dimensions, cheap & fast
    input: text.trim(),
  });
  return response.data[0].embedding;
}
```

### 8.4 Text Chunker — `modules/ai/chunker.ts`

```typescript
interface Chunk {
  content: string;
  chunkIndex: number;
  tokenCount: number;
}

const CHUNK_SIZE = 512;          // tokens per chunk
const CHUNK_OVERLAP = 64;        // overlapping tokens for context continuity

// Simple word-based chunker (production should use tiktoken for exact token counting)
export function chunkText(text: string): Chunk[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: Chunk[] = [];
  let i = 0;
  let chunkIndex = 0;

  while (i < words.length) {
    const chunkWords = words.slice(i, i + CHUNK_SIZE);
    const content = chunkWords.join(" ");

    if (content.trim().length < 20) {
      i += CHUNK_SIZE;
      continue;
    }

    chunks.push({
      content,
      chunkIndex,
      tokenCount: chunkWords.length,
    });

    chunkIndex++;
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}
```

### 8.5 Google Drive Sync Module — `modules/sources/connectors/google-drive.ts`

```typescript
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { PrismaClient } from "@prisma/client";
import { decrypt } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateEmbedding } from "@/lib/openai";
import { chunkText } from "@/modules/ai/chunker";
import crypto from "crypto";

const prisma = new PrismaClient();

// Supported MIME types for text extraction
const SUPPORTED_TYPES: Record<string, string> = {
  "application/vnd.google-apps.document":       "text/plain",   // Google Docs
  "application/vnd.google-apps.spreadsheet":    "text/csv",     // Google Sheets
  "application/pdf":                            "application/pdf",
  "text/plain":                                 "text/plain",
  "text/markdown":                              "text/plain",
};

export async function syncGoogleDrive(sourceId: string): Promise<void> {
  console.log(`[Google Drive] Starting sync for source: ${sourceId}`);

  // 1. Load source from DB
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source || !source.refreshToken) {
    throw new Error(`Source ${sourceId} not found or missing refresh token`);
  }

  // 2. Set up OAuth client with stored (decrypted) tokens
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({
    refresh_token: decrypt(source.refreshToken),
    access_token:  source.accessToken  ? decrypt(source.accessToken)  : undefined,
  });
  // Auto-refresh tokens
  oauth2Client.on("tokens", async (tokens) => {
    await prisma.source.update({
      where: { id: sourceId },
      data: {
        accessToken: tokens.access_token ? encrypt(tokens.access_token) : undefined,
        tokenExpiry: tokens.expiry_date  ? new Date(tokens.expiry_date) : undefined,
      },
    });
  });

  const driveClient = google.drive({ version: "v3", auth: oauth2Client });
  const docsClient  = google.docs({ version: "v1", auth: oauth2Client });

  // 3. Update status to 'syncing'
  await prisma.source.update({
    where: { id: sourceId },
    data: { status: "syncing", errorMessage: null },
  });

  let totalIndexed = 0;
  let pageToken: string | undefined;

  try {
    do {
      // 4. List files (paginated)
      const listResponse = await driveClient.files.list({
        pageSize: 50,
        pageToken,
        fields: "nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink, size)",
        q: `trashed = false and (${Object.keys(SUPPORTED_TYPES).map(t => `mimeType = '${t}'`).join(" or ")})`,
      });

      const files = listResponse.data.files || [];
      pageToken = listResponse.data.nextPageToken || undefined;

      // 5. Process each file
      for (const file of files) {
        if (!file.id || !file.name || !file.mimeType) continue;

        try {
          await processFile(
            file as { id: string; name: string; mimeType: string; modifiedTime?: string | null; webViewLink?: string | null },
            sourceId,
            source.workspaceId,
            driveClient,
            oauth2Client
          );
          totalIndexed++;
        } catch (fileError) {
          console.error(`[Google Drive] Failed to process file ${file.name}:`, fileError);
          // Continue with other files
        }
      }
    } while (pageToken);

    // 6. Update source as synced
    await prisma.source.update({
      where: { id: sourceId },
      data: {
        status: "synced",
        lastSyncedAt: new Date(),
        itemsIndexed: totalIndexed,
      },
    });

    console.log(`[Google Drive] Sync complete. Indexed ${totalIndexed} files.`);
  } catch (error) {
    await prisma.source.update({
      where: { id: sourceId },
      data: {
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}

async function processFile(
  file: { id: string; name: string; mimeType: string; modifiedTime?: string | null; webViewLink?: string | null },
  sourceId: string,
  workspaceId: string,
  driveClient: ReturnType<typeof google.drive>,
  auth: OAuth2Client
): Promise<void> {
  console.log(`[Google Drive] Processing: ${file.name}`);

  // Extract text content based on file type
  let rawContent = "";

  if (file.mimeType === "application/vnd.google-apps.document") {
    // Export Google Doc as plain text
    const exportRes = await driveClient.files.export(
      { fileId: file.id, mimeType: "text/plain" },
      { responseType: "text" }
    );
    rawContent = exportRes.data as string;

  } else if (file.mimeType === "application/vnd.google-apps.spreadsheet") {
    // Export Google Sheet as CSV
    const exportRes = await driveClient.files.export(
      { fileId: file.id, mimeType: "text/csv" },
      { responseType: "text" }
    );
    rawContent = exportRes.data as string;

  } else if (file.mimeType === "application/pdf") {
    // Download PDF and extract text
    const downloadRes = await driveClient.files.get(
      { fileId: file.id, alt: "media" },
      { responseType: "arraybuffer" }
    );
    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(Buffer.from(downloadRes.data as ArrayBuffer));
    rawContent = pdfData.text;

  } else if (file.mimeType.startsWith("text/")) {
    // Plain text files
    const downloadRes = await driveClient.files.get(
      { fileId: file.id, alt: "media" },
      { responseType: "text" }
    );
    rawContent = downloadRes.data as string;
  }

  if (!rawContent || rawContent.trim().length < 10) {
    console.log(`[Google Drive] Skipping ${file.name} — no extractable content`);
    return;
  }

  // Compute hash for deduplication
  const contentHash = crypto.createHash("md5").update(rawContent).digest("hex");

  // Check if document already exists and hasn't changed
  const existingDoc = await prisma.document.findUnique({
    where: { sourceId_externalId: { sourceId, externalId: file.id } },
  });

  if (existingDoc?.contentHash === contentHash) {
    console.log(`[Google Drive] Skipping ${file.name} — unchanged`);
    return;
  }

  // Upsert the document record
  const document = await prisma.document.upsert({
    where: { sourceId_externalId: { sourceId, externalId: file.id } },
    create: {
      workspaceId,
      sourceId,
      externalId: file.id,
      title: file.name,
      fileType: file.mimeType,
      url: file.webViewLink || undefined,
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

  // Delete old chunks (we'll re-index them fresh)
  await supabaseAdmin
    .from("document_chunks")
    .delete()
    .eq("document_id", document.id);

  // Chunk the text
  const chunks = chunkText(rawContent);
  console.log(`[Google Drive] Generated ${chunks.length} chunks for ${file.name}`);

  // Generate embeddings and store each chunk
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content);

    await supabaseAdmin.from("document_chunks").insert({
      workspace_id:  workspaceId,
      document_id:   document.id,
      source_id:     sourceId,
      content:       chunk.content,
      chunk_index:   chunk.chunkIndex,
      token_count:   chunk.tokenCount,
      embedding:     JSON.stringify(embedding),    // Supabase accepts vectors as JSON arrays
      metadata: {
        document_title: file.name,
        file_type:      file.mimeType,
        url:            file.webViewLink,
        source_type:    "google_drive",
      },
    });
  }
}
```

---

## Step 9: Background Worker (BullMQ)

### 9.1 Queue Definitions — `workers/queues.ts`

```typescript
import { Queue } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,   // Required for BullMQ
});

export const sourceQueue = new Queue("sources", { connection });
```

### 9.2 Worker Entry Point — `workers/index.ts`

```typescript
import { Worker } from "bullmq";
import { connection } from "./queues";
import { syncGoogleDrive } from "@/modules/sources/connectors/google-drive";

console.log("🚀 Corely Worker started");

const worker = new Worker(
  "sources",
  async (job) => {
    console.log(`[Worker] Processing job: ${job.name}`, job.data);

    if (job.name === "sync-google-drive") {
      await syncGoogleDrive(job.data.sourceId);
    }
  },
  {
    connection,
    concurrency: 3,        // Process up to 3 sync jobs at once
  }
);

worker.on("completed", (job) => {
  console.log(`[Worker] ✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] ❌ Job ${job?.id} failed:`, err.message);
});

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
```

### 9.3 Add Worker Script to package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "worker": "tsx workers/index.ts",
    "worker:dev": "tsx watch workers/index.ts"
  }
}
```

Install tsx:

```powershell
npm install --save-dev tsx
```

---

## Step 10: RAG Query Pipeline

### `app/api/ask/route.ts`

```typescript
import { NextRequest } from "next/server";
import { openai, generateEmbedding } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  const { question, workspaceId } = await request.json();

  if (!question || !workspaceId) {
    return new Response("Missing question or workspaceId", { status: 400 });
  }

  // 1. Embed the user's question
  const queryEmbedding = await generateEmbedding(question);

  // 2. Semantic search via pgvector similarity
  const { data: chunks, error } = await supabaseAdmin.rpc("match_chunks", {
    query_embedding: queryEmbedding,
    workspace_filter: workspaceId,
    match_threshold: 0.65,
    match_count: 6,
  });

  if (error) {
    console.error("pgvector search error:", error);
    return new Response("Search failed", { status: 500 });
  }

  // 3. Build context from retrieved chunks
  const context = (chunks || [])
    .map((c: { content: string; metadata: Record<string, string> }, i: number) =>
      `[Source ${i + 1}: ${c.metadata.document_title}]\n${c.content}`
    )
    .join("\n\n---\n\n");

  const sources = (chunks || []).map((c: { metadata: Record<string, string> }) => ({
    title: c.metadata.document_title,
    url:   c.metadata.url,
    type:  c.metadata.source_type,
  }));

  // 4. Stream the AI response
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are Corely, an AI assistant with deep knowledge of this company's internal data.
Answer questions based ONLY on the provided context. Be concise and specific.
If the context doesn't contain the answer, say so honestly.
Always cite which documents your answer is based on.`,
      },
      {
        role: "user",
        content: `Context from company documents:\n\n${context}\n\n---\n\nQuestion: ${question}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  // 5. Stream the response with source metadata in headers
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      // First, send the sources metadata as a special chunk
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`)
      );

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "text", text })}\n\n`)
          );
        }
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
    },
  });
}
```

---

## Step 11: Connect the Sources UI

### 11.1 Update Sources Page `app/dashboard/sources/page.tsx`

Add a "Connect Google Drive" button that calls the OAuth endpoint:

```typescript
// Add this button in your sources page
<a
  href="/api/sources/google-drive/connect"
  className="src-btn-primary"
>
  <img src="/icons/google-drive.svg" alt="" width={16} height={16} />
  Connect Google Drive
</a>
```

### 11.2 Detect Connection Success via URL param

```typescript
"use client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function useConnectionSuccess() {
  const params = useSearchParams();

  useEffect(() => {
    if (params.get("connected") === "google_drive") {
      // Show success toast notification
      console.log("Google Drive connected!");
      // Remove the query param from URL
      window.history.replaceState({}, "", "/dashboard/sources");
    }
    if (params.get("error") === "access_denied") {
      console.log("User denied Google Drive access");
    }
  }, [params]);
}
```

---

## Step 12: Testing the Full Flow

### 12.1 Start Redis (local development)

**Option A — Using Docker:**

```powershell
docker run -d -p 6379:6379 redis:latest
```

**Option B — Windows WSL:**

```bash
sudo apt install redis-server
redis-server
```

### 12.2 Start the Development Server and Worker

Open **two separate terminals**:

**Terminal 1 — Next.js dev server:**

```powershell
npm run dev
```

**Terminal 2 — Background worker:**

```powershell
npm run worker:dev
```

### 12.3 End-to-End Test Checklist

1. **[ ]** Go to `http://localhost:3000/dashboard/sources`
2. **[ ]** Click **"Connect Google Drive"**
3. **[ ]** Complete the Google OAuth consent screen
4. **[ ]** Verify you are redirected back with `?connected=google_drive` in the URL
5. **[ ]** Check Supabase → `sources` table — a new row should exist with `status = 'syncing'`
6. **[ ]** Watch **Terminal 2** (worker) — you should see file processing logs
7. **[ ]** After ~1-2 minutes, check `sources` table — status should be `synced`
8. **[ ]** Check `documents` table — should have rows for each indexed file
9. **[ ]** Check `document_chunks` table — should have embedding vectors stored
10. **[ ]** Go to `http://localhost:3000/dashboard/ask-corely`
11. **[ ]** Type a question about content from your Google Drive
12. **[ ]** Verify you get a streamed answer with source attributions

### 12.4 Verify pgvector is working

Run this SQL in Supabase SQL Editor:

```sql
-- Check that embeddings are stored correctly
SELECT
  id,
  content,
  metadata->>'document_title' AS document,
  array_length(embedding::float[], 1) AS vector_dimensions
FROM document_chunks
LIMIT 5;
```

Expected output: `vector_dimensions = 1536`

---

## Troubleshooting

| Problem                      | Likely Cause                   | Fix                                                                                        |
| ---------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| Google OAuth returns 403     | App not in test users list     | Add your Google email to**Test Users** in Cloud Console                              |
| `refresh_token` is null    | `prompt: "consent"` not set  | Revoke app access in[Google Security](https://myaccount.google.com/permissions) and reconnect |
| Redis connection refused     | Redis not running              | Start Redis with `docker run -d -p 6379:6379 redis`                                      |
| `vector` extension missing | pgvector not enabled           | Run `CREATE EXTENSION IF NOT EXISTS vector;` in Supabase SQL Editor                      |
| Embedding insert fails       | Wrong vector dimensions        | Ensure `embedding vector(1536)` in schema matches `text-embedding-3-small` output      |
| PDF extraction fails         | `pdf-parse` import issue     | Use dynamic import:`const pdfParse = (await import('pdf-parse')).default`                |
| Prisma push fails            | Pooler URL used for migrations | Use `DIRECT_URL` (port 5432, not 6543) for schema migrations                             |
| Worker not processing        | Queue name mismatch            | Ensure `new Queue("sources")` and `new Worker("sources", ...)` use the same name       |

---

## Summary of What You're Building

```
Google Drive (OAuth) ──► Supabase (metadata + vectors) ──► Ask Corely (RAG)

Tools Used:
├── googleapis         → Drive, Docs, Sheets APIs
├── Supabase pgvector  → Vector storage + similarity search (NO separate Pinecone needed!)
├── OpenAI             → text-embedding-3-small + gpt-4o
├── BullMQ + Redis     → Async ingestion pipeline
├── Prisma             → ORM for all non-vector Supabase tables
└── Next.js App Router → API routes + streaming UI
```

> **💡 Key advantage:** By using Supabase's built-in `pgvector` extension, you have **one database** for all your data — no need for a separate Pinecone/Qdrant account. This simplifies architecture dramatically for the MVP.
