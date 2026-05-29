/**
 * GET /api/sources/notion/callback
 * Notion redirects here after the user completes the OAuth consent flow.
 * We exchange the authorization code for a permanent access token, save the
 * source to the database, then trigger a background sync.
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { decrypt } from "@/lib/auth-server";

export const dynamic = "force-dynamic";


interface NotionTokenResponse {
  access_token: string;
  bot_id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_icon: string | null;
  owner: {
    type: string;
    user?: {
      name?: string;
      person?: { email?: string };
    };
  };
  token_type: string;
}

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
    console.warn("[Notion Callback] User denied access:", error);
    return NextResponse.redirect(
      `${origin}/dashboard/sources?error=access_denied`
    );
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(
      `${origin}/dashboard/sources?error=missing_params`
    );
  }

  // ── Parse state ───────────────────────────────────────────────
  let workspaceId: string;
  let userId: string;
  try {
    const payload = await decrypt(stateRaw);
    workspaceId = payload.workspaceId as string;
    userId = payload.userId as string;
  } catch {
    return NextResponse.redirect(
      `${origin}/dashboard/sources?error=invalid_state`
    );
  }

  // ── Exchange code for access token ────────────────────────────
  // Notion uses HTTP Basic Auth: Base64("clientId:clientSecret")
  const clientId = process.env.NOTION_CLIENT_ID!;
  const clientSecret = process.env.NOTION_CLIENT_SECRET!;
  const redirectUri = `${origin}/api/sources/notion/callback`;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  let tokenData: NotionTokenResponse;
  try {
    const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      throw new Error(`Token exchange failed (${tokenResponse.status}): ${errBody}`);
    }

    tokenData = (await tokenResponse.json()) as NotionTokenResponse;
  } catch (error) {
    console.error("[Notion Callback] Token exchange failed:", error);
    return NextResponse.redirect(
      `${origin}/dashboard/sources?error=token_exchange_failed`
    );
  }

  // ── Extract owner info ────────────────────────────────────────
  let ownerEmail = "";
  if (tokenData.owner?.type === "user" && tokenData.owner.user) {
    ownerEmail = tokenData.owner.user.person?.email ?? "";
  }

  // ── Verify workspace & user exist ────────────────────────────
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    include: { workspace: true }
  });

  if (!userExists || userExists.workspaceId !== workspaceId) {
    return NextResponse.redirect(
      `${origin}/dashboard/sources?error=user_not_found`
    );
  }

  // ── Save source with encrypted access token ───────────────────
  // Notion access tokens do NOT expire — no refresh token needed.
  const sourceName = `${tokenData.workspace_name ?? "Notion"} (Notion)`;

  const source = await prisma.source.create({
    data: {
      workspaceId,
      userId,
      type: "notion",
      name: sourceName,
      status: "idle",
      accessToken: encrypt(tokenData.access_token),
      refreshToken: null,
      config: {
        notionWorkspaceId: tokenData.workspace_id,
        workspaceName: tokenData.workspace_name,
        workspaceIcon: tokenData.workspace_icon,
        botId: tokenData.bot_id,
        ownerEmail,
      },
    },
  });

  // ── Trigger background sync immediately ───────────────────────
  import("@/modules/sources/connectors/notion")
    .then(({ syncNotion }) => {
      syncNotion(source.id).catch((err) => {
        console.error(`[Notion Callback] Background sync failed for ${source.id}:`, err);
      });
    })
    .catch((err) => {
      console.error("[Notion Callback] Failed to load Notion sync module:", err);
    });

  console.log(`[Notion Callback] ✅ Source created: ${source.id} — sync triggered`);

  return NextResponse.redirect(
    `${origin}/dashboard/sources?connected=notion&sourceId=${source.id}`
  );
}
