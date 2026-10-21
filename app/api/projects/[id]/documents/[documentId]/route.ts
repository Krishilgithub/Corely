import { requirePermission } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { projectRouteError, getWorkspaceProject } from "@/lib/projects";
import { getVisibleSourceIds } from "@/lib/source-access";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; documentId: string }> };

// PATCH /api/projects/:id/documents/:documentId  { status: "confirmed" | "rejected" }
// A person's answer is final: the row becomes "manual" (or "rejected") and the
// automatic matcher will not change it again.
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_MANAGE);
    const { id, documentId } = await params;
    await getWorkspaceProject(id, user.workspaceId);

    const body = await req.json().catch(() => ({}));
    const status = body.status;
    if (status !== "confirmed" && status !== "rejected") throw new Error("Invalid: status must be confirmed or rejected");

    const doc = await prisma.document.findFirst({
      where: { id: documentId, workspaceId: user.workspaceId },
      select: { id: true, sourceId: true },
    });
    if (!doc) return errorResponse("Document not found", 404);
    if (!(await getVisibleSourceIds(user)).includes(doc.sourceId)) return errorResponse("Forbidden", 403);

    const row = await prisma.documentProject.upsert({
      where: { documentId_projectId: { documentId, projectId: id } },
      create: { documentId, projectId: id, method: "manual", confidence: 1, status },
      update: status === "confirmed" ? { method: "manual", confidence: 1, status } : { status },
    });
    return successResponse(row);
  } catch (error) {
    return projectRouteError(error, "PATCH /api/projects/[id]/documents/[documentId]");
  }
}
