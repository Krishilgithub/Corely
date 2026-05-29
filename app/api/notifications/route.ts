import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const { user, workspace } = await auth();

    // Fetch notifications for the workspace that are either broadcast (userId null) or specifically for this user
    const notifications = await prisma.notification.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { userId: user.id },
          { userId: null }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 20, // Max 20 recent notifications
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("[Notifications API Error]:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch notifications";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(_request: NextRequest) {
  try {
    const { user, workspace } = await auth();

    // Mark all as read for this user
    await prisma.notification.updateMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { userId: user.id },
          { userId: null }
        ],
        isRead: false
      },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update notifications";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
