import { requirePermission } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Permissions } from "@/lib/rbac";
import { successResponse } from "@/lib/api-response";
import { projectRouteError } from "@/lib/projects";

export const dynamic = "force-dynamic";

// GET /api/projects/options — people and teams for the owner and team pickers.
export async function GET() {
  try {
    const user = await requirePermission(Permissions.PROJECTS_READ);
    const [members, teams] = await Promise.all([
      prisma.user.findMany({
        where: { workspaceId: user.workspaceId },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
      prisma.team.findMany({
        where: { workspaceId: user.workspaceId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return successResponse({ members, teams, currentUserId: user.id });
  } catch (error) {
    return projectRouteError(error, "GET /api/projects/options");
  }
}
