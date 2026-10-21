import { requirePermission } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { projectRouteError, getWorkspaceProject } from "@/lib/projects";
import { refreshProjectTags } from "@/lib/project-matching";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; linkId: string }> };

// DELETE /api/projects/:id/links/:linkId — unlink; documents found only through it drop out.
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_MANAGE);
    const { id, linkId } = await params;
    await getWorkspaceProject(id, user.workspaceId);

    const link = await prisma.projectSourceLink.findFirst({ where: { id: linkId, projectId: id } });
    if (!link) return errorResponse("Link not found", 404);

    await prisma.projectSourceLink.delete({ where: { id: linkId } });
    const result = await refreshProjectTags(id);
    return successResponse({ id: linkId, tags: result });
  } catch (error) {
    return projectRouteError(error, "DELETE /api/projects/[id]/links/[linkId]");
  }
}
