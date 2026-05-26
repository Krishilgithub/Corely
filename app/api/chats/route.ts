/**
 * GET /api/chats?workspaceId=...
 * POST /api/chats
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// List all chat sessions
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
  }

  try {
    const sessions = await prisma.chatSession.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ sessions });
  } catch (err) {
    const msg = (err as Error)?.message || "Failed to fetch conversations";
    console.error("[GET /api/chats] Error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Create a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, title } = body as { workspaceId: string; title?: string };

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    // Ensure default workspace exists
    await prisma.workspace.upsert({
      where: { id: workspaceId },
      create: {
        id: workspaceId,
        name: "My Workspace",
        slug: `workspace-${workspaceId.slice(0, 8)}`,
      },
      update: {},
    });

    const session = await prisma.chatSession.create({
      data: {
        workspaceId,
        title: title || "New Conversation",
      },
    });

    return NextResponse.json(session);
  } catch (err) {
    const msg = (err as Error)?.message || "Failed to create conversation";
    console.error("[POST /api/chats] Error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
