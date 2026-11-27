import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const snapshotSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export async function GET() {
  try {
    const user = await requirePermission(Permissions.MEMORY_READ);

    const snapshots = await prisma.memorySnapshot.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse({ snapshots });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    console.error("GET /api/memory/snapshots error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(Permissions.MEMORY_WRITE);

    const body = await request.json();
    const result = snapshotSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Invalid payload", 400);
    }

    const { title } = result.data;

    const snapshot = await prisma.memorySnapshot.create({
      data: {
        workspaceId: user.workspaceId,
        title,
      }
    });

    return successResponse({ snapshot });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    console.error("POST /api/memory/snapshots error:", error);
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

    await prisma.memorySnapshot.deleteMany({
      where: {
        id: id,
        workspaceId: user.workspaceId
      }
    });

    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    console.error("DELETE /api/memory/snapshots error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
