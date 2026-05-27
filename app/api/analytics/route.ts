import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { workspace } = await auth();

    const totalQueries = await prisma.chatSession.count({
      where: { workspaceId: workspace.id }
    });

    const activeUsersCount = await prisma.user.count({
      where: { workspaceId: workspace.id }
    });

    const sourcesCount = await prisma.source.count({
      where: { workspaceId: workspace.id }
    });

    return successResponse({
      queries: totalQueries,
      activeUsers: activeUsersCount,
      sourcesConnected: sourcesCount,
      storageUsedMb: 120, // Mock for MVP
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/analytics error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
