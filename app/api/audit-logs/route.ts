import { NextRequest } from "next/server";
import { auth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/audit-logs
 * Returns paginated workspace audit logs (admin only).
 */
export async function GET(req: NextRequest) {
  try {
    const { user, workspace } = await auth();

    // Only admins can view audit logs
    if (user.role !== "admin") {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "25", 10));
    const skip = (page - 1) * limit;
    const action = searchParams.get("action") || undefined;
    const userId = searchParams.get("userId") || undefined;

    const where = {
      workspaceId: workspace.id,
      ...(action ? { action } : {}),
      ...(userId ? { userId } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return successResponse({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/audit-logs error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
