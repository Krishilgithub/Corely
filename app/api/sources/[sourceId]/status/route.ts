/**
 * GET /api/sources/[sourceId]/status
 * Returns the current sync status of a source.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const { sourceId } = await params;

  const source = await prisma.source.findUnique({
    where: { id: sourceId },
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
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  return NextResponse.json(source);
}
