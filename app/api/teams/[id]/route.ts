import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { Permissions } from "@/lib/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { workspaceId } = await requirePermission(Permissions.TEAMS_READ);

    const team = await prisma.team.findFirst({
      where: {
        id,
        workspaceId,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            workspaceRole: {
              select: { name: true }
            }
          },
        },
      },
    });

    if (!team) {
      return errorResponse("Team not found", 404);
    }

    return successResponse(team);
  } catch (error) {
    console.error("GET /api/teams/[id] error:", error);
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") {
      return errorResponse("Forbidden", 403);
    }
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { workspaceId } = await requirePermission(Permissions.TEAMS_MANAGE);

    const team = await prisma.team.findFirst({
      where: {
        id,
        workspaceId,
      },
    });

    if (!team) {
      return errorResponse("Team not found", 404);
    }

    await prisma.team.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/teams/[id] error:", error);
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") {
      return errorResponse("Forbidden", 403);
    }
    return errorResponse("Internal server error", 500);
  }
}
