import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateDynamicInsights } from "@/lib/insights-generator";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await requirePermission(Permissions.INSIGHTS_READ);
    const workspaceId = currentUser.workspaceId;

    const insights = await generateDynamicInsights(workspaceId);

    // Return the dynamically calculated insights
    return successResponse(insights);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/insights error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
