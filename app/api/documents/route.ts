import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/openai";
import { chunkText } from "@/modules/ai/chunker";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// ── GET: Query documents in workspace or source ──────────────────────────────
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  const sourceId = request.nextUrl.searchParams.get("sourceId");

  if (!workspaceId && !sourceId) {
    return NextResponse.json(
      { error: "workspaceId or sourceId query param required" },
      { status: 400 }
    );
  }

  try {
    const whereClause: { sourceId?: string; workspaceId?: string } = {};
    if (sourceId) {
      whereClause.sourceId = sourceId;
    } else if (workspaceId) {
      whereClause.workspaceId = workspaceId;
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

    return NextResponse.json({ documents });
  } catch (e) {
    const error = e as Error;
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// ── POST: Manually create and embed a document under a source ─────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId, title, fileType, rawContent } = body;

    if (!sourceId || !title || !rawContent) {
      return NextResponse.json(
        { error: "sourceId, title, and rawContent are required" },
        { status: 400 }
      );
    }

    // 1. Fetch source to resolve workspaceId and verify source exists
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }

    // 2. Create the document in Prisma
    const externalId = `manual-${Date.now()}`;
    const contentHash = crypto.createHash("sha256").update(rawContent).digest("hex");

    const document = await prisma.document.create({
      data: {
        workspaceId: source.workspaceId,
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

    // 4. Generate embeddings and insert into Supabase document_chunks
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.content);

      const { error } = await supabaseAdmin.from("document_chunks").insert({
        workspace_id: source.workspaceId,
        document_id: document.id,
        source_id: source.id,
        content: chunk.content,
        chunk_index: chunk.chunkIndex,
        token_count: chunk.tokenCount,
        embedding,
        metadata: {
          document_title: title,
          file_type: fileType || "manual_upload",
          source_type: source.type || "manual",
          manual_upload: true,
        },
      });

      if (error) {
        console.error(`[Manual Ingestion] ❌ Supabase insert error:`, error.message);
      }
    }

    // 5. Increment the source's itemsIndexed count
    await prisma.source.update({
      where: { id: sourceId },
      data: {
        itemsIndexed: { increment: 1 },
      },
    });

    return NextResponse.json({ document });
  } catch (e) {
    const error = e as Error;
    console.error("[POST /api/documents] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create document" },
      { status: 500 }
    );
  }
}
