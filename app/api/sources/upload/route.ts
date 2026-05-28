import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  try {
    const { user, workspace } = await auth();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const rawContent = await file.text();
    const content = rawContent.replace(/\0/g, ''); // Strip null bytes for Postgres
    const title = file.name;
    const fileType = file.name.split('.').pop() || "txt";

    // Find or create the manual_upload source for this workspace
    let source = await prisma.source.findFirst({
      where: { workspaceId: workspace.id, type: "manual_upload" }
    });

    if (!source) {
      source = await prisma.source.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          type: "manual_upload",
          name: "Manual Uploads",
          status: "synced",
          itemsIndexed: 0,
          lastSyncedAt: new Date(),
          config: { permissions: "everyone" }
        }
      });
    }

    // Create a new document with the file content
    const externalId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await prisma.document.create({
      data: {
        workspaceId: workspace.id,
        sourceId: source.id,
        externalId,
        title,
        fileType,
        rawContent: content,
        indexedAt: new Date(),
      }
    });

    // Update items indexed on the source
    await prisma.source.update({
      where: { id: source.id },
      data: {
        itemsIndexed: { increment: 1 },
        lastSyncedAt: new Date(),
      }
    });

    return NextResponse.json({ success: true, message: "File uploaded successfully" });
  } catch (err) {
    console.error("[Manual Upload Error]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
