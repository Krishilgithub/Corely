import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse } from "@/lib/api-response";
import { projectRouteError, getWorkspaceProject } from "@/lib/projects";
import { refreshProjectTags } from "@/lib/project-matching";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/projects/:id/refresh — re-check which documents belong to the project now.
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_MANAGE);
    const { id } = await params;
    await getWorkspaceProject(id, user.workspaceId);
    return successResponse(await refreshProjectTags(id));
  } catch (error) {
    return projectRouteError(error, "POST /api/projects/[id]/refresh");
  }
}
