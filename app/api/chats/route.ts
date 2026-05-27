import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createChatSchema = z.object({
  title: z.string().optional(),
});

export async function GET() {
  try {
    const { workspace } = await auth();

    const sessions = await prisma.chatSession.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse({ sessions });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("[GET /api/chats] Error:", error);
    return errorResponse("Failed to fetch conversations", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspace } = await auth();

    const body = await request.json();
    const result = createChatSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Invalid payload", 400);
    }

    const session = await prisma.chatSession.create({
      data: {
        workspaceId: workspace.id,
        title: result.data.title || "New Conversation",
      },
    });

    return successResponse(session);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("[POST /api/chats] Error:", error);
    return errorResponse("Failed to create conversation", 500);
  }
}
