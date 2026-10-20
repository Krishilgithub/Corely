# 🧠 Corely MVP — Product & Architecture Plan

> **Author:** Antigravity (Senior Product Engineer)
> **Date:** May 26, 2026
> **Status:** Planning Phase

---

## Table of Contents

1. [What is Corely?](#what-is-corely)
2. [MVP Philosophy](#mvp-philosophy)
3. [MVP Feature Scope](#mvp-feature-scope)
4. [Features NOT in MVP (Post-MVP)](#features-not-in-mvp-post-mvp)
5. [Architecture Decision: Modular Monolith vs. Monorepo](#architecture-decision)
6. [Recommended Architecture: Modular Monolith](#recommended-architecture)
7. [Tech Stack](#tech-stack)
8. [MVP Folder Structure](#mvp-folder-structure)
9. [Data Flow Diagram](#data-flow-diagram)
10. [Development Phases & Milestones](#development-phases--milestones)
11. [Success Metrics](#success-metrics)

---

## What is Corely?

**Corely** is an enterprise intelligence platform that acts as a **unified company brain**. It connects fragmented organizational data (Slack, Notion, Jira, HubSpot, Google Drive, etc.), synthesizes it using AI, and gives teams a single intelligent interface to:

- **Ask** natural language questions about their company
- **Surface** insights, blockers, and trends proactively
- **Automate** repetitive workflows with AI-driven triggers
- **Remember** organizational context persistently

The target user is the modern enterprise team — from founders to department heads — who drowns in data but hungers for actionable intelligence.

---

## MVP Philosophy

> **"Build the smallest product that proves the core hypothesis."**

Corely's core hypothesis is:
> *"Companies can significantly reduce the time spent searching, summarizing, and synthesizing internal information if all their data sources are funneled through a single AI-powered query interface."*

The MVP must prove this hypothesis to:
- Attract early enterprise customers / design partners
- Demonstrate technical feasibility of AI-over-your-company-data
- Generate enough signal to raise a seed round or onboard a paying customer

**MVP Constraint Rules:**
- ✅ Every feature must directly validate the core hypothesis
- ✅ Build for 1–3 design-partner companies, not 1,000
- ❌ No features that are "nice to have" or for a different user persona
- ❌ No features that require complex infrastructure before the AI core is proven

---

## MVP Feature Scope

### ✅ Feature 1: Data Source Connections (Sources)

The foundation. Without ingesting data, there is no product.

**In MVP:**
- Connect **3–5 core integrations**: Notion, Google Drive, Slack, Confluence, Jira
- OAuth 2.0 authentication flow for each connector
- Background sync (polling-based, every 15–30 min)
- Document chunking & embedding into a vector database (Pinecone / Qdrant)
- Sources management UI — add, remove, view sync status, items indexed
- Basic indexing pipeline: Fetch → Parse → Chunk → Embed → Store

**Why this is MVP:**
Without data ingestion, the AI assistant is useless. This is the "data moat" — the more sources connected, the more valuable Corely becomes.

---

### ✅ Feature 2: Ask Corely — AI Q&A Interface

The "wow" moment. This is the headline feature.

**In MVP:**
- Natural language query interface (the "Ask Corely" page)
- RAG (Retrieval-Augmented Generation) pipeline:
  1. Embed the user's query
  2. Semantic search across the company's vector store
  3. Retrieve top-K relevant chunks
  4. Build a context-enriched prompt
  5. Stream the answer from LLM (GPT-4o / Claude 3.5)
- Response includes **source attribution** (which document/tool each insight came from)
- Suggested prompts to guide first-time users
- Conversation history for the session
- Basic feedback system (👍 / 👎 on responses)

**Why this is MVP:**
This IS the product. The quality of this feature determines if Corely is worth anything.

---

### ✅ Feature 3: Workspace & Authentication

**In MVP:**
- Email/password auth + Google OAuth (via NextAuth.js / Clerk)
- Workspace creation (one workspace per company)
- Invite team members by email
- Role-based access: **Admin** and **Member**
  - Admin: can manage sources, members, settings
  - Member: can ask questions, view insights

**Why this is MVP:**
Multi-user enterprise product requires auth and workspace isolation from day one.

---

### ✅ Feature 4: Org Memory (Lightweight)

Persistent intelligence that grows over time.

**In MVP:**
- Auto-extract and store key facts, decisions, and people from indexed documents
- Simple "Memory" view showing saved organizational facts
- Manual ability to pin/save important Q&A exchanges to memory
- Memory is searchable and contributes to future query context

**Why this is MVP:**
This is the key differentiator vs. a standard AI chatbot. Corely "remembers" things about your company. This creates stickiness.

---

### ✅ Feature 5: Dashboard (Home Intelligence Hub)

The first screen users see every day.

**In MVP:**
- Personalized greeting with date
- 4 KPI cards: Documents Indexed, Sources Connected, Queries This Week, Time Saved
- "Ask Corely" quick input panel (links to full Ask page)
- Recent Activity feed (latest syncs, queries, and insights)
- A simple "Top Insights" section powered by a daily digest pipeline

**Why this is MVP:**
A dashboard creates a daily habit. Users need a reason to come back even when they don't have a specific question.

---

### ✅ Feature 6: Settings & Workspace Management

**In MVP:**
- Workspace profile (name, logo)
- Language & region
- Manage team members (invite, remove, change roles)
- Manage connected sources (view, disconnect, re-sync)
- Personal preferences (theme, default view)
- Billing & plan information (can be static for MVP — just show "Enterprise Plan")

**Why this is MVP:**
Without settings, the product feels like a prototype, not a product. Critical for enterprise trust.

---

## Features NOT in MVP (Post-MVP)

These are real features shown in the Corely design but deferred to post-MVP to focus on the core:

| Feature | Why Deferred |
|---|---|
| **Workflows / Automation Builder** | Complex to build well. Core value not proven yet. |
| **Actions (Autonomous AI Actions)** | High risk, needs a trust layer first. |
| **Teams / Org Chart** | Nice to have, not core to the hypothesis. |
| **Security (SSO, Audit Logs)** | Enterprise requirement — build when you have enterprise prospects. |
| **Advanced Insights / Analytics** | Need more usage data before surfacing meaningful patterns. |
| **Mobile App** | Web first, always. |
| **API Access for Developers** | Post-product-market fit. |
| **Zapier / Webhook integrations** | Too broad for MVP. |
| **White-labeling** | Enterprise tier feature. |
| **Custom AI models / Fine-tuning** | Post-PMF research investment. |

---

## Architecture Decision

### Option A: Modular Monolith

A single deployable unit where functionality is organized into well-defined internal modules (Auth, Sources, AI, Memory, Workflows), each with clear boundaries but sharing a single codebase, database, and deployment.

**Advantages:**
- ✅ Simple to develop, test, and deploy in early stages
- ✅ No distributed systems overhead (no inter-service latency, no gRPC/REST between services)
- ✅ Easy to refactor module boundaries before they calcify
- ✅ Single database = trivial joins and transactions across modules
- ✅ One CI/CD pipeline, one Docker container, one set of environment variables
- ✅ Faster onboarding — junior devs can understand the whole system
- ✅ Easy to extract a module into a microservice later when you have scale evidence

**Disadvantages:**
- ❌ Scaling the whole app to scale one bottleneck (e.g., the AI pipeline)
- ❌ Risk of module boundaries eroding over time ("big ball of mud")
- ❌ Deployment of a small change requires redeploying the whole application
- ❌ Long-term build times as codebase grows

---

### Option B: Monorepo (with Multiple Packages / Services)

Multiple independent packages (frontend, backend, AI engine, workers) within a single Git repository, managed by a tool like Turborepo or Nx.

**Advantages:**
- ✅ Clear separation of concerns from day one
- ✅ Independent deployability and scalability of services
- ✅ Different services can use different languages/runtimes (e.g., Python for AI, TypeScript for API)
- ✅ Shared packages (types, utils, UI library) are easy to reuse
- ✅ Scales well as the team grows (teams can own individual packages)

**Disadvantages:**
- ❌ Significantly higher setup complexity (Turborepo, Docker Compose, service discovery)
- ❌ Distributed systems problems appear immediately (network failures, data consistency, tracing)
- ❌ Slower iteration — deploying requires coordinating multiple services
- ❌ Overkill for a 1–5 person team building an MVP
- ❌ Higher infrastructure costs (multiple services on cloud)
- ❌ More complex local development (running 4–6 processes simultaneously)

---

### Option C: Microservices (Traditional)

Each feature/domain is a completely separate service, deployable and scalable independently.

**Advantages:**
- ✅ Maximum flexibility and scalability

**Disadvantages:**
- ❌ Way too premature for MVP stage
- ❌ Massive operational overhead
- ❌ Kills development velocity
- ❌ **Not recommended at any early stage**

---

## Recommended Architecture: Modular Monolith

> **Decision: Start with a Modular Monolith, architect it like a Monorepo.**

### Rationale

Corely is an AI-heavy product that will evolve rapidly. The most dangerous thing at this stage is not scalability — it's **premature architecture decisions that slow down iteration**. A modular monolith gives us:

1. **Speed**: Ship features in days, not weeks.
2. **Flexibility**: Module boundaries can be redefined as we learn what the product actually is.
3. **Upgrade path**: When a specific module (e.g., the AI ingestion pipeline) needs to scale independently, we extract it into a standalone service. This is the **"strangler fig" pattern**.

### The One Exception: AI/Ingestion Workers

The AI ingestion pipeline (document parsing, embedding, vector storage) is I/O-heavy and long-running. It should be a **background worker queue** from day one, even within the monolith:

- Use **BullMQ** (Redis-based job queue) for background jobs
- The API server enqueues jobs; a worker process processes them
- Both the API and worker share the same codebase but run as separate processes
- This is NOT a microservice — it's just a background worker. Same repo, same types, same DB.

This gives us 90% of the benefit of a separate AI service with 10% of the complexity.

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS + Vanilla CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Charts | Recharts |
| Auth Client | Clerk (or NextAuth.js) |

### Backend (API Layer — within Next.js)
| Layer | Technology |
|---|---|
| API | Next.js Route Handlers (App Router) |
| Auth | Clerk / NextAuth.js + JWT |
| ORM | Prisma |
| Database | PostgreSQL (via Supabase or Neon) |
| Background Jobs | BullMQ + Redis (Upstash) |
| File Storage | AWS S3 / Cloudflare R2 |

### AI / Intelligence Layer
| Layer | Technology |
|---|---|
| LLM | OpenAI GPT-4o / Anthropic Claude 3.5 |
| Embeddings | OpenAI text-embedding-3-small |
| Vector DB | Pinecone / Qdrant |
| RAG Framework | LangChain.js / Vercel AI SDK |
| Document Parsing | LlamaIndex / Unstructured.io |

### Infrastructure
| Layer | Technology |
|---|---|
| Hosting | Vercel (frontend) + Railway / Render (workers) |
| Queues | Upstash Redis (BullMQ) |
| Monitoring | Sentry |
| Analytics | PostHog |
| CI/CD | GitHub Actions |

---

## MVP Folder Structure

```
corely/
├── app/                          # Next.js App Router (Frontend + API)
│   ├── (auth)/                   # Auth pages (login, signup)
│   ├── (marketing)/              # Landing page, pricing, etc.
│   ├── dashboard/                # Protected dashboard pages
│   │   ├── page.tsx              # Home dashboard
│   │   ├── ask-corely/           # AI Q&A interface
│   │   ├── sources/              # Data source management
│   │   ├── memory/               # Org memory browser
│   │   ├── settings/             # Workspace settings
│   │   └── components/           # Shared dashboard components
│   └── api/                      # Next.js Route Handlers (REST API)
│       ├── auth/                 # Auth endpoints (Clerk webhooks etc.)
│       ├── sources/              # Source CRUD, OAuth callbacks
│       ├── ask/                  # AI query endpoint (streaming)
│       ├── memory/               # Memory CRUD
│       ├── workspace/            # Workspace & member management
│       └── webhooks/             # Inbound webhooks (Slack, etc.)
│
├── modules/                      # Core business logic (the "modular" part)
│   ├── auth/                     # Auth utilities, session helpers
│   ├── sources/                  # Source connectors, sync logic
│   │   ├── connectors/
│   │   │   ├── notion.ts
│   │   │   ├── slack.ts
│   │   │   ├── google-drive.ts
│   │   │   ├── confluence.ts
│   │   │   └── jira.ts
│   │   ├── sync-manager.ts       # Orchestrates sync jobs
│   │   └── types.ts
│   ├── ai/                       # AI core
│   │   ├── embeddings.ts         # Embedding generation
│   │   ├── rag.ts                # RAG pipeline
│   │   ├── llm.ts                # LLM client (OpenAI/Anthropic)
│   │   ├── chunker.ts            # Document chunking strategies
│   │   └── vector-store.ts       # Pinecone / Qdrant client
│   ├── memory/                   # Org memory extraction & retrieval
│   │   ├── extractor.ts          # Extract facts from documents
│   │   ├── store.ts              # Memory CRUD operations
│   │   └── types.ts
│   └── workspace/                # Workspace, teams, billing
│       ├── members.ts
│       └── types.ts
│
├── workers/                      # Background job processors
│   ├── index.ts                  # Worker entry point
│   ├── jobs/
│   │   ├── ingest-document.ts    # Parse, chunk, embed a document
│   │   ├── sync-source.ts        # Sync all docs from a source
│   │   └── daily-digest.ts       # Generate daily intelligence digest
│   └── queues.ts                 # BullMQ queue definitions
│
├── lib/                          # Shared utilities
│   ├── db.ts                     # Prisma client
│   ├── redis.ts                  # Redis/BullMQ client
│   ├── s3.ts                     # File storage client
│   └── logger.ts                 # Logging utility
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/
│
└── public/                       # Static assets
```

---

## Data Flow Diagram

```
User Browser
     │
     ▼
Next.js App (Vercel)
├── Dashboard UI
├── Ask Corely UI ──────────────────────────────────────────────┐
│                                                               │
└── API Route Handlers                                          │
    ├── POST /api/sources/connect ──► BullMQ Queue              │
    │                                      │                    │
    │               ┌───────────────────────┘                  │
    │               ▼                                           │
    │         Background Worker                                 │
    │         (Railway/Render)                                  │
    │         ┌──────────────────────────────────────┐          │
    │         │  1. Fetch documents from Source API  │          │
    │         │  2. Parse & chunk documents           │          │
    │         │  3. Generate embeddings (OpenAI)     │          │
    │         │  4. Store vectors in Pinecone        │          │
    │         │  5. Store metadata in PostgreSQL     │          │
    │         └──────────────────────────────────────┘          │
    │                                                           │
    └── POST /api/ask ◄─────────────────────────────────────────┘
         │
         ▼
    RAG Pipeline
    ┌──────────────────────────────────────────────┐
    │  1. Embed user query (OpenAI Embeddings)     │
    │  2. Semantic search → Pinecone               │
    │  3. Retrieve top-K relevant chunks           │
    │  4. Build context-enriched prompt            │
    │  5. Stream response from GPT-4o / Claude     │
    │  6. Include source attributions              │
    └──────────────────────────────────────────────┘
         │
         ▼
    Streamed response → Browser (Vercel AI SDK)
```

---

## Development Phases & Milestones

### Phase 1: Foundation (Weeks 1–2)
> Goal: Core infrastructure working end-to-end

- [ ] Project setup (Next.js 15, Prisma, PostgreSQL, Redis)
- [ ] Authentication (Clerk or NextAuth) — login, signup, workspace creation
- [ ] Database schema design (Workspaces, Users, Sources, Documents, Chunks, Memory)
- [ ] Basic dashboard UI (already designed ✅)
- [ ] Notion connector (OAuth + document fetch)
- [ ] Document ingestion pipeline (parse → chunk → embed → store in Pinecone)
- [ ] BullMQ worker setup for background ingestion

**Milestone:** A user can connect Notion and see their documents indexed.

---

### Phase 2: AI Core (Weeks 3–4)
> Goal: "Ask Corely" actually works

- [ ] RAG pipeline implementation (LangChain.js or Vercel AI SDK)
- [ ] Streaming response implementation (Server-Sent Events)
- [ ] Source attribution in responses
- [ ] "Ask Corely" UI connected to real backend (already designed ✅)
- [ ] Add Google Drive and Slack connectors
- [ ] Basic conversation history (in-session)
- [ ] Feedback system (👍 / 👎 stored in DB)

**Milestone:** A user can ask "What did we decide about our Q3 pricing strategy?" and get a real answer with sources.

---

### Phase 3: Memory & Intelligence (Weeks 5–6)
> Goal: Make Corely feel like it "knows" your company

- [ ] Org Memory extraction (auto-identify decisions, people, facts)
- [ ] Memory browser UI (already designed ✅)
- [ ] Memory influences future query context
- [ ] Daily digest pipeline (scheduled job → top insights email/dashboard)
- [ ] Dashboard home stats wired to real data
- [ ] Add Jira and Confluence connectors
- [ ] Improve sync reliability (retry logic, error handling)

**Milestone:** After one week of use, Corely surfaces a useful insight the user didn't ask for.

---

### Phase 4: Polish & Launch Readiness (Week 7–8)
> Goal: Ready for a design partner

- [ ] Workspace settings fully functional (already designed ✅)
- [ ] Member invite system
- [ ] Role-based access control (Admin vs. Member)
- [ ] Error states, empty states, loading states throughout the app
- [ ] Performance: query response under 3 seconds
- [ ] Security review: API rate limiting, input sanitization, auth on all endpoints
- [ ] Sentry error monitoring
- [ ] PostHog analytics integration
- [ ] Onboarding flow (5-step wizard for new workspaces)

**Milestone:** Hand the product to a design partner company and watch them use it without guidance.

---

## Success Metrics

| Metric | MVP Target |
|---|---|
| Time-to-first-insight | < 10 min after connecting first source |
| Query response time | < 3 seconds (p95) |
| Answer relevance (user rating) | > 70% thumbs up |
| Daily Active Use | At least 1 query/day per design partner |
| Source sync reliability | > 95% success rate |
| Retention (Week 1 → Week 2) | > 60% of design partner users return |
| NPS from design partners | > 40 |

---

## Summary

| Decision | Choice |
|---|---|
| **Architecture** | Modular Monolith (with BullMQ background workers) |
| **MVP Scope** | Auth + Sources (5 connectors) + Ask Corely + Memory + Dashboard |
| **Deferred** | Workflows, Actions, Teams, SSO, Analytics, Mobile |
| **Frontend** | Next.js 15 + TypeScript + TailwindCSS (already built ✅) |
| **Backend** | Next.js Route Handlers + Prisma + PostgreSQL |
| **AI** | RAG with OpenAI + Pinecone/Qdrant + LangChain.js |
| **Jobs** | BullMQ + Upstash Redis |
| **Hosting** | Vercel (app) + Railway (workers) |
| **Timeline** | 8 weeks to design-partner-ready MVP |

---

> **The goal is not to build everything. The goal is to build the one thing that proves Corely is worth building.**
