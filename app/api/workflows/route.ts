import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const { workspace } = await auth();

    // Mock workflows for MVP
    const workflows = [
      {
        id: "wf-1",
        title: "Weekly Engineering Digest",
        status: "Active",
      },
      {
        id: "wf-2",
        title: "Customer Churn Alert",
        status: "Active",
      }
    ];

    return successResponse({ workflows, workspaceId: workspace.id });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/workflows error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
