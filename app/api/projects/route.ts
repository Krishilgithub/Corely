import { requirePermission } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Permissions } from "@/lib/rbac";
import { successResponse } from "@/lib/api-response";
import { parseProjectInput, projectRouteError, lastActivityByProject, PROJECT_STATUSES } from "@/lib/projects";
import type { Prisma } from "@prisma/client";
import { refreshProjectTags } from "@/lib/project-matching";

export const dynamic = "force-dynamic";

// GET /api/projects?status=active&q=atlas
export async function GET(req: Request) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_READ);
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q")?.trim();

    const where: Prisma.ProjectWhereInput = { workspaceId: user.workspaceId };
    if (status && (PROJECT_STATUSES as readonly string[]).includes(status)) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { key: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      include: {
        owner: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
        links: { select: { source: { select: { type: true } } } },
        _count: {
          select: {
            links: true,
            memories: true,
            documents: { where: { status: "confirmed" } },
          },
        },
      },
    });

    const suggested = await prisma.documentProject.groupBy({
      by: ["projectId"],
      where: { projectId: { in: projects.map(p => p.id) }, status: "suggested" },
      _count: { _all: true },
    });
    const suggestedMap = new Map(suggested.map(s => [s.projectId, s._count._all]));
    const lastActivity = await lastActivityByProject(projects.map(p => p.id));

    return successResponse(
      projects.map(({ links, _count, ...p }) => ({
        ...p,
        sourceTypes: Array.from(new Set(links.map(l => l.source.type))),
        counts: {
          links: _count.links,
          documents: _count.documents,
          memories: _count.memories,
          suggestions: suggestedMap.get(p.id) ?? 0,
        },
        lastActivityAt: lastActivity.get(p.id) ?? null,
      }))
    );
  } catch (error) {
    return projectRouteError(error, "GET /api/projects");
  }
}

// POST /api/projects
export async function POST(req: Request) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_MANAGE);
    const body = await req.json().catch(() => ({}));
    const data = await parseProjectInput(body, user.workspaceId, false);

    if (data.key) {
      const clash = await prisma.project.findFirst({ where: { workspaceId: user.workspaceId, key: data.key as string } });
      if (clash) throw new Error(`Invalid: Another project already uses the key ${data.key}`);
    }

    const project = await prisma.project.create({
      data: {
        ...(data as Prisma.ProjectUncheckedCreateInput),
        workspaceId: user.workspaceId,
        ownerId: (data.ownerId as string | null | undefined) ?? user.id,
      },
    });

    // Tag documents that already mention the new project by name or key.
    await refreshProjectTags(project.id).catch(err => console.error("[Projects] initial tag refresh failed:", err));

    return successResponse(project, 201);
  } catch (error) {
    return projectRouteError(error, "POST /api/projects");
  }
}
