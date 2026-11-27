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

    // Real 6-week timeline: running total of indexed documents plus chats
    // started, counted up to each weekly point. No padding is added.
    const now = new Date();
    const timelineData = [];

    for (let i = 5; i >= 0; i--) {
      const pointDate = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));

      const docsCount = await prisma.document.count({
        where: {
          workspaceId: workspaceId,
          indexedAt: { lte: pointDate },
        }
      });

      const chatsCount = await prisma.chatSession.count({
        where: {
          workspaceId: workspaceId,
          createdAt: { lte: pointDate },
        }
      });

      timelineData.push({
        date: pointDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        val: docsCount + chatsCount,
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
