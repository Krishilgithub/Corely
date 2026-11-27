/**
 * POST /api/sources/[sourceId]/config
 * Saves folder selection config (folderId, folderName) and resets status to idle.
 */

import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  try {
    // Only signed-in users who can change sources may change the config.
    const user = await requirePermission(Permissions.SOURCES_WRITE);
    const { sourceId } = await params;

    const body = await request.json();
    const { folderIds, folderNames, permissions, selectedRepos } = body as { folderIds?: string[]; folderNames?: string[]; permissions?: string; selectedRepos?: string[] };

    // The source must belong to the caller's workspace. Otherwise act as if it does not exist.
    const source = await prisma.source.findFirst({
      where: { id: sourceId, workspaceId: user.workspaceId },
    });

    if (!source) {
      return errorResponse("Source not found", 404);
    }

    const currentConfig = (source.config as Record<string, unknown>) || {};
    const updatedConfig: Record<string, unknown> = {
      ...currentConfig,
      ...(folderIds !== undefined && { folderIds }),
      ...(folderNames !== undefined && { folderNames }),
      ...(permissions !== undefined && { permissions }),
      ...(selectedRepos !== undefined && { selectedRepos }),
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

    return successResponse(updatedSource);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("[Save Config] Error saving configuration:", error);
    return errorResponse("Failed to save configuration", 500);
  }
}
