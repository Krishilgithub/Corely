import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/sources/[sourceId]/history
 * Returns the latest sync state of a source and its most recently indexed documents.
 * Syncs do not keep a per-run log yet, so this only reports what the source record
 * really holds: the last sync time, its status and the total items indexed.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  try {
    const user = await requirePermission(Permissions.SOURCES_READ);
    const { sourceId } = await params;

    // Verify source belongs to this workspace
    const source = await prisma.source.findFirst({
      where: { id: sourceId, workspaceId: user.workspaceId },
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

    // The 5 most recently indexed documents for this source
    const recentDocs = await prisma.document.findMany({
      where: { sourceId: source.id },
      select: { id: true, title: true, indexedAt: true },
      orderBy: { indexedAt: "desc" },
      take: 5,
    });

    // One honest entry built from the source record: the last sync and its result.
    const lastSync = source.lastSyncedAt || source.status === "syncing" || source.status === "error"
      ? {
          id: "last-sync",
          type: source.status === "syncing" ? "sync_running" : source.status === "error" ? "sync_failed" : "sync_completed",
          status: (source.status === "syncing" ? "running" : source.status === "error" ? "error" : "success") as "success" | "error" | "running",
          description:
            source.status === "syncing"
              ? "Sync in progress"
              : source.status === "error"
              ? `Last sync failed: ${source.errorMessage || "Unknown error"}`
              : `Last sync finished. ${source.itemsIndexed} items indexed in total.`,
          // lastSyncedAt is when the previous sync finished, so it is not the start time of a running sync.
          timestamp: source.status === "syncing" ? null : source.lastSyncedAt?.toISOString() ?? null,
          itemsIndexed: source.itemsIndexed,
        }
      : null;

    const history = lastSync ? [lastSync] : [];

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
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/sources/[sourceId]/history error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
