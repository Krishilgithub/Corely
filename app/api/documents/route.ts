/**
 * GET  /api/documents?workspaceId=[workspaceId]  — list all synced documents for a workspace
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

  try {
    const documents = await prisma.document.findMany({
      where: { workspaceId },
      include: {
        source: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (e) {
    const error = e as Error;
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
