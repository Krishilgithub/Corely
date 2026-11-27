import { prisma } from "@/lib/db";
import { generateDynamicInsights } from "@/lib/insights-generator";

// Server-only helper. It builds everything the dashboard home shows from real
// database rows. Both app/dashboard/page.tsx and GET /api/dashboard use it.

export const DATE_RANGES = ["Today", "This Week", "This Month", "All Time"] as const;
export type DateRange = (typeof DATE_RANGES)[number];

// Plain words for the window each range really covers. Shown under the tiles.
export const DATE_RANGE_WINDOW: Record<DateRange, string> = {
  "Today": "Last 24 hours",
  "This Week": "Last 7 days",
  "This Month": "Last 30 days",
  "All Time": "All time",
};

// One row in the home activity feed.
export interface ActivityItem {
  id: string;
  title: string;
  desc: string;
  // ISO time of the real event.
  time: string;
  // Source type (for a logo) or a lucide icon name. One or the other.
  source?: string;
  iconType?: string;
  // Page the row opens when clicked.
  href: string;
}

// The insight fields the home panel reads (lib/insights-generator.ts builds them).
export interface HomeInsight {
  id: string;
  iconType: string;
  priority: string;
  title: string;
  description: string;
  source: string;
  createdAt: string | null;
  href: string;
}

// Where a notification without its own link should take the user.
function notificationHref(link: string | null, iconType: string): string {
  if (link && link.startsWith("/")) return link;
  if (iconType === "UserPlus") return "/dashboard/settings/members";
  if (iconType === "Database" || iconType === "AlertTriangle") return "/dashboard/sources";
  return "/dashboard/settings/notifications";
}

// One card in the "Recent actions" panel.
export interface RecentAction {
  id: string;
  description: string;
  source: string;
  iconType: string;
  createdAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDateRange(value?: string | null): DateRange {
  return (DATE_RANGES as readonly string[]).includes(value || "") ? (value as DateRange) : "Today";
}

function rangeStart(range: DateRange): Date {
  if (range === "Today") return new Date(Date.now() - DAY_MS);
  if (range === "This Week") return new Date(Date.now() - 7 * DAY_MS);
  if (range === "This Month") return new Date(Date.now() - 30 * DAY_MS);
  return new Date(0);
}

export async function getDashboardData(opts: {
  userId: string;
  userName: string | null;
  workspaceId: string;
  dateRange: DateRange;
}) {
  const { userId, userName, workspaceId, dateRange } = opts;
  const gteDate = rangeStart(dateRange);
  const weekAgo = new Date(Date.now() - 7 * DAY_MS);
  const monthAgo = new Date(Date.now() - 30 * DAY_MS);

  const [
    totalDocuments,
    docsInRange,
    chatsInRange,
    totalChats,
    usersCount,
    sources,
    notifications,
    docsBySource,
    newMembers,
    recentChats,
  ] = await Promise.all([
    prisma.document.count({ where: { workspaceId } }),
    prisma.document.count({ where: { workspaceId, indexedAt: { gte: gteDate } } }),
    prisma.chatSession.count({ where: { workspaceId, createdAt: { gte: gteDate } } }),
    prisma.chatSession.count({ where: { workspaceId } }),
    prisma.user.count({ where: { workspaceId } }),
    prisma.source.findMany({
      where: { workspaceId },
      select: { id: true, name: true, type: true, status: true, lastSyncedAt: true, itemsIndexed: true },
    }),
    // Only workspace-wide notices and the ones meant for this user.
    prisma.notification.findMany({
      where: { workspaceId, OR: [{ userId: null }, { userId }] },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, message: true, iconType: true, link: true, createdAt: true },
    }),
    prisma.document.groupBy({
      by: ["sourceId"],
      where: { workspaceId, indexedAt: { gte: weekAgo } },
      _count: { _all: true },
      _max: { indexedAt: true },
    }),
    prisma.user.findMany({
      where: { workspaceId, createdAt: { gte: monthAgo } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.chatSession.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
      take: 2,
      select: { id: true, title: true, updatedAt: true },
    }),
  ]);

  // Connectors write lowercase ("error"), so compare without case.
  const errorSources = sources.filter((s) => (s.status || "").toLowerCase() === "error").length;
  const systemHealth = errorSources > 0 ? "Degraded" : "Operational";

  // Newest real sync time across all sources, or null if nothing has synced.
  const lastSyncedAt = sources.reduce<Date | null>(
    (latest, s) => (s.lastSyncedAt && (!latest || s.lastSyncedAt > latest) ? s.lastSyncedAt : latest),
    null
  );

  // ── Activity feed: real events only ──
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const activity: ActivityItem[] = [];

  for (const n of notifications) {
    activity.push({
      id: `notif-${n.id}`,
      title: n.title,
      desc: n.message,
      time: n.createdAt.toISOString(),
      iconType: n.iconType,
      href: notificationHref(n.link, n.iconType),
    });
  }

  for (const g of docsBySource) {
    const src = sourceById.get(g.sourceId);
    const latest = g._max.indexedAt;
    if (!src || !latest) continue;
    const count = g._count._all;
    activity.push({
      id: `docs-${g.sourceId}`,
      title: `${src.name} indexed`,
      desc: `${count} document${count === 1 ? "" : "s"} indexed in the last 7 days`,
      time: latest.toISOString(),
      source: src.type,
      href: "/dashboard/sources",
    });
  }

  for (const m of newMembers) {
    activity.push({
      id: `member-${m.id}`,
      title: `${m.name || m.email} joined`,
      desc: "Joined this workspace",
      time: m.createdAt.toISOString(),
      iconType: "UserPlus",
      href: "/dashboard/settings/members",
    });
  }

  activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // ── Recent actions: real syncs and chats ──
  const actions: RecentAction[] = [];

  const recentlySynced = sources
    .filter((s) => s.lastSyncedAt)
    .sort((a, b) => b.lastSyncedAt!.getTime() - a.lastSyncedAt!.getTime())
    .slice(0, 2);
  for (const s of recentlySynced) {
    actions.push({
      id: `sync-${s.id}`,
      // itemsIndexed is the running total for the source, not the size of the last sync.
      description: `Synced ${s.name} (${s.itemsIndexed} items indexed in total)`,
      source: s.name,
      iconType: "RefreshCw",
      createdAt: s.lastSyncedAt!.toISOString(),
    });
  }

  for (const chat of recentChats) {
    if (chat.title === "New Conversation") continue;
    actions.push({
      id: `chat-${chat.id}`,
      description: `Chat: "${chat.title.slice(0, 50)}"`,
      source: "Corely AI",
      iconType: "MessageSquare",
      createdAt: chat.updatedAt.toISOString(),
    });
  }

  actions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const allInsights = await generateDynamicInsights(workspaceId);

  return {
    user: { name: userName || "User" },
    dateRange,
    dateWindow: DATE_RANGE_WINDOW[dateRange],
    stats: {
      documentsIndexed: totalDocuments,
      documentsInRange: docsInRange,
      sourcesConnected: sources.length,
      sourcesWithErrors: errorSources,
      recentChats: chatsInRange,
    },
    onboarding: {
      hasAskedQuestion: totalChats > 0,
      hasInvitedTeam: usersCount > 1,
    },
    systemHealth,
    lastSyncedAt: lastSyncedAt ? lastSyncedAt.toISOString() : null,
    insights: allInsights.slice(0, 4) as HomeInsight[],
    activity: activity.slice(0, 6),
    actions: actions.slice(0, 4),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
