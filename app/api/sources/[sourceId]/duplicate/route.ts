import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  try {
    const { workspace, user } = await auth();
    const { sourceId } = await params;

    const existingSource = await prisma.source.findUnique({
      where: {
        id: sourceId,
        workspaceId: workspace.id,
      },
    });

    if (!existingSource) {
      return errorResponse("Source not found", 404);
    }

    // Parse the existing config and remove any specific folderId so the user can configure a new one
    let newConfig = {};
    if (existingSource.config && typeof existingSource.config === 'object') {
      newConfig = { ...existingSource.config };
      // Remove folderId so the new source forces folder selection
      if ('folderId' in newConfig) {
        delete (newConfig as Record<string, unknown>).folderId;
      }
      if ('folderIds' in newConfig) {
        delete (newConfig as Record<string, unknown>).folderIds;
      }
    }

    const newSource = await prisma.source.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        type: existingSource.type,
        name: `${existingSource.name} (Copy)`,
        status: "idle",
        config: newConfig,
      },
    });

    return successResponse(newSource);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/sources/[sourceId]/duplicate error:", error);
    return errorResponse("Failed to duplicate source", 500);
  }
}
