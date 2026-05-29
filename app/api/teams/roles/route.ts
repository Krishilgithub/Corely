import { auth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { createDefaultRolesForWorkspace } from "@/lib/rbac";

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
    console.error("GET /api/teams/roles error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const { workspace } = await auth();
    const data = await req.json();

    if (!data.name) {
      return errorResponse("Role name is required", 400);
    }

    const role = await prisma.workspaceRole.create({
      data: {
        workspaceId: workspace.id,
        name: data.name,
        permissions: data.permissions || [],
      },
    });

    return successResponse(role);
  } catch (error) {
    console.error("POST /api/teams/roles error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

