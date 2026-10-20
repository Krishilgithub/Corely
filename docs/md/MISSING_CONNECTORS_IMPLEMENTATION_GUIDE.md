# Corely Missing Connectors Implementation Guide

> Status: Implementation plan for the four connectors called out in `COMPANY_BRAIN_DETAILED_SYSTEM_AUDIT.md`
> Scope: Slack, Gmail, GitHub, and Linear
> Existing baseline: Google Drive and Notion already follow the working Corely connector pattern.

## 1. Why These Four Connectors

The system audit says Corely currently promises six connectors but only delivers two:

- Delivered: Google Drive, Notion
- Missing: Slack, Gmail, GitHub, Linear

The audit also notes that Slack is the highest-priority missing connector because it is usually the company's primary communication channel. After Slack, Gmail captures email-based decisions, GitHub captures engineering decisions, and Linear captures roadmap and issue-tracking context.

Important note: `MVP_PLAN.md` and the current Sources modal also mention Confluence. That can still be added later, but this guide focuses on the four "missing connectors" explicitly named by the audit: Slack, Gmail, GitHub, and Linear.

## 2. Current Connector Architecture In Corely

Corely already has enough foundation to add these connectors without a major database redesign.

Current working flow:

```text
User clicks Connect
  -> /api/sources/{provider}/connect
  -> provider OAuth consent screen
  -> /api/sources/{provider}/callback
  -> Source row created with encrypted tokens
  -> sync module fetches remote objects
  -> documents table stores source records
  -> document_chunks table stores embedded chunks
  -> Ask Corely uses existing pgvector retrieval
```

Relevant existing files:

- `app/api/sources/google-drive/connect/route.ts`
- `app/api/sources/google-drive/callback/route.ts`
- `app/api/sources/notion/connect/route.ts`
- `app/api/sources/notion/callback/route.ts`
- `modules/sources/connectors/google-drive.ts`
- `modules/sources/connectors/notion.ts`
- `app/api/sources/[sourceId]/sync/route.ts`
- `workers/index.ts`
- `lib/crypto.ts`
- `lib/openai.ts`
- `modules/ai/chunker.ts`
- `prisma/schema.prisma`

All four new connectors should reuse the same storage model:

- `Source.type`: one of `slack`, `gmail`, `github`, `linear`
- `Source.accessToken`: encrypted provider access token
- `Source.refreshToken`: encrypted refresh token when available
- `Source.tokenExpiry`: token expiry when available
- `Source.config`: provider-specific JSON such as workspace IDs, team IDs, selected repositories, sync cursors, and permission hints
- `Document.externalId`: stable provider object ID
- `Document.fileType`: provider object type such as `slack_thread`, `gmail_message`, `github_issue`, `linear_issue`
- `Document.rawContent`: text sent to chunking and embedding
- `Document.contentHash`: hash used to skip unchanged objects
- `DocumentChunk.metadata`: source attribution, timestamps, URLs, and future permission metadata

## 3. Shared Implementation Pattern

Create these files for each connector:

```text
app/api/sources/{connector}/connect/route.ts
app/api/sources/{connector}/callback/route.ts
modules/sources/connectors/{connector}.ts
```

Then update these shared files:

```text
app/api/sources/[sourceId]/sync/route.ts
workers/index.ts
app/dashboard/sources/components/SourcesMain.tsx
```

Each connector module should export one function:

```ts
export async function syncSlack(sourceId: string): Promise<void> {}
export async function syncGmail(sourceId: string): Promise<void> {}
export async function syncGitHub(sourceId: string): Promise<void> {}
export async function syncLinear(sourceId: string): Promise<void> {}
```

Every sync function should follow this sequence:

```text
1. Load Source by sourceId.
2. Decrypt token(s).
3. Mark Source.status = "syncing".
4. Fetch provider objects using pagination and incremental cursor when possible.
5. Convert each remote object into stable text.
6. Hash content and skip unchanged documents.
7. Upsert into documents.
8. Delete stale chunks for changed documents.
9. Chunk text with chunkText(...).
10. Embed each chunk with generateEmbedding(...).
11. Insert chunks into document_chunks with provider metadata.
12. Store latest cursor in Source.config.
13. Mark Source.status = "synced", update lastSyncedAt and itemsIndexed.
14. On failure, mark Source.status = "error" and save errorMessage.
```

## 4. Recommended Connector Priority

1. Slack
2. Gmail
3. GitHub
4. Linear

Reasoning:

- Slack fixes the biggest product gap named in the audit.
- Gmail adds executive/customer decision context that rarely exists in docs.
- GitHub adds engineering memory and helps explain why product/technical choices were made.
- Linear adds roadmap context and links strategy to execution.

## 5. Shared Source Dispatch Changes

Update `app/api/sources/[sourceId]/sync/route.ts` with the four new source types:

```ts
} else if (source.type === "slack") {
  import("@/modules/sources/connectors/slack")
    .then(({ syncSlack }) => syncSlack(source.id).catch(console.error))
    .catch(console.error);
} else if (source.type === "gmail") {
  import("@/modules/sources/connectors/gmail")
    .then(({ syncGmail }) => syncGmail(source.id).catch(console.error))
    .catch(console.error);
} else if (source.type === "github") {
  import("@/modules/sources/connectors/github")
    .then(({ syncGitHub }) => syncGitHub(source.id).catch(console.error))
    .catch(console.error);
} else if (source.type === "linear") {
  import("@/modules/sources/connectors/linear")
    .then(({ syncLinear }) => syncLinear(source.id).catch(console.error))
    .catch(console.error);
}
```

Update `workers/index.ts` if you want Redis/BullMQ-backed sync instead of direct background imports:

```ts
case "sync-slack": {
  const { sourceId } = job.data as { sourceId: string };
  const { syncSlack } = await import("../modules/sources/connectors/slack");
  await syncSlack(sourceId);
  break;
}
case "sync-gmail": {
  const { sourceId } = job.data as { sourceId: string };
  const { syncGmail } = await import("../modules/sources/connectors/gmail");
  await syncGmail(sourceId);
  break;
}
case "sync-github": {
  const { sourceId } = job.data as { sourceId: string };
  const { syncGitHub } = await import("../modules/sources/connectors/github");
  await syncGitHub(sourceId);
  break;
}
case "sync-linear": {
  const { sourceId } = job.data as { sourceId: string };
  const { syncLinear } = await import("../modules/sources/connectors/linear");
  await syncLinear(sourceId);
  break;
}
```

## 6. Shared OAuth State

Use the existing state pattern from Google Drive and Notion:

```ts
const state = Buffer.from(JSON.stringify({ workspaceId, userId })).toString("base64url");
```

For production, improve this before launch:

- Add a nonce.
- Store nonce server-side or sign the state with `jose`.
- Validate callback state before creating a source.
- Never trust workspaceId/userId from the browser without checking the authenticated session.

## 7. Shared Content Builder Shape

Each connector should normalize remote objects into a common structure:

```ts
type NormalizedConnectorDocument = {
  externalId: string;
  title: string;
  fileType: string;
  url?: string;
  rawContent: string;
  updatedAt?: string;
  metadata: Record<string, unknown>;
};
```

This keeps provider APIs isolated from the storage pipeline.

Suggested helper for every connector:

```ts
async function indexDocument(
  doc: NormalizedConnectorDocument,
  sourceId: string,
  workspaceId: string
) {
  const contentHash = crypto.createHash("sha256").update(doc.rawContent).digest("hex");

  const existing = await prisma.document.findUnique({
    where: { sourceId_externalId: { sourceId, externalId: doc.externalId } },
    select: { id: true, contentHash: true },
  });

  if (existing?.contentHash === contentHash) return false;

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
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content);
    await supabaseAdmin.from("document_chunks").insert({
      workspace_id: workspaceId,
      document_id: document.id,
      source_id: sourceId,
      content: chunk.content,
      chunk_index: chunk.chunkIndex,
      token_count: chunk.tokenCount,
      embedding,
      metadata: doc.metadata,
    });
  }

  return true;
}
```

## 8. Slack Connector

### 8.1 Goal

Index public/private channel messages, replies, and lightweight file metadata so Ask Corely can answer questions like:

- "What decision did we make about pricing last week?"
- "Which customer escalation was discussed in sales-support?"
- "Who approved the Q2 launch plan?"

### 8.2 Provider Setup

Create a Slack app at `api.slack.com/apps`.

OAuth redirect URL:

```text
http://localhost:3000/api/sources/slack/callback
https://your-production-domain.com/api/sources/slack/callback
```

Recommended bot scopes:

```text
channels:history
channels:read
groups:history
groups:read
im:history
im:read
mpim:history
mpim:read
users:read
team:read
files:read
```

Start with public channels only if you want a faster MVP:

```text
channels:history
channels:read
users:read
team:read
```

### 8.3 Packages

```powershell
npm install @slack/web-api
```

### 8.4 Environment Variables

```env
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:3000/api/sources/slack/callback
```

### 8.5 Files

```text
app/api/sources/slack/connect/route.ts
app/api/sources/slack/callback/route.ts
modules/sources/connectors/slack.ts
```

### 8.6 Connect Route

Build an authorization URL:

```ts
const authUrl = new URL("https://slack.com/oauth/v2/authorize");
authUrl.searchParams.set("client_id", process.env.SLACK_CLIENT_ID!);
authUrl.searchParams.set("scope", [
  "channels:read",
  "channels:history",
  "groups:read",
  "groups:history",
  "users:read",
  "team:read",
].join(","));
authUrl.searchParams.set("redirect_uri", process.env.SLACK_REDIRECT_URI!);
authUrl.searchParams.set("state", state);
```

### 8.7 Callback Route

Exchange `code`:

```ts
const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    client_secret: process.env.SLACK_CLIENT_SECRET!,
    code,
    redirect_uri: process.env.SLACK_REDIRECT_URI!,
  }),
});
```

Save source:

```ts
await prisma.source.create({
  data: {
    workspaceId,
    userId,
    type: "slack",
    name: `${teamName} (Slack)`,
    status: "idle",
    accessToken: encrypt(botAccessToken),
    config: {
      slackTeamId,
      teamName,
      botUserId,
      lastSyncTs: null,
      selectedChannelIds: [],
    },
  },
});
```

### 8.8 Sync Strategy

Use `conversations.list` to fetch channels, then `conversations.history` and `conversations.replies`.

Recommended first version:

- Index public channels only.
- Skip DMs until permissions/auth are stronger.
- Treat each thread as one document.
- Treat top-level messages with no replies as one document.
- Store Slack timestamp in metadata for future temporal scoring.

Document shape:

```text
Title: #channel - Thread by Jane Doe - 2026-05-27
Content:
Channel: #sales
Started by: Jane Doe
Started at: 2026-05-27T10:10:00Z

Jane Doe: We need to move pricing review to Friday.
Rahul: Approved. Customer calls are blocked until this is done.
Decision: Pricing review moves to Friday.
```

Metadata:

```ts
{
  source_type: "slack",
  document_title: title,
  channel_id: channel.id,
  channel_name: channel.name,
  thread_ts: root.ts,
  message_ts: root.ts,
  url: permalink,
  created_time: isoDate,
  updated_time: isoDate,
}
```

### 8.9 Incremental Sync

Store `lastSyncTs` in `Source.config`.

Use:

```ts
client.conversations.history({
  channel: channel.id,
  oldest: source.config.lastSyncTs ?? undefined,
});
```

At the end, update:

```ts
config: {
  ...config,
  lastSyncTs: newestMessageTs,
}
```

### 8.10 Slack Risks

- Slack thread context matters. Do not index individual replies without root message context.
- Permissions are sensitive. Before enterprise use, store channel visibility and member access metadata.
- Rate limits can be heavy. Add retry/backoff around `WebClient` calls.
- Files attached to messages may need separate download/parsing later.

## 9. Gmail Connector

### 9.1 Goal

Index email threads so Corely can answer decision/history questions hidden in email:

- "What did the customer ask for in the renewal thread?"
- "Who approved the vendor contract?"
- "What objections did finance raise?"

### 9.2 Provider Setup

Use Google Cloud Console, the same project or a separate app.

Enable:

```text
Gmail API
```

OAuth redirect URL:

```text
http://localhost:3000/api/sources/gmail/callback
https://your-production-domain.com/api/sources/gmail/callback
```

Recommended scopes:

```text
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/userinfo.email
```

Avoid broad Gmail modify/send scopes for the MVP.

### 9.3 Packages

The project already has:

```text
googleapis
```

No new package is required for plain Gmail indexing.

### 9.4 Environment Variables

You can reuse Google credentials only if the redirect URI and consent scopes are configured for Gmail. Prefer explicit names:

```env
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=http://localhost:3000/api/sources/gmail/callback
```

### 9.5 Files

```text
app/api/sources/gmail/connect/route.ts
app/api/sources/gmail/callback/route.ts
modules/sources/connectors/gmail.ts
```

### 9.6 Connect Route

Use Google OAuth with offline access:

```ts
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
  state,
});
```

### 9.7 Callback Route

Exchange code using `oauth2Client.getToken(code)`, encrypt tokens, and create:

```ts
await prisma.source.create({
  data: {
    workspaceId,
    userId,
    type: "gmail",
    name: `${email} (Gmail)`,
    status: "idle",
    accessToken: tokens.access_token ? encrypt(tokens.access_token) : null,
    refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
    tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    config: {
      email,
      historyId: profile.historyId,
      labelIds: ["INBOX", "SENT"],
      query: "-category:promotions -category:social",
    },
  },
});
```

### 9.8 Sync Strategy

For the first version, index Gmail threads rather than individual messages.

Fetch thread IDs:

```ts
gmail.users.threads.list({
  userId: "me",
  q: "newer_than:180d -category:promotions -category:social",
  maxResults: 100,
});
```

Then fetch each thread:

```ts
gmail.users.threads.get({
  userId: "me",
  id: threadId,
  format: "full",
});
```

Convert MIME payloads to text:

- Prefer `text/plain`
- Fall back to stripping HTML from `text/html`
- Skip large attachments in MVP
- Include sender, recipients, subject, and date per message

Document shape:

```text
Subject: Renewal pricing approval
Thread participants: ceo@company.com, finance@company.com, customer@client.com
Last message: 2026-05-27T09:30:00Z

[2026-05-26] customer@client.com:
We need final pricing by Friday.

[2026-05-27] finance@company.com:
Approved at $120k annual if legal signs today.
```

Metadata:

```ts
{
  source_type: "gmail",
  document_title: subject,
  thread_id: thread.id,
  message_count: thread.messages.length,
  participants,
  url: `https://mail.google.com/mail/u/0/#inbox/${thread.id}`,
  updated_time: lastMessageDate,
}
```

### 9.9 Incremental Sync

Best path:

- Store `historyId` from Gmail profile/thread responses in `Source.config`.
- Use Gmail `users.history.list` on later syncs.

MVP fallback:

- Use Gmail search query with `after:YYYY/MM/DD`.
- Continue relying on `contentHash` to skip unchanged threads.

### 9.10 Gmail Risks

- Gmail contains highly sensitive data. Do not add this before auth and workspace boundaries are reliable.
- Permission-aware retrieval is mandatory before real team deployment.
- Google verification may be required for production usage.
- HTML email cleaning can be noisy; start with plain text.

## 10. GitHub Connector

### 10.1 Goal

Index engineering knowledge from repositories:

- Pull requests
- Issues
- Discussions
- README/docs/wiki markdown
- Release notes

Questions Corely should answer:

- "Why did we move from X to Y?"
- "What PR introduced the billing webhook?"
- "Which bugs are blocking launch?"

### 10.2 Provider Setup

Use a GitHub App rather than a basic OAuth app for production. GitHub Apps provide finer repository permissions and installation-level tokens.

For MVP, OAuth can work faster, but the recommended path is GitHub App.

GitHub App callback URL:

```text
http://localhost:3000/api/sources/github/callback
https://your-production-domain.com/api/sources/github/callback
```

Repository permissions:

```text
Contents: Read
Issues: Read
Pull requests: Read
Discussions: Read
Metadata: Read
```

### 10.3 Packages

```powershell
npm install octokit
```

### 10.4 Environment Variables

For OAuth MVP:

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:3000/api/sources/github/callback
```

For GitHub App production:

```env
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_APP_CLIENT_ID=
GITHUB_APP_CLIENT_SECRET=
GITHUB_APP_WEBHOOK_SECRET=
```

### 10.5 Files

```text
app/api/sources/github/connect/route.ts
app/api/sources/github/callback/route.ts
modules/sources/connectors/github.ts
```

### 10.6 Connect Route

OAuth MVP:

```ts
const authUrl = new URL("https://github.com/login/oauth/authorize");
authUrl.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
authUrl.searchParams.set("redirect_uri", process.env.GITHUB_REDIRECT_URI!);
authUrl.searchParams.set("scope", "read:user repo read:org");
authUrl.searchParams.set("state", state);
```

Production GitHub App:

- Send users to the GitHub App installation URL.
- Store installation ID in `Source.config`.
- Generate installation tokens during sync.

### 10.7 Callback Route

Exchange code:

```ts
const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
  method: "POST",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    client_id: process.env.GITHUB_CLIENT_ID!,
    client_secret: process.env.GITHUB_CLIENT_SECRET!,
    code,
    redirect_uri: process.env.GITHUB_REDIRECT_URI!,
  }),
});
```

Save source:

```ts
await prisma.source.create({
  data: {
    workspaceId,
    userId,
    type: "github",
    name: `${login} (GitHub)`,
    status: "idle",
    accessToken: encrypt(accessToken),
    config: {
      login,
      selectedRepos: [],
      lastSyncedAt: null,
      mode: "oauth",
    },
  },
});
```

### 10.8 Sync Strategy

Start with selected repositories only. Do not index every repository by default.

For each selected repo:

- Index README and markdown docs from `main` or default branch.
- Index open and recently closed issues.
- Index merged PRs and comments.
- Include labels, authors, reviewers, state, and timestamps.

Document types:

```text
github_readme
github_markdown
github_issue
github_pull_request
github_discussion
github_release
```

Pull request document shape:

```text
Repository: org/corely
PR #183: Add OAuth callback hardening
State: merged
Author: krishil
Merged at: 2026-05-27T08:40:00Z
Reviewers: ...

Description:
...

Important comments:
...

Changed files:
- app/api/sources/notion/callback/route.ts
- lib/auth-server.ts
```

Metadata:

```ts
{
  source_type: "github",
  document_title: title,
  repo: "org/corely",
  object_type: "pull_request",
  number: 183,
  state: "merged",
  author,
  labels,
  url,
  created_time,
  updated_time,
}
```

### 10.9 Incremental Sync

Use `updated since` filters:

- Issues API supports `since`.
- Pull requests can be sorted by `updated`.
- Repository contents can use commit SHA comparisons later.

Store in `Source.config`:

```ts
{
  selectedRepos: ["org/corely"],
  lastSyncedAt: "2026-05-27T00:00:00Z",
  repoCursors: {
    "org/corely": {
      lastIssueSync: "...",
      lastPrSync: "...",
      lastDefaultBranchSha: "..."
    }
  }
}
```

### 10.10 GitHub Risks

- `repo` OAuth scope is broad. GitHub App permissions are safer.
- Code files should not all be embedded blindly. Start with docs, issues, PRs, discussions, and releases.
- Large repositories can produce huge indexes. Require repo selection.
- Private repo access must be respected during retrieval before enterprise use.

## 11. Linear Connector

### 11.1 Goal

Index product execution memory:

- Issues
- Projects
- Cycles
- Comments
- Labels
- Status transitions

Questions Corely should answer:

- "What is blocking the onboarding project?"
- "Which customer requests are linked to roadmap items?"
- "Why was the billing issue moved to next cycle?"

### 11.2 Provider Setup

Create an OAuth application in Linear.

Redirect URL:

```text
http://localhost:3000/api/sources/linear/callback
https://your-production-domain.com/api/sources/linear/callback
```

Recommended scopes:

```text
read
issues:read
comments:read
```

Linear's available OAuth scopes may change, so confirm in the Linear developer settings before implementation.

### 11.3 Packages

```powershell
npm install @linear/sdk
```

You can also use GraphQL directly with `fetch` if you want to avoid a package.

### 11.4 Environment Variables

```env
LINEAR_CLIENT_ID=
LINEAR_CLIENT_SECRET=
LINEAR_REDIRECT_URI=http://localhost:3000/api/sources/linear/callback
```

### 11.5 Files

```text
app/api/sources/linear/connect/route.ts
app/api/sources/linear/callback/route.ts
modules/sources/connectors/linear.ts
```

### 11.6 Connect Route

```ts
const authUrl = new URL("https://linear.app/oauth/authorize");
authUrl.searchParams.set("client_id", process.env.LINEAR_CLIENT_ID!);
authUrl.searchParams.set("redirect_uri", process.env.LINEAR_REDIRECT_URI!);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", "read");
authUrl.searchParams.set("state", state);
```

### 11.7 Callback Route

Exchange code:

```ts
const tokenResponse = await fetch("https://api.linear.app/oauth/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code,
    redirect_uri: process.env.LINEAR_REDIRECT_URI!,
    client_id: process.env.LINEAR_CLIENT_ID!,
    client_secret: process.env.LINEAR_CLIENT_SECRET!,
    grant_type: "authorization_code",
  }),
});
```

Save source:

```ts
await prisma.source.create({
  data: {
    workspaceId,
    userId,
    type: "linear",
    name: `${organizationName} (Linear)`,
    status: "idle",
    accessToken: encrypt(accessToken),
    refreshToken: refreshToken ? encrypt(refreshToken) : null,
    tokenExpiry: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
    config: {
      organizationId,
      organizationName,
      selectedTeamIds: [],
      lastSyncedAt: null,
    },
  },
});
```

### 11.8 Sync Strategy

Use Linear GraphQL to fetch issues by team or updated timestamp.

Index each issue as one document including:

- Identifier, title, description
- State
- Priority
- Assignee
- Creator
- Team
- Project
- Cycle
- Labels
- Comments
- Created/updated/completed/canceled dates

Issue document shape:

```text
Issue: CORE-123 - Improve onboarding checklist
State: In Progress
Team: Product
Project: Activation
Cycle: 2026-W22
Priority: High
Assignee: Krishil
Labels: onboarding, customer-request

Description:
...

Comments:
[2026-05-25] Riya: Customer success needs this before beta launch.
[2026-05-26] Krishil: Moving to current cycle.
```

Metadata:

```ts
{
  source_type: "linear",
  document_title: `${identifier}: ${title}`,
  issue_id: issue.id,
  identifier: issue.identifier,
  state,
  priority,
  team,
  project,
  cycle,
  labels,
  assignee,
  url,
  created_time,
  updated_time,
}
```

### 11.9 Incremental Sync

Store `lastSyncedAt` in `Source.config`.

GraphQL query should filter:

```graphql
issues(filter: { updatedAt: { gt: "2026-05-27T00:00:00Z" } }) {
  nodes {
    id
    identifier
    title
    description
    updatedAt
  }
}
```

At the end of sync, update `config.lastSyncedAt`.

### 11.10 Linear Risks

- Comments can be numerous. Cap comments for MVP or page through them carefully.
- Deleted/archived issues need tombstone handling later.
- OAuth refresh behavior must be tested with Linear's current token response.
- Issue visibility is workspace-wide unless you implement permission filters.

## 12. Sources UI Changes

In `app/dashboard/sources/components/SourcesMain.tsx`, add connect cards for:

- Slack
- Gmail
- GitHub
- Linear

Each card should link to:

```text
/api/sources/slack/connect?workspaceId=${WORKSPACE_ID}&userId=${USER_ID}
/api/sources/gmail/connect?workspaceId=${WORKSPACE_ID}&userId=${USER_ID}
/api/sources/github/connect?workspaceId=${WORKSPACE_ID}&userId=${USER_ID}
/api/sources/linear/connect?workspaceId=${WORKSPACE_ID}&userId=${USER_ID}
```

Update success redirect handling:

```ts
if (connected === "slack") showToast("Slack connected! Sync in progress...", "success");
if (connected === "gmail") showToast("Gmail connected! Sync in progress...", "success");
if (connected === "github") showToast("GitHub connected! Sync in progress...", "success");
if (connected === "linear") showToast("Linear connected! Sync in progress...", "success");
```

Update connector labels in the management panel so it does not classify every non-Google source as Notion.

## 13. Webhook Strategy

The audit flags missing webhook-based sync. Do not block MVP connector delivery on webhooks, but design for them.

Recommended webhook routes:

```text
app/api/webhooks/slack/route.ts
app/api/webhooks/gmail/route.ts
app/api/webhooks/github/route.ts
app/api/webhooks/linear/route.ts
```

MVP order:

1. Manual + scheduled sync.
2. Incremental cursor sync.
3. Provider webhooks/events.

Provider-specific notes:

- Slack: Events API for new messages and message changes.
- Gmail: Google Pub/Sub watch + history API.
- GitHub: Webhooks for pull_request, issues, issue_comment, discussion, push.
- Linear: Webhooks for issue and comment changes.

## 14. Database Improvements Recommended Before Enterprise Use

The existing schema is enough for an MVP. For real customers, add permission and sync metadata.

Recommended new fields or tables:

```prisma
model DocumentPermission {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  documentId  String   @map("document_id") @db.Uuid
  provider    String
  principalId String   @map("principal_id")
  principalType String @map("principal_type") // user | group | channel | team | repo
  accessLevel String   @map("access_level")  // read | admin
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("document_permissions")
}
```

Recommended `Source.config` keys:

```json
{
  "syncVersion": 1,
  "lastSyncedAt": null,
  "cursor": null,
  "selectedScopes": [],
  "selectedContainers": [],
  "permissionMode": "metadata_only"
}
```

## 15. Security Requirements

Before connecting real company data:

- Replace dummy auth with real user sessions.
- Validate OAuth state.
- Tie callbacks to authenticated users.
- Encrypt every token before writing it to `sources`.
- Never expose provider tokens to client components.
- Add permission-aware retrieval before shared workspaces.
- Add audit logs for connect, disconnect, sync, and query events.
- Add startup env validation so missing secrets fail fast.

## 16. Testing Checklist Per Connector

For each connector:

- [ ] Provider app created.
- [ ] Redirect URI registered.
- [ ] Environment variables added.
- [ ] Connect route redirects to provider OAuth.
- [ ] Callback route exchanges code successfully.
- [ ] Source row appears with encrypted token.
- [ ] Source status changes from `idle` to `syncing`.
- [ ] Sync creates `documents` rows.
- [ ] Sync creates `document_chunks` rows with embeddings.
- [ ] Manual re-sync works from `/api/sources/[sourceId]/sync`.
- [ ] Ask Corely returns answers citing this provider.
- [ ] Unchanged objects are skipped by `contentHash`.
- [ ] Provider rate limits are handled with retry/backoff.
- [ ] Error state is shown in Sources UI.

## 17. Final File Checklist

Slack:

- [ ] `app/api/sources/slack/connect/route.ts`
- [ ] `app/api/sources/slack/callback/route.ts`
- [ ] `modules/sources/connectors/slack.ts`
- [ ] `app/api/webhooks/slack/route.ts` later

Gmail:

- [ ] `app/api/sources/gmail/connect/route.ts`
- [ ] `app/api/sources/gmail/callback/route.ts`
- [ ] `modules/sources/connectors/gmail.ts`
- [ ] `app/api/webhooks/gmail/route.ts` later

GitHub:

- [ ] `app/api/sources/github/connect/route.ts`
- [ ] `app/api/sources/github/callback/route.ts`
- [ ] `modules/sources/connectors/github.ts`
- [ ] `app/api/webhooks/github/route.ts` later

Linear:

- [ ] `app/api/sources/linear/connect/route.ts`
- [ ] `app/api/sources/linear/callback/route.ts`
- [ ] `modules/sources/connectors/linear.ts`
- [ ] `app/api/webhooks/linear/route.ts` later

Shared:

- [ ] `app/api/sources/[sourceId]/sync/route.ts`
- [ ] `workers/index.ts`
- [ ] `app/dashboard/sources/components/SourcesMain.tsx`
- [ ] `prisma/schema.prisma` only if adding permission/sync tables
- [ ] `.env.local`
- [ ] production environment variables

## 18. Recommended Build Sequence

Sprint 1:

- Implement Slack OAuth.
- Implement Slack public channel sync.
- Add Slack card to Sources UI.
- Verify Ask Corely citations from Slack threads.

Sprint 2:

- Add Gmail OAuth and thread sync.
- Add Gmail source card.
- Add email text extraction and thread grouping.

Sprint 3:

- Add GitHub OAuth or GitHub App installation.
- Index selected repositories only.
- Start with PRs, issues, README, and markdown docs.

Sprint 4:

- Add Linear OAuth.
- Index selected teams/projects.
- Connect issue state, labels, comments, and project metadata.

Hardening sprint:

- Batch embeddings.
- Add permission metadata.
- Add startup env validation.
- Add provider backoff helpers.
- Add webhook routes.
- Add a real scheduled sync job.

## 19. MVP Definition Of Done

The four missing connectors are complete when:

- A user can connect Slack, Gmail, GitHub, and Linear from the Sources page.
- Each connector creates a `Source` row with encrypted credentials.
- Each connector syncs real provider data into `documents`.
- Each connector embeds chunks into `document_chunks`.
- Ask Corely can answer questions using those chunks with clear citations.
- Manual re-sync works.
- Sync errors are visible in `Source.status` and `Source.errorMessage`.
- At least Slack supports incremental sync, because the audit calls Slack the highest-value missing connector.

