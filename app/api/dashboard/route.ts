import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getDashboardData, parseDateRange } from "@/app/dashboard/dashboard-data";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { user, workspace } = await auth();

    const { searchParams } = new URL(request.url);
    const dateRange = parseDateRange(searchParams.get('dateRange'));

    // Same real data the dashboard home page renders. No name fallback beyond "User".
    const data = await getDashboardData({
      userId: user.id,
      userName: user.name,
      workspaceId: workspace.id,
      dateRange,
    });

    return successResponse(data);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/dashboard error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
