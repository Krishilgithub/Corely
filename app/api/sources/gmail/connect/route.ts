import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth, encrypt } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export async function GET(request: NextRequest) {
  try {
    const { user, workspace } = await auth();

    const clientId = process.env.GMAIL_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUri = `${origin}/api/sources/gmail/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error:
            "Gmail OAuth not configured. Check GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET.",
        },
        { status: 500 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const nonce = Math.random().toString(36).substring(2);
    const secureState = await encrypt({
      workspaceId: workspace.id,
      userId: user.id,
      nonce,
    });

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
      state: secureState,
    });

    return NextResponse.redirect(authUrl);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
