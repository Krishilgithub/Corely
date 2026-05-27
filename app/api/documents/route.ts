import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/openai";
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

    // 4. Generate embeddings (sequential for now, batching is Section 5 scope, but safe to leave here)
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.content);
      await supabaseAdmin.from("document_chunks").insert({
        document_id: document.id,
        source_id: source.id,
        workspace_id: workspace.id,
        content: chunk.content,
        embedding: embedding,
        token_count: chunk.tokenCount,
      });
    }

    return successResponse({ document });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/documents error:", error);
    return errorResponse("Failed to create document", 500);
  }
}
