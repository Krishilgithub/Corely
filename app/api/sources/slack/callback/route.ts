import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const dashboardUrl = `${origin}/dashboard/sources`;

  try {
    const searchParams = request.nextUrl.searchParams;
    const stateParam = searchParams.get("state");

    if (!stateParam) {
      return NextResponse.redirect(`${dashboardUrl}?error=missing_state`);
    }

    const token = Buffer.from(stateParam, "base64url").toString("utf-8");
    const payload = await decrypt(token);

    if (!payload || !payload.workspaceId || !payload.userId) {
      return NextResponse.redirect(`${dashboardUrl}?error=invalid_state`);
    }

    const { workspaceId, userId } = payload as { workspaceId: string; userId: string };

    // Check if Slack source already exists
    const existing = await prisma.source.findFirst({
      where: { workspaceId, type: "slack" }
    });

    if (existing) {
      return NextResponse.redirect(`${dashboardUrl}?error=already_connected`);
    }

    // Create simulated Slack source
    await prisma.source.create({
      data: {
        workspaceId,
        userId,
        type: "slack",
        name: "Slack Workspace",
        status: "synced", // Mock as synced instantly
        itemsIndexed: 1420, // Mock some indexed items
        lastSyncedAt: new Date(),
        accessToken: "mock-slack-access-token",
        config: { permissions: "everyone" }
      },
    });

    return NextResponse.redirect(`${dashboardUrl}?success=slack_connected`);
  } catch (err) {
    console.error("[Slack Callback Error]", err);
    return NextResponse.redirect(`${dashboardUrl}?error=slack_auth_failed`);
  }
}
