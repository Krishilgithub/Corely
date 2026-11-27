import { requirePermission } from "@/lib/auth-server";
import { WorkflowPermissions } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

const EDITABLE_FIELDS = [
  "title", "desc", "icon", "iconBg", "iconCol",
  "triggerType", "triggerIcon", "triggerDesc",
  "status", "owner", "ownerBg", "ownerName",
] as const;

function pickEditableFields(data: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const key of EDITABLE_FIELDS) {
    if (typeof data[key] === "string") out[key] = data[key] as string;
  }
  return out;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(WorkflowPermissions.MANAGE);
    const data = await req.json();
    const { id } = await params;

    const workflow = await prisma.workflow.updateMany({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
      // Only the fields the edit form may change. Never let the client set
      // workspaceId, id, run counts or timestamps.
      data: pickEditableFields(data),
    });

    if (workflow.count === 0) {
      return errorResponse("Workflow not found", 404);
    }

    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("PATCH /api/workflows/[id] error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(WorkflowPermissions.MANAGE);
    const { id } = await params;

    const result = await prisma.workflow.deleteMany({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });

    if (result.count === 0) {
      return errorResponse("Workflow not found", 404);
    }

    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("DELETE /api/workflows/[id] error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
