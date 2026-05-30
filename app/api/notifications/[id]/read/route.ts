import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { workspace } = await auth();

    // Verify ownership
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (notif.workspaceId !== workspace.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update notification";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
