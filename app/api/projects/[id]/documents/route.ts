import { requirePermission } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Permissions } from "@/lib/rbac";
import { successResponse } from "@/lib/api-response";
import { projectRouteError, getWorkspaceProject } from "@/lib/projects";
import { getVisibleSourceIds } from "@/lib/source-access";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/projects/:id/documents?status=confirmed|suggested|rejected&q=&page=1
// Only documents from sources the caller may read are returned.
export async function GET(req: Request, { params }: Ctx) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_READ);
    const { id } = await params;
    await getWorkspaceProject(id, user.workspaceId);

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "confirmed";
    const q = url.searchParams.get("q")?.trim();
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = 25;

    const visible = await getVisibleSourceIds(user);
    const where = {
      projectId: id,
      status,
      document: {
        sourceId: { in: visible },
        ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
      },
    };

    const [total, rows, counts] = await Promise.all([
      prisma.documentProject.count({ where }),
      prisma.documentProject.findMany({
        where,
        orderBy: [{ document: { updatedAt: "desc" } }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          document: {
            select: {
              id: true, title: true, url: true, fileType: true, updatedAt: true,
              source: { select: { id: true, name: true, type: true } },
            },
          },
        },
      }),
      prisma.documentProject.groupBy({
        by: ["status"],
        where: { projectId: id, document: { sourceId: { in: visible } } },
        _count: { _all: true },
      }),
    ]);

    return successResponse({
      total,
      page,
      pageSize,
      counts: Object.fromEntries(counts.map(c => [c.status, c._count._all])),
      items: rows.map(r => ({
        documentId: r.documentId,
        method: r.method,
        confidence: r.confidence,
        status: r.status,
        ...r.document,
      })),
    });
  } catch (error) {
    return projectRouteError(error, "GET /api/projects/[id]/documents");
  }
}
