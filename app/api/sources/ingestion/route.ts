/**
 * GET /api/sources/ingestion
 * How many documents were indexed on each of the last 7 days (UTC), for the caller's workspace.
 * Read from Document.indexedAt, which holds the time a document was last indexed.
 */

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const DAYS = 7;

export async function GET() {
  try {
    const user = await requirePermission(Permissions.SOURCES_READ);

    // Start of the day, 6 days ago (UTC). Together with today that makes 7 days.
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const start = new Date(today.getTime() - (DAYS - 1) * 24 * 60 * 60 * 1000);

    const rows = await prisma.$queryRaw<Array<{ day: string; docs: bigint }>>`
      SELECT to_char(indexed_at, 'YYYY-MM-DD') AS day, COUNT(*) AS docs
      FROM documents
      WHERE workspace_id = ${user.workspaceId}::uuid AND indexed_at >= ${start}
      GROUP BY 1`;

    const counts = new Map(rows.map(r => [r.day, Number(r.docs)]));

    // Fill in every day, so days with no documents show as 0.
    const days = Array.from({ length: DAYS }, (_, i) => {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return { date, documents: counts.get(date) ?? 0 };
    });

    return successResponse({ days });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/sources/ingestion error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
