import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { workspace } = await auth();

    // Calculate documents indexed this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const docsIndexed = await prisma.document.count({
      where: { 
        workspaceId: workspace.id,
      }
    });

    const queriesThisMonth = await prisma.chatSession.count({
      where: {
        workspaceId: workspace.id,
        createdAt: { gte: startOfMonth }
      }
    });

    // Determine limits based on plan
    const isEnterprise = workspace.plan.toLowerCase() === "enterprise";
    const documentLimit = isEnterprise ? 10000 : 100;
    const queryLimit = isEnterprise ? 50000 : 500;

    // Use the higher percentage of the two to show as "usage"
    const docPct = Math.min(100, Math.round((docsIndexed / documentLimit) * 100));
    const queryPct = Math.min(100, Math.round((queriesThisMonth / queryLimit) * 100));
    const maxPct = Math.max(docPct, queryPct);

    return successResponse({
      plan: workspace.plan,
      isEnterprise,
      usagePercent: maxPct,
      docsIndexed,
      documentLimit,
      queriesThisMonth,
      queryLimit
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/usage error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
