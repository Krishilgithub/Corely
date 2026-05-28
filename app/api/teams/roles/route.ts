import { auth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const { workspace } = await auth();

    const roles = await prisma.workspaceRole.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(roles);
  } catch (error) {
    console.error("GET /api/teams/roles error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
