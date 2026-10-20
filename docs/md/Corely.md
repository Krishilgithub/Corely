---
type: project
status: paused
owner: Krishil Agrawal
started: 2026-05-26
last_signal: 2026-08-20
tags: [project, saas, side-project]
---

# Corely

> A Next.js "institutional memory" RAG SaaS: connects a workspace's data sources (Notion, Gmail,
> Google Drive, GitHub, Slack, Linear) and answers natural-language questions against the indexed
> content with inline citations and temporal-freshness scoring.

<!-- agent:begin section=status -->
## Current status

Built solo over ~1 week (2026-05-26 → 2026-06-02), then **dormant for ~2.5 months** — no commits
since 2026-06-02. Scoping/planning resumed 2026-08-19/20 in a Claude Code session (see Recent
signal below). See `CLAUDE.md` at the repo root for the full architecture writeup this status
summarizes.

What's actually built, verified against the repo (not assumed):

- Next.js App Router + Prisma/Postgres (`pgvector` for embeddings) + Supabase (chunk storage) +
  OpenAI (`text-embedding-3-small`, `gpt-4o` streaming) + JWT cookie auth + workspace RBAC.
- **Six source connectors fully implemented end-to-end**: Notion, Gmail, Google Drive, GitHub,
  Slack, Linear — each with OAuth connect/callback routes, a sync pipeline (fetch → dedupe via
  content hash → chunk → embed → store), and UI wiring.
- The RAG endpoint (`/api/ask`) has a hallucination guard: refuses to answer below a 0.55
  cosine-similarity threshold, and decays source confidence over time at a per-source-type rate
  (Slack decays fastest, Notion/Google Docs slowest).
- A BullMQ queue + worker process exist but are **not actually used** — the sync-trigger route
  bypasses the queue and calls connector code directly via a fire-and-forget dynamic import. Worth
  remembering so a future session doesn't assume job-queuing is in play.

## Recent signal

- **2026-08-19** — Scoped two new connectors: **HubSpot** (CRM objects, standard OAuth+REST, no
  blockers) and **Microsoft 365** (Outlook Mail + Calendar + Teams + OneDrive/SharePoint, all under
  one Graph API OAuth app; Teams channel-message scopes likely need tenant-admin consent). Both
  confirmed technically feasible, neither built yet. Slack and Linear connectors were re-confirmed
  to already exist in the codebase (not new work).
- **2026-08-19** — Competitive research: this product category is not novel — direct overlap with
  Glean, Onyx (open-source), ZeroForget AI, Supermemory, and Coworker AI, all of which already
  connect the same source set and answer with citations. ZeroForget AI in particular already does
  the same temporal/staleness-decay angle Corely uses.
- **2026-08-19** — Discussed packaging as a downloadable desktop app (Electron/Tauri wrapping the
  existing web app — the same approach Notion Desktop and WhatsApp Desktop use, not a
  rearchitecture). Not started; main wrinkle flagged is reworking OAuth redirect handling for a
  native shell.
- **2026-08-20** — Moved this project note (and all vault-sync output) from the personal "Krishil
  Vault" Obsidian vault into this repo — project-specific documentation stays colocated with the
  project going forward, not in the personal PKM vault.

## Open actions

None tracked yet — this has been scoping/planning conversation, not a committed build. Worth
turning into a concrete next step once a build target is picked (HubSpot connector vs. MS365
connector vs. desktop packaging).

## Blocked on

Nothing external. Next step is a prioritization decision, not a dependency.
<!-- agent:end section=status -->

## Context

Architecture, for anyone (human or agent) picking this back up — full detail lives in `CLAUDE.md`:

- One file per connector under `modules/sources/connectors/*.ts`, all following the same pipeline
  shape (decrypt stored OAuth token → paginate provider API → dedupe via SHA-256 content hash →
  chunk ~400 words/50-word overlap → embed → insert into Supabase `document_chunks`). New
  connectors (HubSpot, MS365) should follow this exact shape rather than inventing a new one.
- `Source.type` and `Source.config` are untyped string/JSON columns — adding a new connector type
  needs no schema migration, just new code + a new string value.
- No `.env.example`; every env var has a hardcoded dummy fallback so the app builds without secrets.

## Related

`CLAUDE.md` · `AGENTS.md`

<!-- ==== BELOW THIS LINE IS YOURS — THIS AGENT WILL NEVER TOUCH IT ==== -->

## Feature ideas

- Learn your personalized tone of messaging
- Give your *persona*
- Automatically organize your inbox
- LinkedIn Organizer
- Requirements of the CEO
- Why not make own jira
- BRD, PRD and all the generators
