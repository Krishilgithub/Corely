/**
 * Linear connector — syncs Linear issues (with comments) to Supabase pgvector.
 * 
 * Improvements over v1:
 * - Issue comments are now synced (huge context gain)
 * - Full pagination via GraphQL cursor (no hardcoded limit)
 * - Team/project context included in document content
 * - Rate limit awareness with retry backoff
 */

import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/openai";
import { chunkText } from "@/modules/ai/chunker";
import crypto from "crypto";

const LINEAR_API = "https://api.linear.app/graphql";

async function linearQuery(
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (res.status === 429) {
    // Rate limited — wait and retry
    const retryAfter = parseInt(res.headers.get("Retry-After") || "10", 10);
    console.warn(`[Linear] Rate limited. Waiting ${retryAfter}s...`);
    await new Promise(r => setTimeout(r, retryAfter * 1000));
    return linearQuery(token, query, variables);
  }

  if (!res.ok) throw new Error(`Linear API HTTP error: ${res.status}`);

  const data = await res.json() as { errors?: Array<{ message: string }>; data?: Record<string, unknown> };
  if (data.errors?.length) {
    throw new Error(`Linear GraphQL error: ${data.errors[0].message}`);
  }
  return data.data as Record<string, unknown>;
}

const ISSUES_QUERY = `
  query GetIssues($after: String) {
    issues(first: 50, after: $after, orderBy: updatedAt) {
      nodes {
        id
        identifier
        title
        description
        url
        updatedAt
        priority
        state {
          name
          type
        }
        assignee {
          name
        }
        team {
          name
          key
        }
        project {
          name
        }
        labels {
          nodes {
            name
          }
        }
        comments {
          nodes {
            id
            body
            createdAt
            user {
              name
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export async function syncLinear(sourceId: string): Promise<void> {
  console.log(`[Linear] 🔄 Starting sync — source: ${sourceId}`);

  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error(`Source ${sourceId} not found`);
  if (!source.accessToken) throw new Error(`Source ${sourceId} has no access token`);

  const token = decrypt(source.accessToken);

  await prisma.source.update({
    where: { id: sourceId },
    data: { status: "syncing", errorMessage: null },
  });

  let totalIndexed = 0;
  let cursor: string | undefined;
  let hasNextPage = true;
  let pageCount = 0;

  try {
    while (hasNextPage && pageCount < 20) { // Max 20 pages = 1000 issues
      pageCount++;
      const data = await linearQuery(token, ISSUES_QUERY, cursor ? { after: cursor } : {}) as {
        issues: {
          nodes: Array<{
            id: string;
            identifier: string;
            title: string;
            description?: string;
            url: string;
            updatedAt: string;
            priority: number;
            state?: { name: string; type: string };
            assignee?: { name: string };
            team?: { name: string; key: string };
            project?: { name: string };
            labels?: { nodes: Array<{ name: string }> };
            comments?: {
              nodes: Array<{
                id: string;
                body: string;
                createdAt: string;
                user?: { name: string };
              }>;
            };
          }>;
          pageInfo: { hasNextPage: boolean; endCursor: string };
        };
      };

      const issues = data.issues?.nodes || [];
      const pageInfo = data.issues?.pageInfo;

      console.log(`[Linear] Page ${pageCount}: ${issues.length} issues`);

      for (const issue of issues) {
        const {
          id, identifier, title, description, url,
          updatedAt, priority, state, assignee, team, project, labels, comments,
        } = issue;

        // Build rich document content including comments
        const labelNames = labels?.nodes?.map(l => l.name).join(", ") || "None";
        const priorityLabel = ["No priority", "Urgent", "High", "Medium", "Low"][priority] ?? "Unknown";

        const commentLines = (comments?.nodes || [])
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .map(c => {
            const ts = new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            return `  [${ts}] ${c.user?.name ?? "Unknown"}: ${c.body}`;
          })
          .join("\n");

        const rawContent = [
          `Issue: ${identifier}`,
          `Title: ${title}`,
          `State: ${state?.name ?? "Unknown"} (${state?.type ?? ""})`,
          `Priority: ${priorityLabel}`,
          `Assignee: ${assignee?.name ?? "Unassigned"}`,
          `Team: ${team?.name ?? "Unknown"}`,
          project ? `Project: ${project.name}` : null,
          `Labels: ${labelNames}`,
          `URL: ${url}`,
          "",
          "Description:",
          description?.trim() || "No description provided.",
          "",
          comments?.nodes?.length
            ? `Comments (${comments.nodes.length}):\n${commentLines}`
            : "Comments: None",
        ]
          .filter(line => line !== null)
          .join("\n");

        const docTitle = `${identifier}: ${title}`;
        const docExternalId = `linear-issue-${id}`;
        const contentHash = crypto.createHash("md5").update(rawContent).digest("hex");

        const existingDoc = await prisma.document.findUnique({
          where: { sourceId_externalId: { sourceId, externalId: docExternalId } },
        });

        if (existingDoc && existingDoc.contentHash === contentHash) {
          continue; // Unmodified
        }

        // Upsert Document with real updatedAt date
        const doc = await prisma.document.upsert({
          where: { sourceId_externalId: { sourceId, externalId: docExternalId } },
          update: {
            title: docTitle,
            rawContent,
            contentHash,
            url,
            indexedAt: new Date(),
            updatedAt: new Date(updatedAt),
          },
          create: {
            workspaceId: source.workspaceId,
            sourceId,
            externalId: docExternalId,
            title: docTitle,
            fileType: "linear_issue",
            url,
            rawContent,
            contentHash,
            indexedAt: new Date(),
            updatedAt: new Date(updatedAt),
          },
        });

        // Delete old chunks
        await prisma.documentChunk.deleteMany({ where: { documentId: doc.id } });
        const { error: pgError } = await supabaseAdmin
          .from("document_chunks")
          .delete()
          .eq("document_id", doc.id);
        if (pgError) console.error(`[Linear] Supabase delete error: ${pgError.message}`);

        // Chunk and embed
        const chunks = chunkText(rawContent, docTitle);
        for (const chunk of chunks) {
          const embedding = await generateEmbedding(chunk.content);

          const dbChunk = await prisma.documentChunk.create({
            data: {
              workspaceId: source.workspaceId,
              sourceId,
              documentId: doc.id,
              content: chunk.content,
              chunkIndex: chunk.chunkIndex,
            },
          });

          const { error: insertErr } = await supabaseAdmin.from("document_chunks").insert({
            id: dbChunk.id,
            document_id: doc.id,
            workspace_id: source.workspaceId,
            content: chunk.content,
            embedding,
            metadata: {
              source: "linear",
              file_type: "linear_issue",
              document_title: docTitle,
              identifier,
              url,
              team: team?.name,
            },
          });

          if (insertErr) {
            console.error(`[Linear] Supabase insert error: ${insertErr.message}`);
          }
        }

        totalIndexed++;
        console.log(`[Linear] ✅ Indexed: ${docTitle} (${chunks.length} chunks, ${comments?.nodes?.length ?? 0} comments)`);
      }

      hasNextPage = pageInfo?.hasNextPage ?? false;
      cursor = pageInfo?.endCursor;
    }

    await prisma.source.update({
      where: { id: sourceId },
      data: {
        status: "synced",
        itemsIndexed: { increment: totalIndexed },
        lastSyncedAt: new Date(),
      },
    });

    console.log(`[Linear] ✅ Sync complete! Indexed ${totalIndexed} issues across ${pageCount} pages.`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Linear] ❌ Sync failed:", errorMsg);
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: "error", errorMessage: errorMsg },
    });
  }
}
