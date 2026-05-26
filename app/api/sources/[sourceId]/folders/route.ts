/**
 * GET /api/sources/[sourceId]/folders
 * Fetches the list of folders from the connected Google Drive source to let the user select a specific folder.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { google } from "googleapis";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const { sourceId } = await params;

  try {
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    if (source.type !== "google_drive") {
      return NextResponse.json(
        { error: "Folder selection is only supported for Google Drive sources" },
        { status: 400 }
      );
    }

    if (!source.refreshToken) {
      return NextResponse.json(
        { error: "Google Drive is not authenticated" },
        { status: 400 }
      );
    }

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

    const folders = response.data.files ?? [];
    return NextResponse.json({ folders });
  } catch (err) {
    const errMessage = (err as Error)?.message || "Failed to fetch Google Drive folders";
    console.error("[Get Folders] Failed to fetch Google Drive folders:", err);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
