import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateDynamicInsights } from "@/lib/insights-generator";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { user, workspace } = await auth();
    const workspaceId = workspace.id;

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'Today';
    
    let gteDate = new Date(0); // All time fallback
    if (dateRange === 'Today') gteDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    else if (dateRange === 'This Week') gteDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (dateRange === 'This Month') gteDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 2. Fetch Stats
    const totalDocuments = await prisma.document.count({ where: { workspaceId } });
    const totalSources = await prisma.source.count({ where: { workspaceId } });
    const recentChatSessions = await prisma.chatSession.count({
      where: {
        workspaceId,
        createdAt: { gte: gteDate }
      }
    });
    
    // Knowledge Coverage Algorithm
    const coverage = Math.min(100, Math.max(15, totalSources * 20 + Math.min(20, Math.floor(totalDocuments / 2))));

    // System Health Check
    const sources = await prisma.source.findMany({ where: { workspaceId } });
    const hasError = sources.some(s => s.status === 'ERROR');
    const systemHealth = hasError ? "Degraded" : "Operational";

    // 3. Fetch Insights (limit 4)
    const allInsights = await generateDynamicInsights(workspaceId);
    const insights = allInsights.slice(0, 4);

    // 4. Fetch Actions (limit 4)
    const actions = await prisma.dashboardAction.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 4
    });

    return successResponse({
      user: {
        name: user.name || "Krishil"
      },
      stats: {
        documentsIndexed: totalDocuments,
        sourcesConnected: totalSources,
        recentChats: recentChatSessions,
        coverage: coverage
      },
      systemHealth,
      insights,
      actions
    });

  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/dashboard error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
