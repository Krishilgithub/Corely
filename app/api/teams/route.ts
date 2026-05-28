import { auth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

const DEFAULT_TEAMS = [
  {
    name: "Engineering",
    members: 128,
    icon: "Users",
    iconBg: "#eff6ff",
    iconColor: "#3b82f6",
    health: 92,
    healthColor: "#10b981",
    collab: "Excellent",
    know: 96,
    knowColor: "#10b981",
    actions: 342,
    actionsTrend: 18,
    focus: "Productivity",
    focusBg: "#f5f3ff",
    focusColor: "#8b5cf6",
    isUp: true,
  },
  {
    name: "Product",
    members: 64,
    icon: "BarChart2",
    iconBg: "#eff6ff",
    iconColor: "#3b82f6",
    health: 88,
    healthColor: "#10b981",
    collab: "Good",
    know: 93,
    knowColor: "#10b981",
    actions: 221,
    actionsTrend: 12,
    focus: "Roadmap",
    focusBg: "#eff6ff",
    focusColor: "#3b82f6",
    isUp: true,
  },
  {
    name: "Sales",
    members: 96,
    icon: "Target",
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
    health: 85,
    healthColor: "#10b981",
    collab: "Good",
    know: 90,
    knowColor: "#10b981",
    actions: 184,
    actionsTrend: 15,
    focus: "Pipeline",
    focusBg: "#f0fdf4",
    focusColor: "#16a34a",
    isUp: true,
  },
  {
    name: "Marketing",
    members: 48,
    icon: "Users",
    iconBg: "#fef2f2",
    iconColor: "#ef4444",
    health: 78,
    healthColor: "#f59e0b",
    collab: "Fair",
    know: 85,
    knowColor: "#10b981",
    actions: 132,
    actionsTrend: 8,
    focus: "Campaigns",
    focusBg: "#fff3ee",
    focusColor: "#ff6b00",
    isUp: true,
  },
  {
    name: "Customer Success",
    members: 52,
    icon: "Activity",
    iconBg: "#eff6ff",
    iconColor: "#3b82f6",
    health: 75,
    healthColor: "#f59e0b",
    collab: "Fair",
    know: 83,
    knowColor: "#10b981",
    actions: 98,
    actionsTrend: 5,
    focus: "Retention",
    focusBg: "#fffbeb",
    focusColor: "#d97706",
    isUp: true,
  },
  {
    name: "Finance",
    members: 36,
    icon: "Target",
    iconBg: "#fffbeb",
    iconColor: "#d97706",
    health: 72,
    healthColor: "#f59e0b",
    collab: "Fair",
    know: 80,
    knowColor: "#f59e0b",
    actions: 76,
    actionsTrend: -2,
    focus: "Reporting",
    focusBg: "#f5f3ff",
    focusColor: "#8b5cf6",
    isUp: false,
  },
  {
    name: "People Operations",
    members: 28,
    icon: "Users",
    iconBg: "#fff3ee",
    iconColor: "#ff6b00",
    health: 68,
    healthColor: "#ff6b00",
    collab: "Needs attention",
    know: 74,
    knowColor: "#f59e0b",
    actions: 64,
    actionsTrend: -4,
    focus: "HR Systems",
    focusBg: "#fef2f2",
    focusColor: "#ef4444",
    isUp: false,
  },
  {
    name: "Legal",
    members: 15,
    icon: "ShieldAlert",
    iconBg: "#fef2f2",
    iconColor: "#ef4444",
    health: 60,
    healthColor: "#ef4444",
    collab: "Poor",
    know: 62,
    knowColor: "#ef4444",
    actions: 31,
    actionsTrend: -6,
    focus: "Compliance",
    focusBg: "#fef2f2",
    focusColor: "#ef4444",
    isUp: false,
  },
];

export async function GET() {
  try {
    const { workspace } = await auth();

    let teams = await prisma.team.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "asc" },
    });

    if (teams.length === 0) {
      await prisma.team.createMany({
        data: DEFAULT_TEAMS.map((t) => ({ ...t, workspaceId: workspace.id })),
      });
      teams = await prisma.team.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: "asc" },
      });
    }

    return successResponse(teams);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/teams error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const { workspace } = await auth();
    const data = await req.json();

    const team = await prisma.team.create({
      data: {
        workspaceId: workspace.id,
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
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/teams error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
