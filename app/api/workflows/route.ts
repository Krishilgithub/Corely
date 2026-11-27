import { requirePermission } from "@/lib/auth-server";
import { WorkflowPermissions } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await requirePermission(WorkflowPermissions.READ);

    const workflows = await prisma.workflow.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { createdAt: "desc" },
    });

    const activities = await prisma.workflowActivity.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return successResponse({ workflows, activities });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/workflows error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requirePermission(WorkflowPermissions.MANAGE);
    const data = await req.json();

    const workflow = await prisma.workflow.create({
      data: {
        workspaceId: user.workspaceId,
        title: data.title,
        desc: data.desc,
        icon: data.icon,
        iconBg: data.iconBg,
        iconCol: data.iconCol,
        triggerType: data.triggerType,
        triggerIcon: data.triggerIcon,
        triggerDesc: data.triggerDesc,
        status: data.status,
        owner: data.owner,
        ownerBg: data.ownerBg,
        ownerName: data.ownerName,
        executions: 0,
        lastRun: "—",
        lastRunTime: "",
      },
    });

    return successResponse({ workflow });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/workflows error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
