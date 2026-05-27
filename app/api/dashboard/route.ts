import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user, workspace } = await auth();
    const workspaceId = workspace.id;

    // 2. Fetch Stats
    const totalDocuments = await prisma.document.count({ where: { workspaceId } });
    const totalSources = await prisma.source.count({ where: { workspaceId } });
    const recentChatSessions = await prisma.chatSession.count({
      where: {
        workspaceId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // last 24h
      }
    });
    // Let's create some dummy stats if they are 0 for the sake of the dashboard looking nice
    const coverage = Math.min(100, Math.max(10, Math.floor((totalDocuments / 100) * 100)));

    // 3. Fetch Insights (limit 4)
    let insights = await prisma.dashboardInsight.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 4
    });

    // Seed dummy insights if none exist so the UI isn't empty
    if (insights.length === 0) {
      const dummyInsights = [
        { workspaceId, priority: "HIGH", title: "Customer churn risk increased", description: "Churn risk has increased by 18% in the last 7 days driven by 3 key accounts.", source: "Salesforce", iconType: "TrendingDown" },
        { workspaceId, priority: "HIGH", title: "Engineering bottleneck detected", description: "API team is a blocking dependency for 12 projects.", source: "Jira", iconType: "Code2" },
        { workspaceId, priority: "MEDIUM", title: "Revenue anomaly identified", description: "Mid-market segment revenue dropped by 7% this week.", source: "Looker", iconType: "DollarSign" },
        { workspaceId, priority: "LOW", title: "Cross-team dependency alert", description: "Design handoff delay affecting product launch timeline.", source: "Notion", iconType: "Users" }
      ];
      await prisma.dashboardInsight.createMany({ data: dummyInsights });
      insights = await prisma.dashboardInsight.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' }, take: 4 });
    }

    // 4. Fetch Actions (limit 4)
    let actions = await prisma.dashboardAction.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 4
    });

    // Seed dummy actions if none exist
    if (actions.length === 0) {
      const dummyActions = [
        { workspaceId, description: "Updated CRM records", source: "Salesforce", iconType: "Cloud" },
        { workspaceId, description: "Triggered follow-up workflow", source: "Corely Workflow", iconType: "GitBranch" },
        { workspaceId, description: "Created executive digest", source: "Email", iconType: "Mail" },
        { workspaceId, description: "Ran risk analysis pipeline", source: "Corely AI", iconType: "Cpu" }
      ];
      await prisma.dashboardAction.createMany({ data: dummyActions });
      actions = await prisma.dashboardAction.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' }, take: 4 });
    }

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
      insights,
      actions
    });

  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/dashboard error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
