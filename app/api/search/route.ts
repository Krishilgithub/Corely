import { NextRequest } from "next/server";
import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateEmbedding } from "@/lib/openai";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(20).optional().default(5),
});

interface ChunkResult {
  id: string;
  content: string;
  document_id: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const { user, workspace } = await auth();

    const body = await request.json();
    const result = searchSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Invalid payload", 400);
    }

    const { query, limit } = result.data;
    const workspaceId = workspace.id;

    // 1. PERMISSION-AWARE RETRIEVAL LAYER
    const userSources = await prisma.source.findMany({
      where: { workspaceId, userId: user.id },
      select: { id: true },
    });

    const sharedSources = await prisma.source.findMany({
      where: {
        workspaceId,
        config: { path: ["permissions"], equals: "everyone" }
      },
      select: { id: true },
    });

    const allowedSourceIdSet = new Set([
      ...userSources.map(s => s.id),
      ...sharedSources.map(s => s.id),
    ]);

    if (user.role === "admin" || (user.workspaceRole?.permissions as string[] | undefined)?.includes("sources:read")) {
      const allSources = await prisma.source.findMany({
        where: { workspaceId },
        select: { id: true },
      });
      allSources.forEach(s => allowedSourceIdSet.add(s.id));
    }

    const allowedSourceIds = allowedSourceIdSet.size > 0
      ? Array.from(allowedSourceIdSet)
      : ["00000000-0000-0000-0000-000000000000"];

    const queryEmbedding = await generateEmbedding(query);
    const vectorQuery = `[${queryEmbedding.join(",")}]`;

    const chunks = await prisma.$queryRaw<ChunkResult[]>`
      SELECT 
        dc.id,
        dc.content,
        dc.document_id,
        dc.metadata,
        1 - (dc.embedding <=> ${vectorQuery}::vector) as similarity
      FROM document_chunks dc
      WHERE dc.workspace_id = ${workspaceId}::uuid
        AND dc.source_id::text IN (${Prisma.join(allowedSourceIds)})
        AND 1 - (dc.embedding <=> ${vectorQuery}::vector) > 0.4
      ORDER BY dc.embedding <=> ${vectorQuery}::vector
      LIMIT ${limit};
    `;

    return successResponse({ results: chunks || [] });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/search error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
