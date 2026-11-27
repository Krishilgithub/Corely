import { requirePermission } from "@/lib/auth-server";
import { WorkflowPermissions } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(WorkflowPermissions.MANAGE);
    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });

    if (!workflow) {
      return errorResponse("Workflow not found", 404);
    }

    // There is no workflow execution engine yet. "Record a run" only records that a
    // manual run was asked for: it bumps the run count and adds a log entry.
    // No trigger or action is executed.
    const now = new Date();
    const lastRunStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const lastRunTimeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Scope the update to the caller's workspace too, not just the id.
    await prisma.workflow.updateMany({
      where: { id, workspaceId: user.workspaceId },
      data: {
        executions: {
          increment: 1,
        },
        lastRun: lastRunStr,
        lastRunTime: lastRunTimeStr,
      },
    });

    // Log the run honestly as "recorded", not "success"
    const activity = await prisma.workflowActivity.create({
      data: {
        workspaceId: user.workspaceId,
        workflowId: id,
        workflowTitle: workflow.title,
        status: "recorded",
        // timestamp defaults to now() via schema
      },
    });

    return successResponse({ activity });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/workflows/[id]/run error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
