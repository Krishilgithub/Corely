import { prisma } from "@/lib/db";
import { subHours, subDays, formatDistanceToNow } from "date-fns";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InsightItem = Record<string, any>;

const CATEGORY_STYLES: Record<string, { catBg: string; catColor: string }> = {
  Operational: { catBg: "#f5f3ff", catColor: "#8b5cf6" },
  Activity:    { catBg: "#f0fdf4", catColor: "#16a34a" },
  Product:     { catBg: "#eff6ff", catColor: "#3b82f6" },
  People:      { catBg: "#fff7ed", catColor: "#ea580c" },
  Risk:        { catBg: "#fef2f2", catColor: "#ef4444" },
  Knowledge:   { catBg: "#ecfeff", catColor: "#0891b2" },
};

const PRIORITY_STYLES: Record<string, { priBg: string; priColor: string }> = {
  Critical: { priBg: "#fef2f2", priColor: "#ef4444" },
  High:     { priBg: "#fff3ee", priColor: "#ff6b00" },
  Medium:   { priBg: "#fffbeb", priColor: "#d97706" },
  Low:      { priBg: "#f0fdf4", priColor: "#16a34a" },
};

let insightIdCounter = 1;

function buildInsight(
  icon: string,
  title: string,
  desc: string,
  category: keyof typeof CATEGORY_STYLES,
  priority: "Low" | "Medium" | "High" | "Critical",
  impact: "Low" | "Medium" | "High",
  trend: "up" | "down" | "flat",
  time: string,
  source: string
): InsightItem {
  const { catBg, catColor } = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Product;
  const { priBg, priColor } = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Medium;

  return {
    id: `dyn-insight-${insightIdCounter++}`,
    icon,
    iconType: icon,
    iconBg: catBg,
    iconColor: catColor,
    title,
    description: desc,
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
    createdAt: new Date().toISOString(),
  };
}

export async function generateDynamicInsights(workspaceId: string): Promise<InsightItem[]> {
  insightIdCounter = 1;
  const insights: InsightItem[] = [];

  const now = new Date();
  const twentyFourHoursAgo = subHours(now, 24);
  const sevenDaysAgo = subDays(now, 7);
  const oneDayAgo = subDays(now, 1);

  // ── 1. SOURCE SYNC HEALTH (Operational / Risk) ─────────────────────────────
  const sources = await prisma.source.findMany({ where: { workspaceId } });

  if (sources.length === 0) {
    insights.push(buildInsight(
      "Database", "No data sources connected",
      "Your knowledge base is currently empty. Connect Google Drive, Slack, or GitHub to start populating your company brain.",
      "Product", "High", "High", "flat", "Just now", "System"
    ));
  } else {
    const errorSources = sources.filter(s => s.status === "error");
    const syncingSources = sources.filter(s => s.status === "syncing");
    const staleSources = sources.filter(
      s => s.lastSyncedAt && s.lastSyncedAt < oneDayAgo && s.status !== "error"
    );
    const healthySources = sources.filter(
      s => s.status === "synced" && s.lastSyncedAt && s.lastSyncedAt >= oneDayAgo
    );

    for (const s of errorSources) {
      insights.push(buildInsight(
        "AlertTriangle", `Sync failure — ${s.name}`,
        `${s.name} (${s.type}) is reporting sync errors. Error: ${s.errorMessage || "Unknown error"}. Reconnect to restore data flow.`,
        "Risk", "Critical", "High", "down",
        s.lastSyncedAt ? formatDistanceToNow(s.lastSyncedAt, { addSuffix: true }) : "Unknown",
        s.name
      ));
    }

    for (const s of staleSources) {
      insights.push(buildInsight(
        "Clock", `Stale data — ${s.name}`,
        `${s.name} hasn't synced in ${formatDistanceToNow(s.lastSyncedAt!)}. Your AI may be missing recent context from this source.`,
        "Risk", "Medium", "Medium", "down",
        formatDistanceToNow(s.lastSyncedAt!, { addSuffix: true }), s.name
      ));
    }

    if (syncingSources.length > 0) {
      insights.push(buildInsight(
        "RefreshCw", `${syncingSources.length} source${syncingSources.length > 1 ? "s" : ""} currently syncing`,
        `${syncingSources.map(s => s.name).join(", ")} ${syncingSources.length > 1 ? "are" : "is"} actively ingesting data into your knowledge base.`,
        "Activity", "Low", "Low", "up", "Now", "System"
      ));
    }

    if (errorSources.length === 0 && staleSources.length === 0 && healthySources.length > 0) {
      insights.push(buildInsight(
        "CheckCircle2", `All ${healthySources.length} source${healthySources.length > 1 ? "s" : ""} healthy`,
        `${healthySources.map(s => s.name).join(", ")} ${healthySources.length > 1 ? "are" : "is"} syncing regularly. Your knowledge base is up to date.`,
        "Operational", "Low", "Low", "up", "Just now", "System"
      ));
    }
  }

  // ── 2. KNOWLEDGE BASE GROWTH (Activity) ────────────────────────────────────
  const [newDocsLast24h, newDocsLast7d, totalDocs] = await Promise.all([
    prisma.document.count({ where: { workspaceId, indexedAt: { gte: twentyFourHoursAgo } } }),
    prisma.document.count({ where: { workspaceId, indexedAt: { gte: sevenDaysAgo } } }),
    prisma.document.count({ where: { workspaceId } }),
  ]);

  if (newDocsLast24h > 0) {
    insights.push(buildInsight(
      "FileText", `${newDocsLast24h} new document${newDocsLast24h > 1 ? "s" : ""} indexed today`,
      `${newDocsLast24h} document${newDocsLast24h > 1 ? "s were" : " was"} added to your knowledge base in the last 24 hours. Total: ${totalDocs} documents.`,
      "Activity", "Low", "Low", "up", "24h window", "Global"
    ));
  } else if (sources.length > 0 && totalDocs > 0) {
    insights.push(buildInsight(
      "Activity", "No new knowledge indexed today",
      `Knowledge base has been static for 24+ hours. ${totalDocs} total documents available. Trigger a manual sync or check source configurations.`,
      "Activity", "Medium", "Medium", "flat", "24h window", "Global"
    ));
  }

  if (newDocsLast7d > newDocsLast24h && newDocsLast7d > 5) {
    insights.push(buildInsight(
      "TrendingUp", `${newDocsLast7d} documents indexed this week`,
      `Strong knowledge growth this week. Your team is actively creating and syncing content — ${Math.round(newDocsLast7d / 7)} docs/day on average.`,
      "Knowledge", "Low", "High", "up", "7-day window", "Global"
    ));
  }

  // ── 3. AI USAGE INTELLIGENCE (Activity / Operational) ──────────────────────
  const [recentSessions, totalSessions, recentMessages] = await Promise.all([
    prisma.chatSession.count({ where: { workspaceId, createdAt: { gte: twentyFourHoursAgo } } }),
    prisma.chatSession.count({ where: { workspaceId } }),
    prisma.chatMessage.count({
      where: {
        session: { workspaceId },
        sender: "user",
        createdAt: { gte: sevenDaysAgo },
      },
    }),
  ]);

  if (recentSessions > 0) {
    insights.push(buildInsight(
      "MessageSquare", `${recentSessions} AI session${recentSessions > 1 ? "s" : ""} in the last 24h`,
      `Your team asked Corely ${recentMessages} questions in the past week across ${totalSessions} total sessions. AI adoption is ${totalSessions > 10 ? "strong" : "growing"}.`,
      "Activity", "Low", "Medium", "up", "24h window", "Corely AI"
    ));
  } else if (totalSessions === 0) {
    insights.push(buildInsight(
      "Sparkles", "Start using Corely AI",
      "No AI sessions yet. Try asking Corely about your company knowledge — press Ctrl+K or click 'Ask Corely' in the sidebar.",
      "Product", "High", "High", "flat", "Just now", "System"
    ));
  }

  // Check for negative feedback patterns
  const negativeFeedback = await prisma.chatMessage.count({
    where: {
      session: { workspaceId },
      sender: "corely",
      feedback: "negative",
      createdAt: { gte: sevenDaysAgo },
    },
  });

  if (negativeFeedback >= 3) {
    insights.push(buildInsight(
      "ThumbsDown", `${negativeFeedback} poor AI responses this week`,
      "Multiple users marked AI responses as unhelpful. Consider connecting more data sources or running a manual sync to improve retrieval quality.",
      "Risk", "High", "High", "down", "7-day window", "Corely AI"
    ));
  }

  // ── 4. TEAM & PEOPLE (People) ───────────────────────────────────────────────
  const [teamsCount, usersCount] = await Promise.all([
    prisma.team.count({ where: { workspaceId } }),
    prisma.user.count({ where: { workspaceId } }),
  ]);

  if (teamsCount === 0 && usersCount > 1) {
    insights.push(buildInsight(
      "Users", "Workspace lacks team organization",
      `You have ${usersCount} users but no teams. Creating teams enables granular knowledge access control and role-specific AI views.`,
      "People", "Medium", "Low", "flat", "Just now", "System"
    ));
  } else if (usersCount === 1) {
    insights.push(buildInsight(
      "UserPlus", "Invite your team to Corely",
      "Corely multiplies its value with more users. Invite your colleagues to build a shared institutional memory together.",
      "People", "High", "High", "flat", "Just now", "System"
    ));
  }

  // ── 5. KNOWLEDGE STALENESS SCORE (Knowledge / Risk) ────────────────────────
  if (totalDocs > 0) {
    const staleDocCount = await prisma.document.count({
      where: {
        workspaceId,
        updatedAt: { lt: subDays(now, 30) },
      },
    });

    const stalePercent = Math.round((staleDocCount / totalDocs) * 100);
    if (stalePercent >= 40) {
      insights.push(buildInsight(
        "Clock", `${stalePercent}% of knowledge is 30+ days old`,
        `${staleDocCount} of ${totalDocs} indexed documents haven't been updated in over 30 days. Consider running fresh syncs to improve AI response accuracy.`,
        "Risk", stalePercent >= 70 ? "High" : "Medium", "Medium", "down",
        "30-day window", "Global"
      ));
    } else if (stalePercent < 15 && totalDocs >= 10) {
      insights.push(buildInsight(
        "Zap", "Knowledge base is highly fresh",
        `Only ${stalePercent}% of your ${totalDocs} documents are older than 30 days. Your AI has access to very current organizational context.`,
        "Knowledge", "Low", "High", "up", "30-day window", "Global"
      ));
    }
  }

  // ── 6. CONNECTOR COVERAGE GAP (Product) ────────────────────────────────────
  const connectedTypes = new Set(sources.map(s => s.type));
  const TIER1_CONNECTORS = ["github", "slack", "notion", "google_drive"];
  const missingTier1 = TIER1_CONNECTORS.filter(t => !connectedTypes.has(t));

  if (missingTier1.length >= 3 && sources.length > 0) {
    insights.push(buildInsight(
      "Plug", `${missingTier1.length} key integrations not connected`,
      `You're missing: ${missingTier1.join(", ")}. Each integration significantly expands your AI's knowledge coverage. Connect them in Sources.`,
      "Product", "Medium", "High", "flat", "Just now", "System"
    ));
  }

  return insights;
}
