/**
 * GET  /api/sources          — list all sources for a workspace
 * DELETE /api/sources/[id]   — disconnect a source
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId query param required" },
      { status: 400 }
    );
  }

  const sources = await prisma.source.findMany({
    where: { workspaceId },
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

  return NextResponse.json({ sources });
}
