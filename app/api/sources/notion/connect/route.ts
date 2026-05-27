/**
 * GET /api/sources/notion/connect
 * Redirects the user to Notion's OAuth consent page.
 * After the user approves, Notion redirects back to /api/sources/notion/callback
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const workspaceId = searchParams.get("workspaceId") ?? "default";
  const userId = searchParams.get("userId") ?? "default";

  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Notion OAuth not configured. Check NOTION_CLIENT_ID and NOTION_REDIRECT_URI." },
      { status: 500 }
    );
  }

  // Base64-encode state so workspaceId/userId survive the OAuth round-trip
  const state = Buffer.from(JSON.stringify({ workspaceId, userId })).toString("base64");

  const authUrl = new URL("https://api.notion.com/v1/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("owner", "user");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
