/**
 * GET /api/sources/[sourceId]/status
 * Returns the current sync status of a source.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  try {
    const user = await requirePermission(Permissions.SOURCES_READ);
    const { sourceId } = await params;

    // The source must belong to the caller's workspace. Otherwise act as if it does not exist.
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
        createdAt: true,
        config: true,
      },
    });

    if (!source) {
      return errorResponse("Source not found", 404);
    }

    return successResponse(source);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/sources/[sourceId]/status error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
