/**
 * GET /api/sources/[sourceId]/folders
 * Fetches the list of folders from the connected Google Drive source to let the user select a specific folder.
 * It only ever returns real Drive folders. When Drive cannot be reached it returns an error, never sample data.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { google } from "googleapis";
import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  let user;
  try {
    user = await requirePermission(Permissions.SOURCES_READ);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("[Get Folders] Auth error:", error);
    return errorResponse("Internal Server Error", 500);
  }

  const { sourceId } = await params;

  // The source must belong to the caller's workspace. Otherwise act as if it does not exist.
  const source = await prisma.source.findFirst({
    where: { id: sourceId, workspaceId: user.workspaceId },
  });

  if (!source) {
    return errorResponse("Source not found", 404);
  }

  if (source.type !== "google_drive") {
    return errorResponse("Folder selection is only supported for Google Drive sources", 400);
  }

  // Without a refresh token we cannot read Drive. The user must connect again.
  if (!source.refreshToken) {
    return errorResponse("Reconnect Google Drive to load your folders", 409);
  }

  try {
    // Build oauth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: decrypt(source.refreshToken),
      access_token: source.accessToken ? decrypt(source.accessToken) : undefined,
    });

    const driveClient = google.drive({ version: "v3", auth: oauth2Client });

    // Fetch folders (limit to 500 for UI ease)
    const response = await driveClient.files.list({
      pageSize: 500,
      q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id, name, parents)",
    });

    // An empty list is a real answer: this Drive has no folders.
    return successResponse({ folders: response.data.files ?? [] });
  } catch (err) {
    console.error("[Get Folders] Failed to fetch Google Drive folders:", err);
    return errorResponse("Could not load folders from Google Drive. Try again, or reconnect Google Drive.", 502);
  }
}
