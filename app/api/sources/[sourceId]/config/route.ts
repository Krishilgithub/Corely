/**
 * POST /api/sources/[sourceId]/config
 * Saves folder selection config (folderId, folderName) and resets status to idle.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const { sourceId } = await params;

  try {
    const body = await request.json();
    const { folderId, folderName } = body as { folderId: string | null; folderName: string | null };

    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const currentConfig = (source.config as Record<string, unknown>) || {};
    const updatedConfig = {
      ...currentConfig,
      folderId: folderId || undefined,
      folderName: folderName || undefined,
    };

    // If folderId is null/empty, clear it from configuration to sync entire drive
    if (!folderId) {
      delete updatedConfig.folderId;
      delete updatedConfig.folderName;
    }

    const updatedSource = await prisma.source.update({
      where: { id: sourceId },
      data: {
        config: updatedConfig,
        status: "idle", // Reset to idle so the user can review and manual sync with the new config
        errorMessage: null,
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        config: true,
      },
    });

    return NextResponse.json(updatedSource);
  } catch (err) {
    const errMessage = (err as Error)?.message || "Failed to save configuration";
    console.error("[Save Config] Error saving configuration:", err);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
