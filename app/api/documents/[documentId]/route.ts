import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const documentId = resolvedParams.documentId;

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    // 1. Fetch document to resolve sourceId
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // 2. Purge vector chunks from Supabase
    const { error: supabaseError } = await supabaseAdmin
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId);

    if (supabaseError) {
      console.error(`[DELETE Document] Supabase delete error:`, supabaseError.message);
    }

    // 3. Delete document from Prisma
    await prisma.document.delete({
      where: { id: documentId },
    });

    // 4. Decrement itemsIndexed count on the source
    await prisma.source.update({
      where: { id: document.sourceId },
      data: {
        itemsIndexed: { decrement: 1 },
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const error = e as Error;
    console.error("[DELETE /api/documents/[documentId]] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}
