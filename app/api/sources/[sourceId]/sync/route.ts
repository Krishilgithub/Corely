import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  try {
    const { workspace } = await auth();
    const { sourceId } = await params;

    const source = await prisma.source.findUnique({
      where: { id: sourceId },
      select: { id: true, workspaceId: true, type: true, status: true },
    });

    if (!source || source.workspaceId !== workspace.id) {
      return errorResponse("Source not found", 404);
    }

    if (source.status === "syncing") {
      return errorResponse("Sync already in progress", 409);
    }

    // 1. Mark status as syncing in DB first so the UI reflects active ingestion
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: "syncing", errorMessage: null },
    });

    // Generate a unique sync ID for polling
    const syncJobId = `sync_${Date.now()}_${sourceId}`;

    // 2. Trigger direct background sync dynamically (returns immediately to client)
    if (source.type === "google_drive") {
      import("@/modules/sources/connectors/google-drive")
        .then(({ syncGoogleDrive }) => {
          syncGoogleDrive(source.id).catch((err) => {
            console.error(`[Manual Sync] Direct background sync failed for ${source.id}:`, err);
          });
        })
        .catch((err) => {
          console.error("[Manual Sync] Failed to dynamically load sync module:", err);
        });
    } else if (source.type === "notion") {
      import("@/modules/sources/connectors/notion")
        .then(({ syncNotion }) => {
          syncNotion(source.id).catch((err) => {
            console.error(`[Manual Sync] Direct background sync failed for Notion ${source.id}:`, err);
          });
        })
        .catch((err) => {
          console.error("[Manual Sync] Failed to dynamically load Notion sync module:", err);
        });
    } else {
      console.warn(`[Manual Sync] ⚠️ Ingestion sync for type "${source.type}" is not supported yet.`);
      await prisma.source.update({
        where: { id: sourceId },
        data: { status: "error", errorMessage: `Unsupported source type: ${source.type}` },
      });
    }

    return successResponse({ message: "Sync started", sourceId, jobId: syncJobId });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/sources/sync error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
