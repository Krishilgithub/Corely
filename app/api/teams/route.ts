import { requirePermission } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";



export async function GET() {
  try {
    const user = await requirePermission(Permissions.TEAMS_READ);

    const teams = await prisma.team.findMany({
      where: { workspaceId: user.workspaceId },
      // Only safe user fields. Never send password hashes or reset tokens to the browser.
      include: { users: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });

    // Only real fields. Health, knowledge, collaboration and actions are not measured,
    // so they are left out instead of showing stored placeholder numbers.
    const formattedTeams = teams.map(t => ({
      id: t.id,
      name: t.name,
      focus: t.focus,
      createdAt: t.createdAt,
      users: t.users,
      members: t.users.length, // The real number of people in the team
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

    if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
      return errorResponse("Team name is required", 400);
    }

    const team = await prisma.team.create({
      data: {
        workspaceId: user.workspaceId,
        name: data.name.trim(),
        // A new team has no people yet. Members are counted from real users, not typed in.
        members: 0,
        icon: "Users",
        iconBg: "#eff6ff",
        iconColor: "#3b82f6",
        // The schema still requires these metric columns. They are not measured yet,
        // so we store fixed placeholders and never show them in the UI.
        health: 100,
        healthColor: "#10b981",
        collab: "Good",
        know: 100,
        knowColor: "#10b981",
        actions: 0,
        actionsTrend: 0,
        focus: typeof data.focus === "string" && data.focus.trim() ? data.focus.trim() : "General",
        focusBg: "#f5f3ff",
        focusColor: "#8b5cf6",
        isUp: true,
      },
    });

    return successResponse({ id: team.id, name: team.name, focus: team.focus, createdAt: team.createdAt, members: 0, users: [] });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/teams error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
