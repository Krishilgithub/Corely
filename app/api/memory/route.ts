import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
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
    const { workspace } = await auth();

    // Seed dummy data if empty
    const count = await prisma.orgMemory.count({ where: { workspaceId: workspace.id } });

    if (count === 0) {
      const dummyMemories = [
        {
          workspaceId: workspace.id,
          category: "decision",
          title: "Decision Captured",
          content: "Approved Q2 marketing budget increase of 15% focusing on paid acquisition and brand.",
          badges: ["Marketing Strategy"],
          sourceName: "Notion",
          avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
          createdAt: new Date(),
        },
        {
          workspaceId: workspace.id,
          category: "discussion",
          title: "Discussion Summary",
          content: "Product roadmap review meeting. Aligned on shipping AI Search in June.",
          badges: ["Product", "Roadmap"],
          sourceName: "Slack",
          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        },
      ];
      await prisma.orgMemory.createMany({ data: dummyMemories });
    }

    const memories = await prisma.orgMemory.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse({ memories });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/memory error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, workspace } = await auth();

    const body = await request.json();
    const result = memorySchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Invalid payload", 400);
    }

    const { category, title, content, badges, sourceName, avatarUrl } = result.data;

    const memory = await prisma.orgMemory.create({
      data: {
        workspaceId: workspace.id,
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
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/memory error:", error);
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

    await prisma.orgMemory.deleteMany({
      where: {
        id: id,
        workspaceId: workspace.id
      }
    });

    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("DELETE /api/memory error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
