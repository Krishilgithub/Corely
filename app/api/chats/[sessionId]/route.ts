/**
 * GET /api/chats/[sessionId]
 * DELETE /api/chats/[sessionId]
 *
 * Both only work on sessions in the signed-in user's workspace.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Session ids are UUIDs. Anything else (for example a broken shared link) is "not found".
const isUuid = (id: string) => z.string().uuid().safeParse(id).success;

function authError(err: unknown) {
  if (err instanceof Error && (err.message === "Unauthorized" || err.message === "User not found")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  try {
    const { workspace } = await auth();
    if (!isUuid(sessionId)) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, workspaceId: workspace.id },
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
    const unauthorized = authError(err);
    if (unauthorized) return unauthorized;
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
    const { workspace } = await auth();
    if (!isUuid(sessionId)) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // deleteMany with the workspace filter so a session from another workspace is never touched.
    const deleted = await prisma.chatSession.deleteMany({
      where: { id: sessionId, workspaceId: workspace.id },
    });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Conversation deleted successfully" });
  } catch (err) {
    const unauthorized = authError(err);
    if (unauthorized) return unauthorized;
    const msg = (err as Error)?.message || "Failed to delete conversation";
    console.error(`[DELETE /api/chats/${sessionId}] Error:`, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
