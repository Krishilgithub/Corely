/**
 * GET /api/sources/google-drive/callback
 * Google redirects here after the user completes the OAuth consent flow.
 * We exchange the code for tokens, save the source to DB, and enqueue a sync job.
 */

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  // ── User denied access ────────────────────────────────────────
  if (error) {
    console.warn("[OAuth Callback] User denied access:", error);
    return NextResponse.redirect(
      `${BASE_URL}/dashboard/sources?error=access_denied`
    );
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(
      `${BASE_URL}/dashboard/sources?error=missing_params`
    );
  }

  // ── Parse state ───────────────────────────────────────────────
  let workspaceId: string;
  let userId: string;
  try {
    ({ workspaceId, userId } = JSON.parse(stateRaw));
  } catch {
    return NextResponse.redirect(
      `${BASE_URL}/dashboard/sources?error=invalid_state`
    );
  }

  // ── Exchange code for tokens ──────────────────────────────────
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  let tokens;
  try {
    const tokenResponse = await oauth2Client.getToken(code);
    tokens = tokenResponse.tokens;
  } catch (err) {
    console.error("[OAuth Callback] Token exchange failed:", err);
    return NextResponse.redirect(
      `${BASE_URL}/dashboard/sources?error=token_exchange_failed`
    );
  }

  if (!tokens.refresh_token) {
    // This can happen if the user has previously authorized the app.
    // Revoke and re-auth: https://myaccount.google.com/permissions
    console.error("[OAuth Callback] No refresh token received.");
    return NextResponse.redirect(
      `${BASE_URL}/dashboard/sources?error=no_refresh_token`
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

  // ── Ensure workspace & user exist (create dev defaults if needed) ─
  // In production, these come from your auth session.
  // For MVP, we upsert a dev workspace so you can test without full auth.
  await prisma.workspace.upsert({
    where: { id: workspaceId },
    create: {
      id: workspaceId,
      name: "My Workspace",
      slug: `workspace-${workspaceId.slice(0, 8)}`,
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      workspaceId,
      email: driveEmail || `user-${userId.slice(0, 8)}@corely.local`,
      name: "Workspace Admin",
      role: "admin",
    },
    update: {},
  });

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

  // ── Trigger direct background sync dynamically (returns redirect immediately) ─
  import("@/modules/sources/connectors/google-drive")
    .then(({ syncGoogleDrive }) => {
      syncGoogleDrive(source.id).catch((err) => {
        console.error(`[OAuth Callback] Background sync failed for ${source.id}:`, err);
      });
    })
    .catch((err) => {
      console.error("[OAuth Callback] Failed to dynamically load sync module:", err);
    });

  console.log(`[OAuth Callback] ✅ Source created: ${source.id} — sync triggered in background`);

  return NextResponse.redirect(
    `${BASE_URL}/dashboard/sources?connected=google_drive&sourceId=${source.id}`
  );
}
