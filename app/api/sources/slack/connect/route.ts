import { NextRequest, NextResponse } from "next/server";
import { auth, encrypt } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, workspace } = await auth();
    
    // Simulate OAuth flow by encrypting state and redirecting to callback
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUri = `${origin}/api/sources/slack/callback`;
    
    const nonce = Math.random().toString(36).substring(2);
    const payload = await encrypt({
      workspaceId: workspace.id,
      userId: user.id,
      nonce
    });
    
    const state = Buffer.from(payload).toString("base64url");
    
    const clientId = process.env.SLACK_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: "Slack Client ID not configured" }, { status: 500 });
    }

    const authUrl = new URL("https://slack.com/oauth/v2/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("scope", "channels:history,channels:read,users:read,groups:read");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    
    return NextResponse.redirect(authUrl.toString());
  } catch (err) {
    console.error("[Slack Connect Error]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
