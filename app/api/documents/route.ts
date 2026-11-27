import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/embeddings";
import { chunkText } from "@/modules/ai/chunker";
import crypto from "crypto";
import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createDocumentSchema = z.object({
  sourceId: z.string().uuid(),
  title: z.string().min(1),
  fileType: z.string().optional(),
  rawContent: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { workspace } = await auth();
    const sourceId = request.nextUrl.searchParams.get("sourceId");

    const whereClause: { workspaceId: string; sourceId?: string } = { workspaceId: workspace.id };
    if (sourceId) {
      whereClause.sourceId = sourceId;
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        source: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return successResponse({ documents });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/documents error:", error);
    return errorResponse("Failed to fetch documents", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspace } = await auth();

    const body = await request.json();
    const result = createDocumentSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Invalid payload", 400);
    }

    const { sourceId, title, fileType, rawContent } = result.data;

    // 1. Fetch source to verify it belongs to user's workspace
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source || source.workspaceId !== workspace.id) {
      return errorResponse("Source not found or unauthorized", 404);
    }

    // 2. Create the document in Prisma
    const externalId = `manual-${Date.now()}`;
    const contentHash = crypto.createHash("sha256").update(rawContent).digest("hex");

    const document = await prisma.document.create({
      data: {
        workspaceId: workspace.id,
        sourceId: source.id,
        externalId,
        title,
        fileType: fileType || "manual_upload",
        url: null,
        rawContent,
        contentHash,
        indexedAt: new Date(),
      },
    });

    // 3. Chunk the text
    const chunks = chunkText(rawContent, title);

    // 4. Embed and store each chunk. Count failures so we never report success that did not happen.
    let failedChunks = 0;
    for (const chunk of chunks) {
      try {
        const embedding = await generateEmbedding(chunk.content);
        const { error } = await supabaseAdmin.from("document_chunks").insert({
          document_id: document.id,
          source_id: source.id,
          workspace_id: workspace.id,
          content: chunk.content,
          chunk_index: chunk.chunkIndex,
          token_count: chunk.tokenCount,
          embedding: embedding,
          metadata: {
            document_title: title,
            file_type: fileType || "manual_upload",
            source_type: "manual",
          }
        });
        if (error) {
          failedChunks++;
          console.error("Failed to insert chunk into Supabase:", error);
        }
      } catch (err) {
        failedChunks++;
        console.error("Failed to embed or store chunk:", err);
      }
    }

    // 5. Nothing was stored, so the document is not searchable. Remove it and report the error.
    if (chunks.length > 0 && failedChunks === chunks.length) {
      await supabaseAdmin.from("document_chunks").delete().eq("document_id", document.id);
      await prisma.document.delete({ where: { id: document.id } });
      return errorResponse("The document could not be indexed. No text chunks were saved. Please try again.", 502);
    }

    // 6. Count the new document on its source, like the upload route does.
    await prisma.source.update({
      where: { id: source.id },
      data: { itemsIndexed: { increment: 1 } },
    });

    // Some chunks failed: the document is saved but only partly searchable.
    const warning = failedChunks > 0
      ? `Only ${chunks.length - failedChunks} of ${chunks.length} text chunks were indexed. Parts of this document will not show up in search.`
      : null;

    return successResponse({ document, chunksIndexed: chunks.length - failedChunks, chunksTotal: chunks.length, warning });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/documents error:", error);
    return errorResponse("Failed to create document", 500);
  }
}
