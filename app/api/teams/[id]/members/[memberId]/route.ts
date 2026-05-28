import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { Permissions } from "@/lib/rbac";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
    const { workspaceId } = await requirePermission(Permissions.TEAMS_MANAGE);

    // Verify team belongs to workspace
    const team = await prisma.team.findFirst({
      where: {
        id,
        workspaceId,
      },
      include: {
        users: true,
      },
    });

    if (!team) {
      return errorResponse("Team not found", 404);
    }

    // Check if user is in team
    const isMember = team.users.some(u => u.id === memberId);
    if (!isMember) {
      return errorResponse("User is not a member of this team", 400);
    }

    // Disconnect user from team
    await prisma.team.update({
      where: { id },
      data: {
        users: {
          disconnect: { id: memberId },
        },
        members: Math.max(1, team.members - 1),
      },
    });

    return successResponse({ removed: true });
  } catch (error) {
    console.error("DELETE /api/teams/[id]/members/[memberId] error:", error);
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") {
      return errorResponse("Forbidden", 403);
    }
    return errorResponse("Internal server error", 500);
  }
}
