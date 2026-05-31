import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateDynamicInsights } from "@/lib/insights-generator";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await requirePermission(Permissions.INSIGHTS_READ);
    const workspaceId = currentUser.workspaceId;

    const insights = await generateDynamicInsights(workspaceId);

    // Generate real 6-week historical timeline data
    const now = new Date();
    const timelineData = [];
    
    // Create an array of 6 weeks ago, 5 weeks ago, etc.
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const nextWeekStart = new Date(now.getTime() - ((i - 1) * 7 * 24 * 60 * 60 * 1000));
      
      const docsCount = await prisma.document.count({
        where: {
          workspaceId: workspaceId,
          indexedAt: { lt: nextWeekStart }, // Total up to that week
        }
      });
      
      const chatsCount = await prisma.chatSession.count({
        where: {
          workspaceId: workspaceId,
          createdAt: { lt: nextWeekStart },
        }
      });

      timelineData.push({
        date: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        val: docsCount + chatsCount + 10, // Base line value + cumulative counts to show a trend
      });
    }

    // Return the dynamically calculated insights and timeline
    return successResponse({ insights, timeline: timelineData });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/insights error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
