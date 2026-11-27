import { auth, requirePermission } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { createDefaultRolesForWorkspace, Permissions } from "@/lib/rbac";

export async function GET() {
  try {
    const { workspace } = await auth();

    let roles = await prisma.workspaceRole.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "asc" },
    });

    // Auto-seed default roles if none exist for this workspace
    if (roles.length === 0) {
      await createDefaultRolesForWorkspace(workspace.id);
      roles = await prisma.workspaceRole.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: "asc" },
      });
    }

    return successResponse(roles);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/teams/roles error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function POST(req: Request) {
  try {
    // Creating a role changes who can do what, so it needs the same right as managing members.
    const user = await requirePermission(Permissions.TEAMS_MANAGE);
    const data = await req.json();

    if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
      return errorResponse("Role name is required", 400);
    }

    // Accept only permissions the app knows about, and at least one, so the role is usable.
    const known = Object.values(Permissions) as string[];
    const permissions: string[] = Array.isArray(data.permissions) ? data.permissions : [];
    if (permissions.length === 0) {
      return errorResponse("Pick at least one permission for the role", 400);
    }
    if (permissions.some(p => typeof p !== "string" || !known.includes(p))) {
      return errorResponse("Unknown permission in the list", 400);
    }

    const role = await prisma.workspaceRole.create({
      data: {
        workspaceId: user.workspaceId,
        name: data.name.trim(),
        permissions: Array.from(new Set(permissions)),
      },
    });

    return successResponse(role);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/teams/roles error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
