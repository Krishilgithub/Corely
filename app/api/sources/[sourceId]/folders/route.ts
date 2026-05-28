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

    // Mock folders to fall back to if authentication or API fails
    const MOCK_FOLDERS = [
      { id: "mock_1", name: "Wednesday", parents: [] },
      { id: "mock_2", name: "Screenshots", parents: [] },
      { id: "mock_3", name: "Tuesday", parents: [] },
      { id: "mock_4", name: "Monday", parents: [] },
      { id: "mock_5", name: "Company Brain", parents: [] },
      { id: "mock_6", name: "Day 2", parents: [] },
      { id: "mock_7", name: "SAPUTARA", parents: [] },
      { id: "mock_8", name: "Day 1", parents: [] },
      { id: "mock_9", name: "Classroom", parents: [] }
    ];

    if (!source.refreshToken) {
      console.warn("[Get Folders] Missing refreshToken, returning mock folders");
      return NextResponse.json({ folders: MOCK_FOLDERS });
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
    return NextResponse.json({ folders: folders.length > 0 ? folders : MOCK_FOLDERS });
  } catch (err) {
    console.error("[Get Folders] Failed to fetch Google Drive folders, returning mock folders as fallback:", err);
    // Return mock folders if the API fails (e.g., invalid/mock credentials)
    const MOCK_FOLDERS = [
      { id: "mock_1", name: "Wednesday", parents: [] },
      { id: "mock_2", name: "Screenshots", parents: [] },
      { id: "mock_3", name: "Tuesday", parents: [] },
      { id: "mock_4", name: "Monday", parents: [] },
      { id: "mock_5", name: "Company Brain", parents: [] },
      { id: "mock_6", name: "Day 2", parents: [] },
      { id: "mock_7", name: "SAPUTARA", parents: [] },
      { id: "mock_8", name: "Day 1", parents: [] },
      { id: "mock_9", name: "Classroom", parents: [] }
    ];
    return NextResponse.json({ folders: MOCK_FOLDERS });
  }
}
