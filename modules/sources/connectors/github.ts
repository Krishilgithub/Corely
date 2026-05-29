/**
 * GitHub connector — syncs engineering knowledge to Supabase pgvector.
 *
 * Flow:
 *  1. Load + decrypt access token from DB
 *  2. Fetch recent repositories accessible by the user (max 5 for MVP)
 *  3. For each repo:
 *     - Fetch README.md
 *     - Fetch recent issues
 *     - Fetch recent Pull Requests
 *  4. Extract text from each item
 *  5. Chunk → Embed → Store in Supabase document_chunks
 *  6. Update source status in DB
 */

import { Octokit } from "octokit";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/openai";
import { chunkText } from "@/modules/ai/chunker";
import crypto from "crypto";

// ── Main sync entry point ──────────────────────────────────────────────────────

export async function syncGitHub(sourceId: string): Promise<void> {
  console.log(`[GitHub] 🔄 Starting sync — source: ${sourceId}`);

  // ── 1. Load source ─────────────────────────────────────────────────
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error(`Source ${sourceId} not found`);
  if (!source.accessToken) throw new Error(`Source ${sourceId} has no access token`);

  // ── 2. Build Octokit client ─────────────────────────────────────────
  const octokit = new Octokit({ auth: decrypt(source.accessToken) });

  // ── 3. Mark source as syncing ──────────────────────────────────────
  await prisma.source.update({
    where: { id: sourceId },
    data: { status: "syncing", errorMessage: null },
  });

  let totalIndexed = 0;

  try {
    // ── 4. Fetch target repositories ──────────────────────────────────
    const config = (source.config as Record<string, any>) || {};
    let targetRepos = [];

    if (config.selectedRepos && Array.isArray(config.selectedRepos) && config.selectedRepos.length > 0) {
      // Sync specific selected repos
      console.log(`[GitHub] Syncing ${config.selectedRepos.length} specific selected repositories.`);
      for (const fullName of config.selectedRepos) {
        const [owner, repoName] = fullName.split("/");
        try {
          const { data: repo } = await octokit.rest.repos.get({ owner, repo: repoName });
          targetRepos.push(repo);
        } catch (err: any) {
          console.error(`[GitHub] Error fetching selected repo ${fullName}:`, err.message);
        }
      }
    } else {
      // For MVP default, we limit to the 5 most recently updated repos
      console.log(`[GitHub] No specific repos selected. Syncing 5 most recent repositories.`);
      const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: 5,
      });
      targetRepos = repos;
    }

    console.log(`[GitHub] Found ${targetRepos.length} repositories to sync.`);

    for (const repo of targetRepos) {
      console.log(`[GitHub] Syncing repo: ${repo.full_name}`);
      const owner = repo.owner.login;
      const repoName = repo.name;

      // 4a. Sync README
      try {
        const { data: readme } = await octokit.rest.repos.getReadme({
          owner,
          repo: repoName,
        });
        
        const content = Buffer.from(readme.content, "base64").toString("utf-8");
        const indexed = await indexDocument(
          {
            externalId: `readme_${repo.id}`,
            title: `${repo.full_name} README`,
            fileType: "github_readme",
            url: readme.html_url || undefined,
            rawContent: content,
            metadata: { repo: repo.full_name },
          },
          sourceId,
          source.workspaceId
        );
        if (indexed) totalIndexed++;
      } catch (err: any) {
        if (err.status !== 404) {
          console.error(`[GitHub] Error fetching README for ${repo.full_name}:`, err.message);
        }
      }

      // 4b. Sync recent Issues
      try {
        const { data: issues } = await octokit.rest.issues.listForRepo({
          owner,
          repo: repoName,
          state: "all",
          sort: "updated",
          per_page: 20, // Limit for MVP
        });

        for (const issue of issues) {
          // GitHub's API returns PRs as issues too, we skip PRs here and handle them later
          if (issue.pull_request) continue;

          const rawContent = `Issue: ${issue.title}\nState: ${issue.state}\nAuthor: ${issue.user?.login}\n\n${issue.body || "No description provided."}`;
          
          const indexed = await indexDocument(
            {
              externalId: `issue_${issue.id}`,
              title: `Issue #${issue.number}: ${issue.title} (${repo.full_name})`,
              fileType: "github_issue",
              url: issue.html_url || undefined,
              rawContent,
              metadata: { repo: repo.full_name, issue_number: issue.number },
            },
            sourceId,
            source.workspaceId
          );
          if (indexed) totalIndexed++;
        }
      } catch (err: any) {
        console.error(`[GitHub] Error fetching issues for ${repo.full_name}:`, err.message);
      }

      // 4c. Sync recent Pull Requests
      try {
        const { data: pulls } = await octokit.rest.pulls.list({
          owner,
          repo: repoName,
          state: "all",
          sort: "updated",
          direction: "desc",
          per_page: 15, // Limit for MVP
        });

        for (const pr of pulls) {
          const rawContent = `Pull Request: ${pr.title}\nState: ${pr.state}\nAuthor: ${pr.user?.login}\n\n${pr.body || "No description provided."}`;
          
          const indexed = await indexDocument(
            {
              externalId: `pr_${pr.id}`,
              title: `PR #${pr.number}: ${pr.title} (${repo.full_name})`,
              fileType: "github_pr",
              url: pr.html_url || undefined,
              rawContent,
              metadata: { repo: repo.full_name, pr_number: pr.number },
            },
            sourceId,
            source.workspaceId
          );
          if (indexed) totalIndexed++;
        }
      } catch (err: any) {
        console.error(`[GitHub] Error fetching PRs for ${repo.full_name}:`, err.message);
      }
    }

    // ── 5. Mark synced ─────────────────────────────────────────────────
    await prisma.source.update({
      where: { id: sourceId },
      data: {
        status: "synced",
        lastSyncedAt: new Date(),
        itemsIndexed: { increment: totalIndexed },
      },
    });

    console.log(`[GitHub] ✅ Sync complete — indexed ${totalIndexed} items`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[GitHub] ❌ Sync failed:`, msg);
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: "error", errorMessage: msg },
    });
    throw err;
  }
}

// ── Content indexing ────────────────────────────────────────────────────────

type NormalizedDocument = {
  externalId: string;
  title: string;
  fileType: string;
  url?: string;
  rawContent: string;
  metadata: Record<string, unknown>;
};

async function indexDocument(
  doc: NormalizedDocument,
  sourceId: string,
  workspaceId: string
): Promise<boolean> {
  if (!doc.rawContent || doc.rawContent.trim().length < 10) return false;

  const contentHash = crypto.createHash("sha256").update(doc.rawContent).digest("hex");

  const existing = await prisma.document.findUnique({
    where: { sourceId_externalId: { sourceId, externalId: doc.externalId } },
    select: { id: true, contentHash: true },
  });

  if (existing?.contentHash === contentHash) {
    return false; // unchanged
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

  // Delete stale chunks
  await supabaseAdmin
    .from("document_chunks")
    .delete()
    .eq("document_id", document.id);

  // Chunk and Embed
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
      metadata: {
        document_title: doc.title,
        file_type: doc.fileType,
        url: doc.url,
        source_type: "github",
        ...doc.metadata,
      },
    });
  }

  return true;
}
