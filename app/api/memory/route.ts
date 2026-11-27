import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const memorySchema = z.object({
  category: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  badges: z.array(z.string()).optional(),
  sourceName: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export async function GET() {
  try {
    const user = await requirePermission(Permissions.MEMORY_READ);

    const memories = await prisma.orgMemory.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { createdAt: 'desc' }
    });

    const syncedDocuments = await prisma.document.findMany({
      where: { workspaceId: user.workspaceId },
      select: {
        id: true,
        title: true,
        fileType: true,
        url: true,
        indexedAt: true,
        updatedAt: true,
        source: {
          select: {
            name: true,
            type: true
          }
        }
      },
      orderBy: { indexedAt: 'desc' },
      take: 100
    });

    const formattedDocs = syncedDocuments.map(doc => ({
      id: doc.id,
      createdAt: doc.indexedAt || doc.updatedAt || new Date(),
      category: "document",
      title: doc.title || "Untitled Document",
      content: `Synced document from ${doc.source.name}`,
      badges: doc.fileType ? [doc.fileType] : [],
      sourceName: doc.source.name,
      avatarUrl: null,
      url: doc.url,
      // Synced documents are not OrgMemory rows. They are removed via Sources, not here.
      isSyncedDocument: true
    }));

    const allMemories = [...memories, ...formattedDocs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return successResponse({ memories: allMemories });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/memory error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(Permissions.MEMORY_WRITE);

    const body = await request.json();
    const result = memorySchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Invalid payload", 400);
    }

    const { category, title, content, badges, sourceName, avatarUrl } = result.data;

    const memory = await prisma.orgMemory.create({
      data: {
        workspaceId: user.workspaceId,
        category: category || "knowledge",
        title,
        content,
        badges: badges || [],
        sourceName: sourceName || "User Input",
        avatarUrl: avatarUrl || user.avatarUrl || null,
      }
    });

    return successResponse({ memory });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/memory error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requirePermission(Permissions.MEMORY_WRITE);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse("Missing id", 400);
    }

    const deleted = await prisma.orgMemory.deleteMany({
      where: {
        id: id,
        workspaceId: user.workspaceId
      }
    });

    // Nothing matched: it is not a memory in this workspace (it may be a synced document).
    if (deleted.count === 0) {
      return errorResponse("Memory not found", 404);
    }

    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("DELETE /api/memory error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
