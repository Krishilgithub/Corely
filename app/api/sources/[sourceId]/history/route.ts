import { NextRequest } from "next/server";
import { auth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/sources/[sourceId]/history
 * Returns the last N sync events for a specific source,
 * derived from WorkflowActivity and the source record itself.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  try {
    const { workspace } = await auth();
    const { sourceId } = await params;

    // Verify source belongs to this workspace
    const source = await prisma.source.findFirst({
      where: { id: sourceId, workspaceId: workspace.id },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        itemsIndexed: true,
        lastSyncedAt: true,
        errorMessage: true,
      },
    });

    if (!source) return errorResponse("Source not found", 404);

    // Fetch sync-related workflow activities for this source
    // WorkflowActivity.workflowTitle contains the source name for sync events
    const activities = await prisma.workflowActivity.findMany({
      where: {
        workspaceId: workspace.id,
        workflowTitle: {
          contains: source.name,
        },
      },
      orderBy: { timestamp: "desc" },
      take: 20,
    });

    // Also get document count over time (last 5 indexed docs as proxy)
    const recentDocs = await prisma.document.findMany({
      where: { sourceId: source.id },
      select: { id: true, title: true, indexedAt: true },
      orderBy: { indexedAt: "desc" },
      take: 5,
    });

    // Build history entries from activities
    const historyFromActivities = activities.map(a => ({
      id: a.id,
      type: a.status === "success" ? "sync_completed" : a.status === "error" ? "sync_failed" : "sync_started",
      status: a.status as "success" | "error" | "running",
      description: a.status === "success"
        ? `${a.workflowTitle} completed successfully`
        : a.status === "error"
        ? `${a.workflowTitle} failed`
        : `${a.workflowTitle} in progress`,
      timestamp: a.timestamp.toISOString(),
      itemsIndexed: null as number | null,
    }));

    // Synthesize current state as most-recent entry
    const syntheticCurrent = source.lastSyncedAt
      ? {
          id: "current",
          type: source.status === "synced" ? "sync_completed" : source.status === "error" ? "sync_failed" : "sync_running",
          status: (source.status === "synced" ? "success" : source.status === "error" ? "error" : "running") as "success" | "error" | "running",
          description:
            source.status === "synced"
              ? `Sync completed — ${source.itemsIndexed} items indexed total`
              : source.status === "error"
              ? `Sync failed: ${source.errorMessage || "Unknown error"}`
              : "Sync in progress...",
          timestamp: source.lastSyncedAt.toISOString(),
          itemsIndexed: source.itemsIndexed,
        }
      : null;

    const history = [
      ...(syntheticCurrent ? [syntheticCurrent] : []),
      ...historyFromActivities,
    ].slice(0, 20);

    return successResponse({
      source: {
        id: source.id,
        name: source.name,
        type: source.type,
        status: source.status,
        itemsIndexed: source.itemsIndexed,
        lastSyncedAt: source.lastSyncedAt?.toISOString() ?? null,
      },
      history,
      recentDocuments: recentDocs.map(d => ({
        id: d.id,
        title: d.title,
        indexedAt: d.indexedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/sources/[sourceId]/history error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
