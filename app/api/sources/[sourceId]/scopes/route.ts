import { requirePermission } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { projectRouteError } from "@/lib/projects";
import { getVisibleSourceIds } from "@/lib/source-access";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ sourceId: string }> };

// GET /api/sources/:sourceId/scopes
// The channels, folders, repos, pages… found in this source's documents, with how
// many documents each holds. Projects link to these.
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requirePermission(Permissions.PROJECTS_MANAGE);
    const { sourceId } = await params;

    const source = await prisma.source.findFirst({
      where: { id: sourceId, workspaceId: user.workspaceId },
      select: { id: true, name: true, type: true },
    });
    if (!source) return errorResponse("Source not found", 404);
    if (!(await getVisibleSourceIds(user)).includes(source.id)) return errorResponse("Forbidden", 403);

    const rows = await prisma.$queryRaw<Array<{ type: string; id: string; name: string | null; docs: bigint }>>`
      SELECT s->>'type' AS type, s->>'id' AS id, MAX(s->>'name') AS name, COUNT(*) AS docs
      FROM documents d, jsonb_array_elements(COALESCE(d.metadata->'scopes', '[]'::jsonb)) AS s
      WHERE d.source_id = ${sourceId}::uuid
      GROUP BY 1, 2`;

    const total = await prisma.document.count({ where: { sourceId } });

    const scopes = rows
      // Drive files also carry their direct parent folder ids, which have no name.
      // Only the folders chosen in the source settings are worth linking.
      .filter(r => r.name)
      .map(r => ({ type: r.type, id: r.id, name: r.name as string, documents: Number(r.docs) }))
      .sort((a, b) => b.documents - a.documents || a.name.localeCompare(b.name));

    return successResponse({
      source,
      total,
      scopes: [{ type: "source", id: source.id, name: `All of ${source.name}`, documents: total }, ...scopes],
    });
  } catch (error) {
    return projectRouteError(error, "GET /api/sources/[sourceId]/scopes");
  }
}
