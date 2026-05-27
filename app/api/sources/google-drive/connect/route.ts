import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth, encrypt } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/documents.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

export async function GET() {
  try {
    const { user, workspace } = await auth();

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Use JWT encryption to create a secure, tamper-proof state with a CSRF nonce
    const nonce = Math.random().toString(36).substring(2);
    const secureState = await encrypt({
      workspaceId: workspace.id,
      userId: user.id,
      nonce
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
