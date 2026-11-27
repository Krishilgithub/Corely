import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { workspace } = await auth();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // All documents in the workspace (not just this month)
    const docsIndexed = await prisma.document.count({
      where: {
        workspaceId: workspace.id,
      }
    });

    // Chat sessions started this month. This counts chats, not single questions.
    const chatsThisMonth = await prisma.chatSession.count({
      where: {
        workspaceId: workspace.id,
        createdAt: { gte: startOfMonth }
      }
    });

    // No plan limits are returned: nothing enforces them yet.
    return successResponse({
      plan: workspace.plan,
      docsIndexed,
      chatsThisMonth,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/usage error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
