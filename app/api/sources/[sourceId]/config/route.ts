/**
 * POST /api/sources/[sourceId]/config
 * Saves folder selection config (folderId, folderName) and resets status to idle.
 */

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const { sourceId } = await params;

  try {
    const body = await request.json();
    const { folderIds, folderNames } = body as { folderIds?: string[]; folderNames?: string[] };

    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const currentConfig = (source.config as Record<string, unknown>) || {};
    const updatedConfig: Record<string, unknown> = {
      ...currentConfig,
      folderIds: folderIds || undefined,
      folderNames: folderNames || undefined,
    };

    // If folderIds is null/empty, clear it from configuration to sync entire drive
    if (!folderIds || folderIds.length === 0) {
      delete updatedConfig.folderIds;
      delete updatedConfig.folderNames;
      // also clear legacy fields just in case
      delete updatedConfig.folderId;
      delete updatedConfig.folderName;
    }

    const updatedSource = await prisma.source.update({
      where: { id: sourceId },
      data: {
        config: updatedConfig as Prisma.InputJsonObject,
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
