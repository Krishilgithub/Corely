import { requirePermission } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Permissions } from "@/lib/rbac";
import { successResponse } from "@/lib/api-response";
import { projectRouteError, getWorkspaceProject } from "@/lib/projects";
import { getVisibleSourceIds } from "@/lib/source-access";
import { refreshProjectTags } from "@/lib/project-matching";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const SCOPE_TYPES = ["source", "channel", "page", "folder", "repo", "linear_team", "linear_project"];

// GET /api/projects/:id/links
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_READ);
    const { id } = await params;
    await getWorkspaceProject(id, user.workspaceId);
    const links = await prisma.projectSourceLink.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "asc" },
      include: { source: { select: { id: true, name: true, type: true, status: true } } },
    });
    return successResponse(links);
  } catch (error) {
    return projectRouteError(error, "GET /api/projects/[id]/links");
  }
}

// POST /api/projects/:id/links  { sourceId, scopes: [{ type, id, name }] }
export async function POST(req: Request, { params }: Ctx) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_MANAGE);
    const { id } = await params;
    await getWorkspaceProject(id, user.workspaceId);

    const body = await req.json().catch(() => ({}));
    const sourceId = String(body.sourceId ?? "");
    const scopes: Array<{ type: string; id: string; name: string }> = Array.isArray(body.scopes) ? body.scopes : [];
    if (!sourceId || scopes.length === 0) throw new Error("Invalid: Choose a source and at least one item to link");
    if (scopes.length > 100) throw new Error("Invalid: Link at most 100 items at a time");

    const source = await prisma.source.findFirst({ where: { id: sourceId, workspaceId: user.workspaceId }, select: { id: true } });
    if (!source || !(await getVisibleSourceIds(user)).includes(sourceId)) {
      throw new Error("Invalid: You can only link sources you can see");
    }

    for (const s of scopes) {
      if (!SCOPE_TYPES.includes(s.type) || !s.id) throw new Error("Invalid: Unknown item type");
    }

    await prisma.$transaction(
      scopes.map(s =>
        prisma.projectSourceLink.upsert({
          where: { projectId_sourceId_scopeType_scopeId: { projectId: id, sourceId, scopeType: s.type, scopeId: String(s.id) } },
          create: { projectId: id, sourceId, scopeType: s.type, scopeId: String(s.id), scopeName: String(s.name || s.id).slice(0, 200) },
          update: { scopeName: String(s.name || s.id).slice(0, 200) },
        })
      )
    );
    await prisma.project.update({ where: { id }, data: { updatedAt: new Date() } });

    const result = await refreshProjectTags(id);
    return successResponse({ linked: scopes.length, tags: result }, 201);
  } catch (error) {
    return projectRouteError(error, "POST /api/projects/[id]/links");
  }
}
