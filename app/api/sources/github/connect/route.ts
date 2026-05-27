import { NextRequest, NextResponse } from "next/server";
import { auth, encrypt } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, workspace } = await auth();

    const clientId = process.env.GITHUB_CLIENT_ID;
    
    // We dynamically compute the redirect URI so that it works seamlessly on both
    // localhost and the production domain.
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUri = `${origin}/api/sources/github/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: "GitHub OAuth not configured. Check GITHUB_CLIENT_ID." },
        { status: 500 }
      );
    }

    const nonce = Math.random().toString(36).substring(2);
    const payload = await encrypt({
      workspaceId: workspace.id,
      userId: user.id,
      nonce
    });
    
    // Convert JWT string to base64url so it's safe to pass in the URL state parameter
    const state = Buffer.from(payload).toString("base64url");

    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.set("client_id", clientId);
    // Request scopes to read user profile and repository content
    authUrl.searchParams.set("scope", "read:user repo read:org");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);

    return NextResponse.redirect(authUrl.toString());
  } catch (err) {
    console.error("[GitHub Connect Error]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
