import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const { sourceId } = await params;

  try {
    // Verify source exists
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
      select: { id: true, name: true },
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // 1. Delete source from database (triggers cascade delete on documents/chunks)
    await prisma.source.delete({
      where: { id: sourceId },
    });

    // 2. Double-check clean up of any direct vectors on Supabase pgvector
    await supabaseAdmin
      .from("document_chunks")
      .delete()
      .eq("source_id", sourceId);

    console.log(`[DELETE /api/sources/${sourceId}] ✅ Disconnected and cleared "${source.name}" successfully.`);
    return NextResponse.json({ message: "Source disconnected successfully", sourceId });
  } catch (err) {
    const msg = (err as Error)?.message || "Failed to delete source";
    console.error(`[DELETE /api/sources/${sourceId}] ❌ Error:`, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
