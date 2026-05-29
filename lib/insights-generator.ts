import { prisma } from "@/lib/db";
import { subHours, subDays } from "date-fns";

export async function generateDynamicInsights(workspaceId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insights: any[] = [];
  let insightIdCounter = 1;

  // Helper to add an insight
  const addInsight = (
    icon: string, 
    title: string, 
    desc: string, 
    category: string, 
    priority: "Low" | "Medium" | "High" | "Critical", 
    impact: "Low" | "Medium" | "High",
    trend: "up" | "down" | "flat",
    time: string,
    source: string
  ) => {
    // Base colors
    let catBg = "#eff6ff";
    let catColor = "#3b82f6";
    let priBg = "#fffbeb";
    let priColor = "#d97706";

    if (category === "Operational") { catBg = "#f5f3ff"; catColor = "#8b5cf6"; }
    else if (category === "Activity") { catBg = "#f0fdf4"; catColor = "#16a34a"; }
    else if (category === "Product") { catBg = "#ecfeff"; catColor = "#0891b2"; }
    else if (category === "People") { catBg = "#fff7ed"; catColor = "#ea580c"; }
    else if (category === "Risk") { catBg = "#fef2f2"; catColor = "#ef4444"; }

    if (priority === "Critical") { priBg = "#fef2f2"; priColor = "#ef4444"; }
    else if (priority === "High") { priBg = "#fff3ee"; priColor = "#ff6b00"; }
    else if (priority === "Low") { priBg = "#f0fdf4"; priColor = "#16a34a"; }

    insights.push({
      id: `dyn-insight-${insightIdCounter++}`,
      icon,
      iconType: icon, // Keep iconType for backwards compatibility with some components
      iconBg: catBg,
      iconColor: catColor,
      title,
      description: desc, // description property for Dashboard Home
      desc,
      category,
      catBg,
      catColor,
      priority,
      priBg,
      priColor,
      impact,
      trend,
      time,
      source,
      createdAt: new Date().toISOString() // for formatTimeAgo
    });
  };

  // 1. Source Sync Health (Operational / Risk)
  const sources = await prisma.source.findMany({ where: { workspaceId } });
  
  if (sources.length === 0) {
    addInsight(
      "Database",
      "No data sources connected",
      "Your knowledge base is currently empty. Connect Google Drive, Slack, or GitHub to start populating your company brain.",
      "Product",
      "High",
      "High",
      "flat",
      "Just now",
      "System"
    );
  } else {
    let errorSources = 0;
    let staleSources = 0;
    const oneDayAgo = subDays(new Date(), 1);

    for (const source of sources) {
      if (source.status === "error") {
        errorSources++;
        addInsight(
          "AlertTriangle",
          `Sync failure detected in ${source.name}`,
          `The connector for ${source.type} is reporting errors. Please check your credentials and reconnect.`,
          "Operational",
          "Critical",
          "High",
          "down",
          "Recently",
          source.name
        );
      } else if (source.lastSyncedAt && source.lastSyncedAt < oneDayAgo) {
        staleSources++;
        addInsight(
          "Clock",
          `Stale data in ${source.name}`,
          `This source hasn't successfully synced in over 24 hours. Your AI might be missing recent context.`,
          "Risk",
          "Medium",
          "Medium",
          "down",
          "24h ago",
          source.name
        );
      }
    }

    if (errorSources === 0 && staleSources === 0 && sources.length > 0) {
      addInsight(
        "CheckCircle2",
        "All data sources are healthy",
        `${sources.length} integrations are actively syncing and providing up-to-date context to your workspace.`,
        "Operational",
        "Low",
        "Low",
        "up",
        "Just now",
        "System"
      );
    }
  }

  // 2. Knowledge Base Growth (Activity)
  const twentyFourHoursAgo = subHours(new Date(), 24);
  const newDocsCount = await prisma.document.count({
    where: {
      workspaceId,
      indexedAt: { gte: twentyFourHoursAgo }
    }
  });

  if (newDocsCount > 0) {
    addInsight(
      "FileText",
      "Knowledge base is growing rapidly",
      `${newDocsCount} new documents were indexed across your sources in the last 24 hours.`,
      "Activity",
      "Low",
      "Low",
      "up",
      "24h window",
      "Global"
    );
  } else if (sources.length > 0) {
    addInsight(
      "Activity",
      "Knowledge base growth is stagnant",
      "No new documents have been indexed in the last 24 hours. Ensure your teams are actively producing documentation.",
      "Activity",
      "Medium",
      "Medium",
      "flat",
      "24h window",
      "Global"
    );
  }

  // 3. Team Structure (People)
  const teamsCount = await prisma.team.count({ where: { workspaceId } });
  const usersCount = await prisma.user.count({ where: { workspaceId } });

  if (teamsCount === 0 && usersCount > 1) {
    addInsight(
      "Users",
      "Workspace lacks team organization",
      "You have multiple users but no teams created. Creating teams allows for granular access control and specialized AI scopes.",
      "People",
      "Medium",
      "Low",
      "flat",
      "Just now",
      "System"
    );
  } else if (usersCount === 1) {
    addInsight(
      "UserPlus",
      "Invite your team members",
      "Corely works best when your whole organization is connected. Invite your colleagues to multiply your productivity.",
      "People",
      "High",
      "High",
      "flat",
      "Just now",
      "System"
    );
  }

  return insights;
}
