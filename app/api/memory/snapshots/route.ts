import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const snapshotSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export async function GET() {
  try {
    const { workspace } = await auth();

    const snapshots = await prisma.memorySnapshot.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse({ snapshots });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/memory/snapshots error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspace } = await auth();

    const body = await request.json();
    const result = snapshotSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Invalid payload", 400);
    }

    const { title } = result.data;

    const snapshot = await prisma.memorySnapshot.create({
      data: {
        workspaceId: workspace.id,
        title,
      }
    });

    return successResponse({ snapshot });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/memory/snapshots error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { workspace } = await auth();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse("Missing id", 400);
    }

    await prisma.memorySnapshot.deleteMany({
      where: {
        id: id,
        workspaceId: workspace.id
      }
    });

    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("DELETE /api/memory/snapshots error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
