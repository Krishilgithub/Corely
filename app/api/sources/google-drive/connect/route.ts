/**
 * GET /api/sources/google-drive/connect
 * Redirects the user to Google's OAuth consent page.
 * After the user approves, Google redirects back to /api/sources/google-drive/callback
 */

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export const dynamic = "force-dynamic";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/documents.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

export async function GET(request: NextRequest) {
  // In a real app, get workspaceId + userId from the user's session
  // For MVP, we use query params passed from the UI
  const { searchParams } = request.nextUrl;
  const workspaceId = searchParams.get("workspaceId") ?? "default";
  const userId = searchParams.get("userId") ?? "default";

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",  // Ensures we get a refresh_token
    prompt: "consent",        // Forces the consent screen to always appear (needed for refresh_token)
    scope: SCOPES,
    state: JSON.stringify({ workspaceId, userId }),
  });

  return NextResponse.redirect(authUrl);
}
