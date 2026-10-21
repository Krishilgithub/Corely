import { requirePermission } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Permissions } from "@/lib/rbac";
import { successResponse } from "@/lib/api-response";
import { projectRouteError, getWorkspaceProject } from "@/lib/projects";
import { getVisibleSourceIds } from "@/lib/source-access";
import { calculateTemporalConfidence } from "@/lib/freshness";
import { MEMORY_TYPES, type MemoryType } from "@/lib/project-memory";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/projects/:id/memory?type=decision&q=&limit=50
// Memories from sources the caller may read, plus hand-written ones. Newest first.
export async function GET(req: Request, { params }: Ctx) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_READ);
    const { id } = await params;
    await getWorkspaceProject(id, user.workspaceId);

    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const q = url.searchParams.get("q")?.trim();
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || 100)));

    const visible = await getVisibleSourceIds(user);
    const where = {
      projectId: id,
      ...(type && MEMORY_TYPES.includes(type as MemoryType) ? { type } : {}),
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { content: { contains: q, mode: "insensitive" as const } }] } : {}),
      AND: [{ OR: [{ sourceDocumentId: null }, { sourceDocument: { sourceId: { in: visible } } }] }],
    };

    const [rows, byType, pending] = await Promise.all([
      prisma.orgMemory.findMany({
        where,
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        take: limit,
        include: {
          sourceDocument: {
            select: { id: true, title: true, url: true, fileType: true, updatedAt: true, source: { select: { type: true, name: true } } },
          },
        },
      }),
      prisma.orgMemory.groupBy({
        by: ["type"],
        where: { projectId: id, AND: [{ OR: [{ sourceDocumentId: null }, { sourceDocument: { sourceId: { in: visible } } }] }] },
        _count: { _all: true },
      }),
      prisma.$queryRaw<Array<{ n: bigint }>>`
        SELECT COUNT(*) AS n FROM document_projects dp JOIN documents d ON d.id = dp.document_id
        WHERE dp.project_id = ${id}::uuid AND dp.status = 'confirmed' AND d.raw_content IS NOT NULL
          AND dp.extracted_hash IS DISTINCT FROM COALESCE(d.content_hash, md5(d.raw_content))`,
    ]);

    return successResponse({
      counts: Object.fromEntries(byType.map(b => [b.type ?? "fact", b._count._all])),
      pendingDocuments: Number(pending[0]?.n ?? 0),
      items: rows.map(m => {
        const doc = m.sourceDocument;
        const freshness = calculateTemporalConfidence(doc?.updatedAt ?? m.occurredAt ?? null, m.createdAt, doc?.fileType ?? undefined);
        return {
          id: m.id,
          type: (m.type ?? "fact") as MemoryType,
          title: m.title,
          content: m.content,
          occurredAt: m.occurredAt ?? m.createdAt,
          confidence: m.confidence,
          manual: !m.sourceDocumentId,
          freshness,
          source: doc
            ? { documentId: doc.id, title: doc.title, url: doc.url, type: doc.source.type, name: doc.source.name }
            : { documentId: null, title: null, url: null, type: "manual", name: m.sourceName },
        };
      }),
    });
  } catch (error) {
    return projectRouteError(error, "GET /api/projects/[id]/memory");
  }
}

// POST /api/projects/:id/memory  { type, title, content, occurredAt? } — add a memory by hand.
export async function POST(req: Request, { params }: Ctx) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_MANAGE);
    const { id } = await params;
    const project = await getWorkspaceProject(id, user.workspaceId);

    const body = await req.json().catch(() => ({}));
    const type = String(body.type ?? "");
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    if (!MEMORY_TYPES.includes(type as MemoryType)) throw new Error("Invalid: Choose a memory type");
    if (!title) throw new Error("Invalid: A title is required");
    if (title.length > 140) throw new Error("Invalid: The title must be 140 characters or fewer");
    if (content.length > 2000) throw new Error("Invalid: The details must be 2,000 characters or fewer");
    const occurredAt = body.occurredAt ? new Date(String(body.occurredAt)) : new Date();
    if (Number.isNaN(occurredAt.getTime())) throw new Error("Invalid: The date is not valid");

    const memory = await prisma.orgMemory.create({
      data: {
        workspaceId: project.workspaceId,
        projectId: id,
        type,
        category: type,
        title,
        content: content || title,
        badges: [type, "manual"],
        sourceName: user.name || user.email,
        occurredAt,
        confidence: 1,
      },
    });
    return successResponse(memory, 201);
  } catch (error) {
    return projectRouteError(error, "POST /api/projects/[id]/memory");
  }
}
