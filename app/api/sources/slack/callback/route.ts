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

    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(`${dashboardUrl}?error=missing_code`);
    }

    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      console.error("[Slack Callback] Missing SLACK_CLIENT_ID or SLACK_CLIENT_SECRET");
      return NextResponse.redirect(`${dashboardUrl}?error=server_configuration`);
    }

    // Exchange code for access token
    const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${origin}/api/sources/slack/callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.ok) {
      console.error("[Slack Callback] Token exchange failed:", tokenData);
      return NextResponse.redirect(`${dashboardUrl}?error=slack_auth_failed`);
    }

    const { access_token, team } = tokenData;

    // Check if Slack source already exists to determine update vs create
    const existing = await prisma.source.findFirst({
      where: { workspaceId, type: "slack" }
    });

    const { encrypt } = await import("@/lib/crypto");
    const encryptedToken = encrypt(access_token);

    if (existing) {
      await prisma.source.update({
        where: { id: existing.id },
        data: {
          accessToken: encryptedToken,
          name: team?.name || "Slack Workspace",
          status: "synced",
          lastSyncedAt: new Date(),
          errorMessage: null,
          config: { teamId: team?.id }
        }
      });
    } else {
      await prisma.source.create({
        data: {
          workspaceId,
          userId,
          type: "slack",
          name: team?.name || "Slack Workspace",
          status: "synced",
          itemsIndexed: 0,
          lastSyncedAt: new Date(),
          accessToken: encryptedToken,
          config: { teamId: team?.id }
        },
      });
    }

    return NextResponse.redirect(`${dashboardUrl}?success=slack_connected`);
  } catch (err) {
    console.error("[Slack Callback Error]", err);
    return NextResponse.redirect(`${dashboardUrl}?error=slack_auth_failed`);
  }
}
