import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const { sourceId } = await params;

  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    select: { id: true, workspaceId: true, type: true, status: true },
  });

  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  if (source.status === "syncing") {
    return NextResponse.json(
      { error: "Sync already in progress" },
      { status: 409 }
    );
  }

  // 1. Mark status as syncing in DB first so the UI reflects active ingestion
  await prisma.source.update({
    where: { id: sourceId },
    data: { status: "syncing", errorMessage: null },
  });

  // 2. Trigger direct background sync dynamically (returns immediately to client)
  if (source.type === "google_drive") {
    // Dynamic import to prevent next build bundler failures with heavy libraries
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

  return NextResponse.json({ message: "Sync started", sourceId });
}
