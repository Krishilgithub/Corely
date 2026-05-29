/**
 * GET /api/sources/github/callback
 * GitHub redirects here after the user completes the OAuth consent flow.
 * We exchange the authorization code for a permanent access token, save the
 * source to the database, then trigger a background sync.
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { decrypt } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const protocol = request.headers.get("x-forwarded-proto") || (request.nextUrl.protocol === "http:" ? "http" : "https");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
  const origin = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  // ── User denied access ────────────────────────────────────────
  if (error) {
    console.warn("[GitHub Callback] User denied access:", error);
    return NextResponse.redirect(`${origin}/dashboard/sources?error=access_denied`);
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(`${origin}/dashboard/sources?error=missing_params`);
  }

  // ── Parse state ───────────────────────────────────────────────
  let workspaceId: string;
  let userId: string;
  try {
    // We base64url encoded the JWT string in the connect route
    const jwtString = Buffer.from(stateRaw, "base64url").toString("utf-8");
    const payload = await decrypt(jwtString);
    workspaceId = payload.workspaceId as string;
    userId = payload.userId as string;
  } catch (err) {
    console.error("[GitHub Callback] State decryption failed", err);
    return NextResponse.redirect(`${origin}/dashboard/sources?error=invalid_state`);
  }

  // ── Exchange code for access token ────────────────────────────
  const clientId = process.env.GITHUB_CLIENT_ID!;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET!;
  const redirectUri = `${origin}/api/sources/github/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/dashboard/sources?error=github_not_configured`);
  }

  let accessToken = "";
  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed (${tokenResponse.status})`);
    }

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw new Error(`GitHub returned error: ${tokenData.error} - ${tokenData.error_description}`);
    }

    accessToken = tokenData.access_token;
  } catch (error) {
    console.error("[GitHub Callback] Token exchange failed:", error);
    return NextResponse.redirect(`${origin}/dashboard/sources?error=token_exchange_failed`);
  }

  if (!accessToken) {
    console.error("[GitHub Callback] No access token received.");
    return NextResponse.redirect(`${origin}/dashboard/sources?error=no_access_token`);
  }

  // ── Get GitHub user info for display name ─────────────────────
  let login = "GitHub User";
  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Corely-App",
      },
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      login = userData.login || login;
    }
  } catch (err) {
    console.warn("[GitHub Callback] Could not fetch GitHub profile:", err);
  }

  // ── Verify workspace & user exist ────────────────────────────
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    include: { workspace: true }
  });

  if (!userExists || userExists.workspaceId !== workspaceId) {
    return NextResponse.redirect(`${origin}/dashboard/sources?error=user_not_found`);
  }

  // ── Save source with encrypted access token ───────────────────
  const sourceName = `${login} (GitHub)`;

  const source = await prisma.source.create({
    data: {
      workspaceId,
      userId,
      type: "github",
      name: sourceName,
      status: "idle",
      accessToken: encrypt(accessToken),
      refreshToken: null,
      config: {
        login,
        selectedRepos: [], // By default empty, meaning sync logic can either fetch all or wait for config
        lastSyncedAt: null,
        mode: "oauth",
      },
    },
  });

  console.log(`[GitHub Callback] ✅ Source created: ${source.id} — awaiting repo selection`);

  return NextResponse.redirect(`${origin}/dashboard/sources?connected=github&sourceId=${source.id}`);
}
