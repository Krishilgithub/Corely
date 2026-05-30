import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

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

    // Compute real storage: sum of rawContent byte lengths across all documents
    const documents = await prisma.document.findMany({
      where: { workspaceId: workspace.id },
      select: { rawContent: true },
    });

    const totalBytes = documents.reduce((acc, doc) => {
      return acc + (doc.rawContent ? Buffer.byteLength(doc.rawContent, "utf8") : 0);
    }, 0);
    const storageUsedMb = Math.round((totalBytes / (1024 * 1024)) * 100) / 100;

    const docsCount = documents.length;

    return successResponse({
      queries: totalQueries,
      activeUsers: activeUsersCount,
      sourcesConnected: sourcesCount,
      documentsIndexed: docsCount,
      storageUsedMb,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/analytics error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
