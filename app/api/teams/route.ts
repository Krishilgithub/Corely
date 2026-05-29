import { requirePermission } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";



export async function GET() {
  try {
    const user = await requirePermission(Permissions.TEAMS_READ);

    const teams = await prisma.team.findMany({
      where: { workspaceId: user.workspaceId },
      include: { users: true },
      orderBy: { createdAt: "asc" },
    });

    const formattedTeams = teams.map(t => ({
      ...t,
      members: Math.max(t.users.length, t.members) // Keep default members if no real users yet
    }));

    return successResponse(formattedTeams);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/teams error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requirePermission(Permissions.TEAMS_MANAGE);
    const data = await req.json();

    const team = await prisma.team.create({
      data: {
        workspaceId: user.workspaceId,
        name: data.name,
        members: parseInt(data.members || "1", 10),
        icon: data.icon || "Users",
        iconBg: data.iconBg || "#eff6ff",
        iconColor: data.iconColor || "#3b82f6",
        health: data.health || 100,
        healthColor: data.healthColor || "#10b981",
        collab: data.collab || "Good",
        know: data.know || 100,
        knowColor: data.knowColor || "#10b981",
        actions: data.actions || 0,
        actionsTrend: data.actionsTrend || 0,
        focus: data.focus || "Growth",
        focusBg: data.focusBg || "#f5f3ff",
        focusColor: data.focusColor || "#8b5cf6",
        isUp: data.isUp !== undefined ? data.isUp : true,
      },
    });

    return successResponse(team);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/teams error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
