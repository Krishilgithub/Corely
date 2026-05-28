import { auth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspace } = await auth();
    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        workspaceId: workspace.id,
      },
    });

    if (!workflow) {
      return errorResponse("Workflow not found", 404);
    }

    // Simulate execution updates
    const now = new Date();
    const lastRunStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const lastRunTimeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    await prisma.workflow.update({
      where: { id },
      data: {
        executions: {
          increment: 1,
        },
        lastRun: lastRunStr,
        lastRunTime: lastRunTimeStr,
      },
    });

    // Create activity log
    const activity = await prisma.workflowActivity.create({
      data: {
        workspaceId: workspace.id,
        workflowId: id,
        workflowTitle: workflow.title,
        status: "success",
        timestamp: "Just now",
      },
    });

    return successResponse({ activity });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/workflows/[id]/run error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
