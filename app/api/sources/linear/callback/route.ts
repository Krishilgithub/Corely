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

    const clientId = process.env.LINEAR_CLIENT_ID;
    const clientSecret = process.env.LINEAR_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      console.error("[Linear Callback] Missing LINEAR_CLIENT_ID or LINEAR_CLIENT_SECRET");
      return NextResponse.redirect(`${dashboardUrl}?error=server_configuration`);
    }

    // Exchange code for access token
    const tokenRes = await fetch("https://api.linear.app/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${origin}/api/sources/linear/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[Linear Callback] Token exchange failed:", tokenData);
      return NextResponse.redirect(`${dashboardUrl}?error=linear_auth_failed`);
    }

    const { access_token } = tokenData;

    // Fetch organization info to set the source name
    const orgRes = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        query: `query { organization { name } }`,
      }),
    });

    const orgData = await orgRes.json();
    const orgName = orgData?.data?.organization?.name || "Linear Workspace";

    // Check if Linear source already exists
    const existing = await prisma.source.findFirst({
      where: { workspaceId, type: "linear" }
    });

    const { encrypt } = await import("@/lib/crypto");
    const encryptedToken = encrypt(access_token);

    if (existing) {
      await prisma.source.update({
        where: { id: existing.id },
        data: {
          accessToken: encryptedToken,
          name: orgName,
          status: "synced",
          lastSyncedAt: new Date(),
          errorMessage: null,
        }
      });
    } else {
      await prisma.source.create({
        data: {
          workspaceId,
          userId,
          type: "linear",
          name: orgName,
          status: "synced",
          itemsIndexed: 0,
          lastSyncedAt: new Date(),
          accessToken: encryptedToken,
        },
      });
    }

    return NextResponse.redirect(`${dashboardUrl}?success=linear_connected`);
  } catch (err) {
    console.error("[Linear Callback Error]", err);
    return NextResponse.redirect(`${dashboardUrl}?error=linear_auth_failed`);
  }
}
