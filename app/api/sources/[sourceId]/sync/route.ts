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
      select: { id: true, workspaceId: true, type: true, status: true, updatedAt: true },
    });

    if (!source || source.workspaceId !== workspace.id) {
      return errorResponse("Source not found", 404);
    }

    // A sync that has not finished within 15 minutes has died (for example the
    // server restarted, or the connector failed before it could record an
    // error). Let the user start a new one instead of blocking them forever.
    const STALE_SYNC_MS = 15 * 60 * 1000;
    const stuck = Date.now() - source.updatedAt.getTime() > STALE_SYNC_MS;
    if (source.status === "syncing" && !stuck) {
      return errorResponse("Sync already in progress", 409);
    }

    // 1. Mark status as syncing in DB first so the UI reflects active ingestion
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: "syncing", errorMessage: null },
    });

    // Generate a unique sync ID for polling
    const syncJobId = `sync_${Date.now()}_${sourceId}`;

    // After a sync, re-check which documents belong to which project.
    const afterSync = () =>
      import("@/lib/project-matching")
        .then(async ({ refreshWorkspaceProjects }) => {
          await refreshWorkspaceProjects(source.workspaceId);
          // Then read new or changed project documents for decisions, risks and milestones.
          const { extractWorkspaceProjectMemory } = await import("@/lib/project-memory");
          await extractWorkspaceProjectMemory(source.workspaceId);
        })
        .catch(err => console.error("[Projects] Tag refresh after sync failed:", err));

    // 2. Trigger direct background sync dynamically (returns immediately to client)
    if (source.type === "google_drive") {
      import("@/modules/sources/connectors/google-drive")
        .then(({ syncGoogleDrive }) => {
          syncGoogleDrive(source.id).then(afterSync).catch((err) => {
            console.error(`[Manual Sync] Direct background sync failed for ${source.id}:`, err);
          });
        })
        .catch((err) => {
          console.error("[Manual Sync] Failed to dynamically load sync module:", err);
        });
    } else if (source.type === "notion") {
      import("@/modules/sources/connectors/notion")
        .then(({ syncNotion }) => {
          syncNotion(source.id).then(afterSync).catch((err) => {
            console.error(`[Manual Sync] Direct background sync failed for Notion ${source.id}:`, err);
          });
        })
        .catch((err) => {
          console.error("[Manual Sync] Failed to dynamically load Notion sync module:", err);
        });
    } else if (source.type === "gmail") {
      import("@/modules/sources/connectors/gmail")
        .then(({ syncGmail }) => {
          syncGmail(source.id).then(afterSync).catch((err) => {
            console.error(`[Manual Sync] Direct background sync failed for Gmail ${source.id}:`, err);
          });
        })
        .catch((err) => {
          console.error("[Manual Sync] Failed to dynamically load Gmail sync module:", err);
        });
    } else if (source.type === "github") {
      import("@/modules/sources/connectors/github")
        .then(({ syncGitHub }) => {
          syncGitHub(source.id).then(afterSync).catch((err) => {
            console.error(`[Manual Sync] Direct background sync failed for GitHub ${source.id}:`, err);
          });
        })
        .catch((err) => {
          console.error("[Manual Sync] Failed to dynamically load GitHub sync module:", err);
        });
    } else if (source.type === "slack") {
      import("@/modules/sources/connectors/slack")
        .then(({ syncSlack }) => {
          syncSlack(source.id).then(afterSync).catch((err) => {
            console.error(`[Manual Sync] Direct background sync failed for Slack ${source.id}:`, err);
          });
        })
        .catch((err) => {
          console.error("[Manual Sync] Failed to dynamically load Slack sync module:", err);
        });
    } else if (source.type === "linear") {
      import("@/modules/sources/connectors/linear")
        .then(({ syncLinear }) => {
          syncLinear(source.id).then(afterSync).catch((err) => {
            console.error(`[Manual Sync] Direct background sync failed for Linear ${source.id}:`, err);
          });
        })
        .catch((err) => {
          console.error("[Manual Sync] Failed to dynamically load Linear sync module:", err);
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
