import { requirePermission } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { projectRouteError, getWorkspaceProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; memoryId: string }> };

// DELETE /api/projects/:id/memory/:memoryId
// Note: a memory extracted from a document comes back if that document
// changes and is read again. Remove the document from the project to stop that.
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_MANAGE);
    const { id, memoryId } = await params;
    await getWorkspaceProject(id, user.workspaceId);
    const memory = await prisma.orgMemory.findFirst({ where: { id: memoryId, projectId: id } });
    if (!memory) return errorResponse("Memory not found", 404);
    await prisma.orgMemory.delete({ where: { id: memoryId } });
    return successResponse({ id: memoryId });
  } catch (error) {
    return projectRouteError(error, "DELETE /api/projects/[id]/memory/[memoryId]");
  }
}
