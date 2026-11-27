/**
 * POST /api/chats/[sessionId]/messages/[messageId]/feedback
 * Body: { feedback: 'positive' | 'negative' | null }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; messageId: string }> }
) {
  const { sessionId, messageId } = await params;

  try {
    const { workspace } = await auth();
    const body = await request.json();
    const { feedback } = body as { feedback: "positive" | "negative" | null };

    // Validate feedback values
    if (feedback !== null && feedback !== "positive" && feedback !== "negative") {
      return NextResponse.json({ error: "Invalid feedback value" }, { status: 400 });
    }

    // Client-only ids (not saved yet) are not UUIDs, so treat them as not found.
    if (!z.string().uuid().safeParse(messageId).success || !z.string().uuid().safeParse(sessionId).success) {
      return NextResponse.json({ error: "Message not found in this session" }, { status: 404 });
    }

    // Verify message exists in a session of this workspace
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        sessionId,
        session: { workspaceId: workspace.id },
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
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "User not found")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const msg = (err as Error)?.message || "Failed to update feedback";
    console.error(`[POST /api/chats/${sessionId}/messages/${messageId}/feedback] Error:`, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
