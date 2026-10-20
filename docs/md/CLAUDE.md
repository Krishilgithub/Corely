# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Corely is a Next.js (App Router) SaaS app: an "institutional memory" / RAG engine that connects to a
workspace's data sources (Notion, Gmail, Google Drive, GitHub, Slack, Linear), ingests and embeds their
content, and answers natural-language questions ("Ask Corely") against that indexed knowledge with
inline citations and temporal-freshness scoring.

`README.md` is the stock `create-next-app` boilerplate — ignore it. The root `*.md` design docs
(`MVP_PLAN.md`, `FEATURE_2_STATEFUL_ASK.md`, `NOTION_CONNECTOR.md`, `GOOGLE_DRIVE_CONNECTOR.md`,
`MISSING_CONNECTORS_IMPLEMENTATION_GUIDE.md`) are planning notes that predate the current code —
useful for intent, not authoritative about what is actually built.

`Corely.md` is a project status note (frontmatter with `status: paused`, recent decisions, open
actions). It records plans such as the HubSpot and Microsoft 365 connectors, which are **not built
yet**. Read it for context. Do not treat it as a description of the code.

`AGENTS.md` (imported above) says to read `node_modules/next/dist/docs/`. That folder does not
exist in the installed version (`next@^15.5.18`). Use the official Next.js 15 docs instead.

## Commands

```bash
npm run dev                # Next.js dev server
npm run build              # prisma generate && next build
npm run lint               # eslint (flat config: next/core-web-vitals + next/typescript)
npm run worker             # run the BullMQ/standby background worker once (tsx workers/index.ts)
npm run worker:dev         # same, with watch mode
npm run prisma:push        # prisma db push (schema -> DB, no migration files)
npm run prisma:generate    # regenerate the Prisma client
```

Two maintenance scripts have no npm script — run them with `tsx` directly:

```bash
npx tsx scripts/init-pgvector.ts   # required once per database; see below
npx tsx scripts/reindex.ts         # re-sync every google_drive Source
```

`prisma db push` **cannot** create the vector column — `DocumentChunk.embedding` is
`Unsupported("vector")`, so Prisma skips it. `scripts/init-pgvector.ts` is what enables the `vector`
extension, adds `document_chunks.embedding vector(1536)`, creates the HNSW cosine index (ivfflat
fallback), and defines the `match_chunks()` SQL function. A fresh database cannot serve retrieval
until it has run.

There is no configured test runner (no jest/vitest config, no `test` script). The one existing
`*.test.ts` file (`modules/sources/connectors/gmail-utils.test.ts`) is not currently wired to run —
don't assume `npm test` exists.

Some packages the running app needs are listed under `devDependencies`: `@prisma/adapter-pg` and
`pg` (imported by `lib/db.ts`) and `tsx` (used by `npm run worker`). Never install with
`--omit=dev` or prune dev packages, or the app fails at start.

### Docker

`Dockerfile` builds a 3-stage image (Debian `node:22-bookworm-slim`, not Alpine, because the
`engineType = "library"` Prisma engine needs OpenSSL). `docker-compose.yml` runs the app plus a
`redis:7-alpine` service. There is no database container: `DATABASE_URL` points at the hosted
Supabase Postgres.

```bash
docker compose up -d            # first run: build and start
docker compose up -d --build    # rebuild after code changes
docker compose run --rm app npx prisma db push                 # once per database
docker compose run --rm app npx tsx scripts/init-pgvector.ts   # once per database
docker compose run --rm app npm run worker                     # optional; normally idle
```

Things that break the container if changed:

- Env comes from `.env` (required) then `.env.local` (wins on clashes), read at start, never baked
  into the image. Compose overrides `REDIS_URL` to `redis://redis:6379`, because `localhost` inside
  the container is the container itself.
- Keep host port `3000`. `NEXT_PUBLIC_APP_URL` and every OAuth redirect URI use
  `http://localhost:3000`.
- The build sets `NODE_OPTIONS=--max-old-space-size=4096`. Without it, the TypeScript check runs out
  of memory. Docker needs about 5 GB available.
- The build needs no secrets. It relies on the env fallbacks and on `app/dashboard/page.tsx` being
  `force-dynamic`.
- `.dockerignore` excludes all `*.md`, so docs are not in the image.

The `scripts/fix-*.js` files and the root-level `fix_*.js` / `replace_css.js` /
`refactor_dark_mode_recursive.js` / `delete_mock_memory.*` files are one-off codemods from past
cleanups. They are not part of the build and are not live tooling.

## Architecture

### Data model (`prisma/schema.prisma`)

Everything is scoped under a `Workspace`. Postgres via `@prisma/adapter-pg` (not the default Prisma
engine), with a `pgvector` `Unsupported("vector")` column on `DocumentChunk.embedding` for similarity
search — vector queries are written as raw SQL (`prisma.$queryRaw`), not through the Prisma query
builder (see `app/api/ask/route.ts`). `WorkspaceRole` holds a `permissions: Json` string array checked
via `lib/rbac.ts`. Beyond the ingestion models (`Source` / `Document` / `DocumentChunk`) the schema
covers chat (`ChatSession` / `ChatMessage`), org memory (`OrgMemory` / `MemorySnapshot`), dashboard
surfaces (`DashboardInsight` / `DashboardAction`), `Workflow` / `WorkflowActivity`, `Team`, `ApiKey`,
`AuditLog` and `Notification`.

### Two clients, one database

`lib/db.ts` (Prisma, `DATABASE_URL`) and `lib/supabase.ts` (`supabaseAdmin`, service-role) talk to the
**same** Postgres tables — `DocumentChunk` is `@@map("document_chunks")`. Supabase is not a separate
store; it exists because the Prisma client cannot write the `Unsupported("vector")` embedding column.

Rule of thumb: anything that writes or reads an `embedding` goes through `supabaseAdmin` or raw SQL;
everything else goes through Prisma. `linear.ts` and `slack.ts` deviate — they
`prisma.documentChunk.create()` a row and then `supabaseAdmin.insert()` the same `id` with the
embedding, which collides on the primary key and is only `console.error`'d. Follow the `gmail.ts` /
`google-drive.ts` / `github.ts` shape (a single `supabaseAdmin.from("document_chunks").insert({ ...,
embedding })`) instead.

### Auth & permissions

- `lib/auth-server.ts`: `auth()` reads a JWT from the `corely_session` cookie (`jose`, HS256, 24h
  expiry) and loads the `User` + `Workspace` + `WorkspaceRole`. Throws `"Unauthorized"` on failure —
  route handlers catch this specific message to return 401 (see error-handling convention below).
  Includes an "auto-heal" step that assigns the Admin `WorkspaceRole` to any `role: "admin"` user
  missing a `roleId`.
- `requirePermission(permission)` layers on top of `auth()` for permission-gated actions.
- `lib/rbac.ts` defines the `Permissions` map and four `DefaultRoles` (Admin/Developer/Product
  Manager/Viewer) created per-workspace via `createDefaultRolesForWorkspace`.
- Client side, `app/lib/auth-context.tsx` (`AuthProvider`, mounted in `app/layout.tsx`) holds the
  user/workspace/permissions and exposes `hasPermission()`.

### API routes (`app/api/**/route.ts`)

Every handler follows the same shape: `try { const { user, workspace } = await auth(); ... } catch`,
returning `successResponse(data)` / `errorResponse(message, status)` from `lib/api-response.ts`
(uniform `{ success, data|error, version }` envelope). `dynamic = "force-dynamic"` is set on routes
that must not be statically cached (auth-dependent or streaming routes).

`app/api/ask/route.ts` is the core RAG endpoint:

1. Rate limits per user (`lib/rate-limit.ts` — Redis-backed with an in-memory fallback when
   `REDIS_URL` is unset or offline; 20 requests / 60s).
2. If a `sessionId` is passed, persists the question as a `ChatMessage` and loads the last 6 messages
   as conversation history — this is what makes Ask Corely stateful. It also renames a session still
   titled `"New Conversation"` from the first question.
3. Builds the permission-visible source set: the user's own sources, plus sources whose
   `config.permissions === "everyone"`, plus **all** workspace sources if the user is `admin` or holds
   `sources:read`. An empty set falls back to a sentinel UUID so the query matches nothing rather than
   everything.
4. Runs a raw pgvector cosine query (`prisma.$queryRaw`) over `document_chunks` joined to `documents`,
   filtered to the workspace + allowed sources, `similarity > 0.55`, `LIMIT 8`.
5. Scores per-source-type temporal confidence (`calculateTemporalConfidence`): points/day decay from
   the document's `updated_at` — Slack 2.0 (most ephemeral), default 0.5, Linear 0.4, GitHub 0.3,
   Notion/Google Docs 0.2 (most durable). The freshness label is injected into the prompt so the model
   flags stale answers.
6. Streams the `gpt-4o` chat completion back as SSE (`text/event-stream`, hand-rolled — **not** the
   `ai` SDK's stream helpers), then persists the full answer and its sources as a `ChatMessage`.

When no chunk clears 0.55 it returns a fixed "no knowledge" response without calling the model —
don't remove that hallucination guard.

### Source connectors (`modules/sources/connectors/*.ts`)

One file per integration (`notion.ts`, `gmail.ts`, `google-drive.ts`, `github.ts`, `slack.ts`,
`linear.ts`). Each exports a single `sync<Provider>(sourceId)` entry point that follows the same
pipeline: load + decrypt the stored OAuth token (`lib/crypto.ts`, AES via `crypto-js`, key from
`ENCRYPTION_KEY`) → paginate the provider API → dedupe via SHA-256 `contentHash` on `Document` →
chunk (`modules/ai/chunker.ts`, 400-word chunks / 50-word overlap) → embed
(`lib/openai.ts#generateEmbedding`, `text-embedding-3-small` with automatic fallback to
`text-embedding-ada-002` on model/permission errors) → insert into `document_chunks` via
`supabaseAdmin` → update `Source.status` (`idle` → `syncing` → `synced`/`error`) and purge documents
no longer present upstream. Provider calls go through a `withRetry` wrapper that special-cases 401
(raises a "reconnect required" error) and 429 (exponential backoff).

OAuth is a `connect` + `callback` route pair per provider under `app/api/sources/<provider>/`.
`app/api/webhooks/{drive,notion}/route.ts` handle provider-initiated change notifications.

When adding a new connector, follow this exact pipeline shape rather than inventing a new one.

### Second ingestion path: manual upload

`app/api/sources/upload/route.ts` bypasses the connector pipeline entirely: it takes a `FormData`
file, extracts text (PDF via `pdf-parse` — note the `DOMMatrix` / `ImageData` / `Path2D` globalThis
polyfills needed to run pdf.js under Node; DOCX via `mammoth`; anything else as plain text), strips
null bytes for Postgres, finds-or-creates a single `type: "manual_upload"` `Source` per workspace,
then chunks/embeds/inserts with the same `chunkText` + `generateEmbedding` + `supabaseAdmin` calls.
Changes to chunking or embedding need to be made here as well as in the connectors.

### Sync triggering: no real queue in the request path

`lib/redis.ts` defines a BullMQ `sourceQueue` and `workers/index.ts` is a standalone worker process
that pulls jobs (`sync-google-drive`, `sync-notion`, etc.) off it — but `POST
/api/sources/[sourceId]/sync` does **not** enqueue jobs onto `sourceQueue`. It sets `status:
"syncing"` in the DB and calls the connector's `sync*` function directly via a dynamic `import()`,
fire-and-forget, returning immediately to the client. `workers/index.ts` self-detects whether Redis
is reachable at startup (1.5s probe) and falls back to a no-op "standby" heartbeat mode if not. Treat
the BullMQ path as present-but-currently-unused infrastructure, not the active code path — verify
which path a change actually affects before assuming job queuing is involved.

### Frontend

- Marketing/landing pages live at `app/<page>/` with sections in **both** `app/components/` and
  `components/landing/` — check both before adding or editing a section. `LenisProvider` (smooth
  scroll), GSAP, Framer Motion and react-three-fiber (`Hero3D`) are landing-only.
- The product lives under `app/dashboard/`, with shared chrome in `app/dashboard/components/`
  (`Sidebar`, `Topbar`, `CommandPalette`, `AskCorelyPanel`, …) and per-feature components in
  `app/dashboard/<feature>/components/`.
- Most dashboard pages are `"use client"` and fetch the `/api/*` envelope directly.
  `app/dashboard/page.tsx` is the exception: a server component that calls `auth()` + `prisma` and
  hands data to `DashboardClient.tsx`. Match whichever style the page you're editing already uses.
- Tailwind with `darkMode: ["class"]`, shadcn-style primitives on Radix, `cn()` from `lib/utils.ts`.

### Surfaces that are thinner than they look

- `POST /api/workflows/[id]/run` **simulates** a run: it increments `executions`, stamps `lastRun`,
  and writes a `success` `WorkflowActivity`. Nothing is actually executed.
- `lib/insights-generator.ts` is rule-based, derived from recent DB activity with `date-fns` — there
  is no LLM call anywhere in the insights path.

### Environment variables

No `.env.example` exists; all env access has hardcoded dummy/dev fallbacks so the app builds without
secrets set (`lib/db.ts`, `lib/openai.ts`, `lib/supabase.ts`, `lib/redis.ts`, etc.) — don't remove
those fallbacks. Variables in active use: `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`,
`OPENAI_API_KEY`, `REDIS_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `EMAIL_USER`/`EMAIL_PASS`, and OAuth
client id/secret/redirect pairs per provider (`GOOGLE_*`, `GMAIL_*`, `GITHUB_*`, `NOTION_*`,
`SLACK_*`, `LINEAR_*`).

### Path alias

`@/*` maps to the repo root (`tsconfig.json`), e.g. `@/lib/db`, `@/modules/sources/connectors/notion`.
