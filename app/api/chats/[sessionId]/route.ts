/**
 * GET /api/chats/[sessionId]
 * DELETE /api/chats/[sessionId]
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (err) {
    const msg = (err as Error)?.message || "Failed to fetch conversation details";
    console.error(`[GET /api/chats/${sessionId}] Error:`, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  try {
    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ message: "Conversation deleted successfully" });
  } catch (err) {
    const msg = (err as Error)?.message || "Failed to delete conversation";
    console.error(`[DELETE /api/chats/${sessionId}] Error:`, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
