/**
 * GET  /api/sources          — list all sources for a workspace
 * DELETE /api/sources/[id]   — disconnect a source
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requirePermission(Permissions.SOURCES_READ);

    const sources = await prisma.source.findMany({
      where: { workspaceId: user.workspaceId },
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
    orderBy: { createdAt: "desc" },
  });

  return successResponse({ sources });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/sources error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
