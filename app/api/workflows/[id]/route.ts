import { auth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspace } = await auth();
    const data = await req.json();
    const { id } = await params;

    const workflow = await prisma.workflow.updateMany({
      where: {
        id,
        workspaceId: workspace.id,
      },
      data: {
        ...data,
      },
    });

    if (workflow.count === 0) {
      return errorResponse("Workflow not found", 404);
    }

    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("PATCH /api/workflows/[id] error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspace } = await auth();
    const { id } = await params;

    const result = await prisma.workflow.deleteMany({
      where: {
        id,
        workspaceId: workspace.id,
      },
    });

    if (result.count === 0) {
      return errorResponse("Workflow not found", 404);
    }

    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("DELETE /api/workflows/[id] error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
