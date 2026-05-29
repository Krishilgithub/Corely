/**
 * Linear connector — syncs Linear issues to Supabase pgvector.
 */

import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/openai";
import { chunkText } from "@/modules/ai/chunker";
import crypto from "crypto";

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

  try {
    // GraphQL query to fetch recent issues
    const query = `
      query {
        issues(first: 100, orderBy: updatedAt) {
          nodes {
            id
            identifier
            title
            description
            url
            updatedAt
            state {
              name
            }
            assignee {
              name
            }
          }
        }
      }
    `;

    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });

    const data = await res.json();
    if (data.errors) {
      throw new Error(`Linear GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    const issues = data.data?.issues?.nodes || [];
    console.log(`[Linear] Found ${issues.length} issues`);

    for (const issue of issues) {
      const { id, identifier, title, description, url, updatedAt, state, assignee } = issue;
      
      const docTitle = `${identifier}: ${title}`;
      const docExternalId = `linear-issue-${id}`;
      
      const rawContent = `Issue: ${identifier}\nTitle: ${title}\nState: ${state?.name || 'Unknown'}\nAssignee: ${assignee?.name || 'Unassigned'}\n\nDescription:\n${description || 'No description provided.'}`;
      
      const contentHash = crypto.createHash("md5").update(rawContent).digest("hex");

      const existingDoc = await prisma.document.findUnique({
        where: { sourceId_externalId: { sourceId, externalId: docExternalId } },
      });

      if (existingDoc && existingDoc.contentHash === contentHash) {
        continue; // Unmodified
      }

      // Upsert Document
      const doc = await prisma.document.upsert({
        where: { sourceId_externalId: { sourceId, externalId: docExternalId } },
        update: { title: docTitle, rawContent, contentHash, url, indexedAt: new Date(), updatedAt: new Date(updatedAt) },
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
      const { error: pgError } = await supabaseAdmin.from("document_chunks").delete().eq("document_id", doc.id);
      if (pgError) console.error(`[Linear] Supabase delete error: ${pgError.message}`);

      // Chunk and embed
      const chunks = chunkText(rawContent, docTitle);
      for (const chunk of chunks) {
        const chunkTextContent = chunk.content;
        const i = chunk.chunkIndex;
        const embedding = await generateEmbedding(chunkTextContent);

        const dbChunk = await prisma.documentChunk.create({
          data: {
            workspaceId: source.workspaceId,
            sourceId: sourceId,
            documentId: doc.id,
            content: chunkTextContent,
            chunkIndex: i,
          },
        });

        const { error: insertErr } = await supabaseAdmin.from("document_chunks").insert({
          id: dbChunk.id,
          document_id: doc.id,
          workspace_id: source.workspaceId,
          content: chunkTextContent,
          embedding,
          metadata: { source: "linear", identifier },
        });

        if (insertErr) {
          console.error(`[Linear] Supabase insert error for chunk: ${insertErr.message}`);
        }
      }

      totalIndexed++;
      console.log(`[Linear] Indexed issue: ${docTitle} (${chunks.length} chunks)`);
    }

    await prisma.source.update({
      where: { id: sourceId },
      data: {
        status: "synced",
        itemsIndexed: { increment: totalIndexed },
        lastSyncedAt: new Date(),
      },
    });

    console.log(`[Linear] ✅ Sync complete! Indexed ${totalIndexed} issues.`);
  } catch (error: any) {
    console.error("[Linear] ❌ Sync failed:", error);
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: "error", errorMessage: error.message },
    });
  }
}
