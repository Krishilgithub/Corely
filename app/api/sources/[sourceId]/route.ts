import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const { sourceId } = await params;

  try {
    // Only signed-in users who can change sources may delete one.
    const user = await requirePermission(Permissions.SOURCES_WRITE);

    // The source must belong to the caller's workspace. Otherwise act as if it does not exist.
    const source = await prisma.source.findFirst({
      where: { id: sourceId, workspaceId: user.workspaceId },
      select: { id: true, name: true },
    });

    if (!source) {
      return errorResponse("Source not found", 404);
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

    console.log(`[DELETE /api/sources/${sourceId}] Disconnected and cleared "${source.name}".`);
    return successResponse({ message: "Source disconnected successfully", sourceId });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error(`[DELETE /api/sources/${sourceId}] Error:`, error);
    return errorResponse("Failed to delete source", 500);
  }
}
