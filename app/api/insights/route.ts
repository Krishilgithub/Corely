import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";

const insightsData = [
  {
    id: 1,
    icon: "Activity",
    iconBg: "#fef2f2",
    iconColor: "#ef4444",
    title: "Customer churn risk increased by 18%",
    desc: "Early signals detected in 3 product segments. Finance, onboarding experience, and support responsiveness are key drivers.",
    category: "Customer",
    catBg: "#fef2f2",
    catColor: "#ef4444",
    priority: "Critical",
    priBg: "#fef2f2",
    priColor: "#ef4444",
    impact: "High",
    trend: "up",
    time: "2h ago",
  },
  {
    id: 2,
    icon: "Code2",
    iconBg: "#fffbeb",
    iconColor: "#d97706",
    title: "Engineering dependency bottleneck detected",
    desc: "Payments service is blocking 4 downstream teams. Average wait time increased to 2.7 days.",
    category: "Operational",
    catBg: "#eff6ff",
    catColor: "#3b82f6",
    priority: "High",
    priBg: "#fff3ee",
    priColor: "#ff6b00",
    impact: "High",
    trend: "up",
    time: "4h ago",
  },
  {
    id: 3,
    icon: "DollarSign",
    iconBg: "#fff3ee",
    iconColor: "#ff6b00",
    title: "Revenue anomaly identified in West region",
    desc: "Pipeline value dropped 32% compared to last month despite consistent activity levels.",
    category: "Financial",
    catBg: "#f0fdf4",
    catColor: "#16a34a",
    priority: "High",
    priBg: "#fff3ee",
    priColor: "#ff6b00",
    impact: "High",
    trend: "up",
    time: "6h ago",
  },
  {
    id: 4,
    icon: "Users",
    iconBg: "#f5f3ff",
    iconColor: "#8b5cf6",
    title: "Cross-team collaboration gap increasing",
    desc: "Design handoffs to engineering taking 35% longer than usual. Communication volume decreased.",
    category: "People",
    catBg: "#f5f3ff",
    catColor: "#8b5cf6",
    priority: "Medium",
    priBg: "#fffbeb",
    priColor: "#d97706",
    impact: "Medium",
    trend: "up",
    time: "8h ago",
  },
  {
    id: 5,
    icon: "ShieldAlert",
    iconBg: "#fef2f2",
    iconColor: "#ef4444",
    title: "Security risk: Outdated dependencies found",
    desc: "7 high-risk dependencies detected across 12 repositories. Immediate updates recommended.",
    category: "Risk",
    catBg: "#fef2f2",
    catColor: "#ef4444",
    priority: "Medium",
    priBg: "#fffbeb",
    priColor: "#d97706",
    impact: "High",
    trend: "up",
    time: "10h ago",
  },
  {
    id: 6,
    icon: "Sparkles",
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
    title: "Feature adoption spike: AI Search",
    desc: "Usage increased by 240% in the last 7 days. Strong engagement across power users.",
    category: "Product",
    catBg: "#ecfeff",
    catColor: "#0891b2",
    priority: "Low",
    priBg: "#f0fdf4",
    priColor: "#16a34a",
    impact: "Medium",
    trend: "up",
    time: "12h ago",
  },
];

export async function GET() {
  try {
    await auth(); // Enforce authentication

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return successResponse(insightsData);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/insights error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
