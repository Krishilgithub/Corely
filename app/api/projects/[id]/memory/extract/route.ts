import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse } from "@/lib/api-response";
import { projectRouteError, getWorkspaceProject } from "@/lib/projects";
import { extractProjectMemory } from "@/lib/project-memory";

export const dynamic = "force-dynamic";
// Each call reads a handful of documents with the model; allow time for that.
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

// POST /api/projects/:id/memory/extract — read the next few new or changed documents.
// The page calls this again while `remaining` is above zero.
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_MANAGE);
    const { id } = await params;
    await getWorkspaceProject(id, user.workspaceId);
    return successResponse(await extractProjectMemory(id, 5));
  } catch (error) {
    return projectRouteError(error, "POST /api/projects/[id]/memory/extract");
  }
}
