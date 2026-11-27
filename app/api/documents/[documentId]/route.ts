import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    // Only signed-in users who can change sources may delete a document.
    const user = await requirePermission(Permissions.SOURCES_WRITE);
    const { documentId } = await params;

    if (!documentId) {
      return errorResponse("documentId is required", 400);
    }

    // 1. Fetch document to resolve sourceId. It must belong to the caller's workspace.
    const document = await prisma.document.findFirst({
      where: { id: documentId, workspaceId: user.workspaceId },
    });

    if (!document) {
      return errorResponse("Document not found", 404);
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

    return successResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("[DELETE /api/documents/[documentId]] Error:", error);
    return errorResponse("Failed to delete document", 500);
  }
}
