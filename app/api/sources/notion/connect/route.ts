import { NextRequest, NextResponse } from "next/server";
import { auth, encrypt } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, workspace } = await auth();

    const clientId = process.env.NOTION_CLIENT_ID;
    const protocol = request.headers.get("x-forwarded-proto") || (request.nextUrl.protocol === "http:" ? "http" : "https");
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
    const origin = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    const redirectUri = `${origin}/api/sources/notion/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: "Notion OAuth not configured. Check NOTION_CLIENT_ID." },
        { status: 500 }
      );
    }

    const nonce = Math.random().toString(36).substring(2);
    const payload = await encrypt({
      workspaceId: workspace.id,
      userId: user.id,
      nonce
    });
    
    // Notion expects state to be a string, we can just pass the JWT string
    const state = payload;

    const authUrl = new URL("https://api.notion.com/v1/oauth/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("owner", "user");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);

    return NextResponse.redirect(authUrl.toString());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
