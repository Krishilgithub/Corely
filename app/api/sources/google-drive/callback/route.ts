/**
 * GET /api/sources/google-drive/callback
 * Google redirects here after the user completes the OAuth consent flow.
 * We exchange the code for tokens, save the source to DB, and enqueue a sync job.
 */

import { NextResponse , NextRequest} from 'next/server';
import { google } from "googleapis";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { decrypt } from "@/lib/auth-server";

export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  // ── User denied access ────────────────────────────────────────
  if (error) {
    console.warn("[OAuth Callback] User denied access:", error);
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
    // (Optional: We could store the nonce in Redis before redirect and verify here)
  } catch {
    return NextResponse.redirect(
      `${origin}/dashboard/sources?error=invalid_state`
    );
  }

  // ── Exchange code for tokens ──────────────────────────────────
  const redirectUri = `${origin}/api/sources/google-drive/callback`;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  let tokens;
  try {
    const tokenResponse = await oauth2Client.getToken(code);
    tokens = tokenResponse.tokens;
  } catch (error) {
    console.error("[OAuth Callback] Token exchange failed:", error);
    return NextResponse.redirect(
      `${origin}/dashboard/sources?error=token_exchange_failed`
    );
  }

  if (!tokens.refresh_token) {
    // This can happen if the user has previously authorized the app.
    // Revoke and re-auth: https://myaccount.google.com/permissions
    console.error("[OAuth Callback] No refresh token received.");
    return NextResponse.redirect(
      `${origin}/dashboard/sources?error=no_refresh_token`
    );
  }

  // ── Get user/drive info for display name ─────────────────────
  oauth2Client.setCredentials(tokens);
  const driveClient = google.drive({ version: "v3", auth: oauth2Client });

  let driveName = "Google Drive";
  let driveEmail = "";
  try {
    const aboutRes = await driveClient.about.get({
      fields: "user(displayName,emailAddress)",
    });
    const user = aboutRes.data.user;
    driveName = `${user?.displayName ?? "My"}'s Drive`;
    driveEmail = user?.emailAddress ?? "";
  } catch (err) {
    console.warn("[OAuth Callback] Could not fetch Drive info:", err);
  }

  // ── Verify workspace & user exist ─────────────────────────────
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    include: { workspace: true }
  });

  if (!userExists || userExists.workspaceId !== workspaceId) {
    return NextResponse.redirect(
      `${origin}/dashboard/sources?error=user_not_found`
    );
  }

  // ── Save source with encrypted tokens ────────────────────────
  const source = await prisma.source.create({
    data: {
      workspaceId,
      userId,
      type: "google_drive",
      name: driveName,
      status: "idle",
      accessToken: tokens.access_token ? encrypt(tokens.access_token) : null,
      refreshToken: encrypt(tokens.refresh_token),
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      config: { email: driveEmail },
    },
  });

  console.log(`[OAuth Callback] ✅ Source created: ${source.id} — pending configuration`);

  return NextResponse.redirect(
    `${origin}/dashboard/sources?connected=google_drive&sourceId=${source.id}`
  );
}
