import { NextRequest, NextResponse } from "next/server";
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

  if (error) {
    console.warn("[Gmail Callback] User denied access:", error);
    return NextResponse.redirect(`${origin}/dashboard/sources?error=access_denied`);
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(`${origin}/dashboard/sources?error=missing_params`);
  }

  let workspaceId: string;
  let userId: string;
  try {
    const payload = await decrypt(stateRaw);
    workspaceId = payload.workspaceId as string;
    userId = payload.userId as string;
  } catch {
    return NextResponse.redirect(`${origin}/dashboard/sources?error=invalid_state`);
  }

  const clientId = process.env.GMAIL_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/sources/gmail/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/dashboard/sources?error=gmail_not_configured`);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  let tokens;
  try {
    const tokenResponse = await oauth2Client.getToken(code);
    tokens = tokenResponse.tokens;
  } catch (err) {
    console.error("[Gmail Callback] Token exchange failed:", err);
    return NextResponse.redirect(`${origin}/dashboard/sources?error=token_exchange_failed`);
  }

  if (!tokens.refresh_token) {
    console.error("[Gmail Callback] No refresh token received.");
    return NextResponse.redirect(`${origin}/dashboard/sources?error=no_refresh_token`);
  }

  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    include: { workspace: true },
  });

  if (!userExists || userExists.workspaceId !== workspaceId) {
    return NextResponse.redirect(`${origin}/dashboard/sources?error=user_not_found`);
  }

  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  let email = "Gmail";
  let historyId: string | null = null;
  try {
    const profile = await gmail.users.getProfile({ userId: "me" });
    email = profile.data.emailAddress ?? email;
    historyId = profile.data.historyId ?? null;
  } catch (err) {
    console.warn("[Gmail Callback] Could not fetch Gmail profile:", err);
  }

  const source = await prisma.source.create({
    data: {
      workspaceId,
      userId,
      type: "gmail",
      name: `${email} (Gmail)`,
      status: "idle",
      accessToken: tokens.access_token ? encrypt(tokens.access_token) : null,
      refreshToken: encrypt(tokens.refresh_token),
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      config: {
        email,
        historyId,
        query: "newer_than:180d -category:promotions -category:social",
      },
    },
  });

  import("@/modules/sources/connectors/gmail")
    .then(({ syncGmail }) => {
      syncGmail(source.id).catch((err) => {
        console.error(`[Gmail Callback] Background sync failed for ${source.id}:`, err);
      });
    })
    .catch((err) => {
      console.error("[Gmail Callback] Failed to load Gmail sync module:", err);
    });

  console.log(`[Gmail Callback] Source created: ${source.id} - sync triggered`);

  return NextResponse.redirect(
    `${origin}/dashboard/sources?connected=gmail&sourceId=${source.id}`
  );
}
