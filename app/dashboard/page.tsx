import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { generateDynamicInsights } from "@/lib/insights-generator";
import DashboardClient from "./DashboardClient";

export const dynamic = 'force-dynamic';

export default async function DashboardPage(props: { searchParams?: Promise<{ dateRange?: string }> }) {
  const { user, workspace } = await auth();
  const workspaceId = workspace.id;

  // Extract search params dynamically in Next 15+ compatible way
  const searchParams = props.searchParams ? await props.searchParams : {};
  const dateRange = searchParams.dateRange || 'Today';

  let gteDate = new Date(0); // All time fallback
  if (dateRange === 'Today') gteDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  else if (dateRange === 'This Week') gteDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  else if (dateRange === 'This Month') gteDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. Fetch Stats
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

  // 2. Fetch Insights (limit 4)
  const allInsights = await generateDynamicInsights(workspaceId);
  const insights = allInsights.slice(0, 4);

  // 3. Fetch Actions (limit 4)
  const actions = await prisma.dashboardAction.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    take: 4
  });

  const initialData = {
    user: {
      name: user.name || "User"
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
  };

  return <DashboardClient initialData={initialData} dateRange={dateRange} />;
}
