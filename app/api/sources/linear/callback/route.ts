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

    const existing = await prisma.source.findFirst({
      where: { workspaceId, type: "linear" }
    });

    if (existing) {
      return NextResponse.redirect(`${dashboardUrl}?error=already_connected`);
    }

    await prisma.source.create({
      data: {
        workspaceId,
        userId,
        type: "linear",
        name: "Linear Workspace",
        status: "synced",
        itemsIndexed: 450, // Mock items
        lastSyncedAt: new Date(),
        accessToken: "mock-linear-access-token",
        config: { permissions: "everyone" }
      },
    });

    return NextResponse.redirect(`${dashboardUrl}?success=linear_connected`);
  } catch (err) {
    console.error("[Linear Callback Error]", err);
    return NextResponse.redirect(`${dashboardUrl}?error=linear_auth_failed`);
  }
}
