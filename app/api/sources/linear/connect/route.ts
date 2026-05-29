import { NextRequest, NextResponse } from "next/server";
import { auth, encrypt } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, workspace } = await auth();
    
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUri = `${origin}/api/sources/linear/callback`;
    
    const nonce = Math.random().toString(36).substring(2);
    const payload = await encrypt({
      workspaceId: workspace.id,
      userId: user.id,
      nonce
    });
    
    const state = Buffer.from(payload).toString("base64url");
    
    const clientId = process.env.LINEAR_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: "Linear Client ID not configured" }, { status: 500 });
    }

    const authUrl = new URL("https://linear.app/oauth/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "read");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("prompt", "consent");
    
    return NextResponse.redirect(authUrl.toString());
  } catch (err) {
    console.error("[Linear Connect Error]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
