import { requirePermission } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Permissions } from "@/lib/rbac";
import { successResponse } from "@/lib/api-response";
import { parseProjectInput, projectRouteError, getWorkspaceProject, lastActivityByProject } from "@/lib/projects";
import { refreshProjectTags } from "@/lib/project-matching";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/projects/:id
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_READ);
    const { id } = await params;
    await getWorkspaceProject(id, user.workspaceId);

    const project = await prisma.project.findUniqueOrThrow({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
        links: {
          orderBy: { createdAt: "asc" },
          include: { source: { select: { id: true, name: true, type: true, status: true } } },
        },
        _count: { select: { memories: true, documents: { where: { status: "confirmed" } } } },
      },
    });

    const [suggestions, memoryByType] = await Promise.all([
      prisma.documentProject.count({ where: { projectId: id, status: "suggested" } }),
      prisma.orgMemory.groupBy({ by: ["type"], where: { projectId: id }, _count: { _all: true } }),
    ]);
    const lastActivity = await lastActivityByProject([id]);
    const { _count, ...rest } = project;

    // Daily activity for the heatmap: documents updated and memories recorded, last 18 weeks.
    const activityRows = await prisma.$queryRaw<Array<{ day: string; n: bigint }>>`
      SELECT day, SUM(n)::bigint AS n FROM (
        SELECT to_char(d.updated_at, 'YYYY-MM-DD') AS day, COUNT(*) AS n
        FROM document_projects dp JOIN documents d ON d.id = dp.document_id
        WHERE dp.project_id = ${id}::uuid AND dp.status = 'confirmed' AND d.updated_at > now() - interval '126 days'
        GROUP BY 1
        UNION ALL
        SELECT to_char(COALESCE(m.occurred_at, m.created_at), 'YYYY-MM-DD') AS day, COUNT(*) AS n
        FROM org_memories m
        WHERE m.project_id = ${id}::uuid AND COALESCE(m.occurred_at, m.created_at) > now() - interval '126 days'
        GROUP BY 1
      ) t GROUP BY day`;

    // How many confirmed documents Corely has not read for memory yet.
    const unreadRows = await prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*) AS n FROM document_projects dp JOIN documents d ON d.id = dp.document_id
      WHERE dp.project_id = ${id}::uuid AND dp.status = 'confirmed' AND d.raw_content IS NOT NULL
        AND dp.extracted_hash IS DISTINCT FROM COALESCE(d.content_hash, md5(d.raw_content))`;

    return successResponse({
      ...rest,
      counts: {
        documents: _count.documents,
        memories: _count.memories,
        suggestions,
        byType: Object.fromEntries(memoryByType.map(m => [m.type ?? "other", m._count._all])),
        unread: Number(unreadRows[0]?.n ?? 0),
      },
      activity: activityRows.map(r => ({ date: r.day, count: Number(r.n) })),
      lastActivityAt: lastActivity.get(id) ?? null,
    });
  } catch (error) {
    return projectRouteError(error, "GET /api/projects/[id]");
  }
}

// PATCH /api/projects/:id
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_MANAGE);
    const { id } = await params;
    await getWorkspaceProject(id, user.workspaceId);

    const body = await req.json().catch(() => ({}));
    const data = await parseProjectInput(body, user.workspaceId, true);

    if (data.key) {
      const clash = await prisma.project.findFirst({
        where: { workspaceId: user.workspaceId, key: data.key as string, NOT: { id } },
      });
      if (clash) throw new Error(`Invalid: Another project already uses the key ${data.key}`);
    }

    const project = await prisma.project.update({ where: { id }, data });
    // The matcher uses the name, key and other names, so re-run it when they change.
    if (data.name !== undefined || data.key !== undefined || data.aliases !== undefined) {
      await refreshProjectTags(id).catch(err => console.error("[Projects] tag refresh failed:", err));
    }
    // Memory is extracted "about this project", so a new name or description
    // means every document should be read again on the next memory update.
    if (data.name !== undefined || data.description !== undefined || data.aliases !== undefined) {
      await prisma.documentProject.updateMany({ where: { projectId: id }, data: { extractedHash: null } });
    }
    return successResponse(project);
  } catch (error) {
    return projectRouteError(error, "PATCH /api/projects/[id]");
  }
}

// DELETE /api/projects/:id — removes the project, its links, tags and project memories.
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_MANAGE);
    const { id } = await params;
    await getWorkspaceProject(id, user.workspaceId);
    await prisma.project.delete({ where: { id } });
    return successResponse({ id });
  } catch (error) {
    return projectRouteError(error, "DELETE /api/projects/[id]");
  }
}
