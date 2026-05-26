/**
 * POST /api/chats/[sessionId]/messages/[messageId]/feedback
 * Body: { feedback: 'positive' | 'negative' | null }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; messageId: string }> }
) {
  const { sessionId, messageId } = await params;

  try {
    const body = await request.json();
    const { feedback } = body as { feedback: "positive" | "negative" | null };

    // Validate feedback values
    if (feedback !== null && feedback !== "positive" && feedback !== "negative") {
      return NextResponse.json({ error: "Invalid feedback value" }, { status: 400 });
    }

    // Verify message exists in session
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        sessionId,
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found in this session" }, { status: 404 });
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { feedback },
    });

    return NextResponse.json(updatedMessage);
  } catch (err) {
    const msg = (err as Error)?.message || "Failed to update feedback";
    console.error(`[POST /api/chats/${sessionId}/messages/${messageId}/feedback] Error:`, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
