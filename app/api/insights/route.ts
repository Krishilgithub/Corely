import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";

const mockInsightsData = [
  {
    iconType: "Activity",
    title: "Customer churn risk increased by 18%",
    description: "Early signals detected in 3 product segments. Finance, onboarding experience, and support responsiveness are key drivers.",
    category: "Customer",
    priority: "Critical",
    impact: "High",
    trend: "up",
    time: "2h ago",
    source: "Salesforce",
  },
  {
    iconType: "Code2",
    title: "Engineering dependency bottleneck detected",
    description: "Payments service is blocking 4 downstream teams. Average wait time increased to 2.7 days.",
    category: "Operational",
    priority: "High",
    impact: "High",
    trend: "up",
    time: "4h ago",
    source: "GitHub",
  },
  {
    iconType: "DollarSign",
    title: "Revenue anomaly identified in West region",
    description: "Pipeline value dropped 32% compared to last month despite consistent activity levels.",
    category: "Financial",
    priority: "High",
    impact: "High",
    trend: "up",
    time: "6h ago",
    source: "Google Drive",
  },
  {
    iconType: "Users",
    title: "Cross-team collaboration gap increasing",
    description: "Design handoffs to engineering taking 35% longer than usual. Communication volume decreased.",
    category: "People",
    priority: "Medium",
    impact: "Medium",
    trend: "up",
    time: "8h ago",
    source: "Slack",
  },
  {
    iconType: "ShieldAlert",
    title: "Security risk: Outdated dependencies found",
    description: "7 high-risk dependencies detected across 12 repositories. Immediate updates recommended.",
    category: "Risk",
    priority: "Medium",
    impact: "High",
    trend: "up",
    time: "10h ago",
    source: "GitHub",
  },
  {
    iconType: "Sparkles",
    title: "Feature adoption spike: AI Search",
    description: "Usage increased by 240% in the last 7 days. Strong engagement across power users.",
    category: "Product",
    priority: "Low",
    impact: "Medium",
    trend: "up",
    time: "12h ago",
    source: "Corely AI",
  },
];

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await requirePermission(Permissions.INSIGHTS_READ);

    // Check if there are any insights for this workspace
    let insights = await prisma.dashboardInsight.findMany({
      where: { workspaceId: currentUser.workspaceId },
      orderBy: { createdAt: 'desc' }
    });

    // Auto-seed mock data if DB is empty for demo purposes
    if (insights.length === 0) {
      await prisma.dashboardInsight.createMany({
        data: mockInsightsData.map(insight => ({
          workspaceId: currentUser.workspaceId,
          title: insight.title,
          description: insight.description,
          source: insight.source,
          priority: insight.priority,
          category: insight.category,
          impact: insight.impact,
          trend: insight.trend,
          time: insight.time,
          iconType: insight.iconType,
        }))
      });

      insights = await prisma.dashboardInsight.findMany({
        where: { workspaceId: currentUser.workspaceId },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Map Prisma models to the expected frontend schema
    const formattedInsights = insights.map(i => {
      // Base colors
      let iconBg = "#eff6ff";
      let iconColor = "#3b82f6";
      let catBg = "#eff6ff";
      let catColor = "#3b82f6";
      let priBg = "#fffbeb";
      let priColor = "#d97706";

      // Category colors
      if (i.category === "Customer") { catBg = "#fef2f2"; catColor = "#ef4444"; }
      else if (i.category === "Financial") { catBg = "#f0fdf4"; catColor = "#16a34a"; }
      else if (i.category === "People") { catBg = "#f5f3ff"; catColor = "#8b5cf6"; }
      else if (i.category === "Product") { catBg = "#ecfeff"; catColor = "#0891b2"; }
      else if (i.category === "Risk") { catBg = "#fef2f2"; catColor = "#ef4444"; }

      // Icon colors (match category roughly for now)
      iconBg = catBg;
      iconColor = catColor;

      // Priority colors
      if (i.priority === "Critical") { priBg = "#fef2f2"; priColor = "#ef4444"; }
      else if (i.priority === "High") { priBg = "#fff3ee"; priColor = "#ff6b00"; }
      else if (i.priority === "Low") { priBg = "#f0fdf4"; priColor = "#16a34a"; }

      return {
        id: i.id,
        icon: i.iconType,
        iconBg,
        iconColor,
        title: i.title,
        desc: i.description,
        category: i.category,
        catBg,
        catColor,
        priority: i.priority,
        priBg,
        priColor,
        impact: i.impact,
        trend: i.trend,
        time: i.time,
        source: i.source,
      };
    });

    return successResponse(formattedInsights);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/insights error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
