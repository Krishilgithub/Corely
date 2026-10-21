import { prisma } from "./db";
import type { ScopeType } from "./document-scope";

/**
 * Works out which documents belong to a project, and keeps document_projects
 * up to date. Three ways to match, most reliable first:
 *
 *  1. linked   – the document sits inside a scope linked to the project
 *                (a Slack channel, Drive folder, repo, Notion page tree…).
 *  2. rule     – the project's name, other names or key appear in the title,
 *                or a ticket reference like "ATL-123" appears in the text.
 *  3. ai       – added in a later phase; never touched here.
 *
 * People's decisions always win: rows marked "manual" or "rejected" are
 * never changed by this file.
 */

type Match = { method: "linked" | "rule"; confidence: number; status: "confirmed" | "suggested" };

const RANK: Record<string, number> = { linked: 3, rule_title: 2, rule_key: 1.5, rule_text: 1 };

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Names worth matching on: long enough that they are unlikely to be ordinary words. */
function matchTerms(name: string, aliases: unknown): string[] {
  const list = [name, ...(Array.isArray(aliases) ? aliases.map(String) : [])]
    .map(t => t.trim())
    .filter(t => t.length >= 4);
  return Array.from(new Set(list.map(t => t.toLowerCase())));
}

/** Documents inside one linked scope. */
async function documentsInScope(
  workspaceId: string,
  link: { sourceId: string; scopeType: string; scopeId: string }
): Promise<string[]> {
  const type = link.scopeType as ScopeType | "source";

  if (type === "source") {
    const docs = await prisma.document.findMany({
      where: { workspaceId, sourceId: link.sourceId },
      select: { id: true },
    });
    return docs.map(d => d.id);
  }

  if (type === "page") {
    // Notion: the page itself plus every page below it. Each document knows
    // only its parent, so walk upwards through the documents we have.
    const docs = await prisma.$queryRaw<Array<{ id: string; external_id: string; parent_id: string | null }>>`
      SELECT id, external_id, metadata->>'parentId' AS parent_id
      FROM documents WHERE workspace_id = ${workspaceId}::uuid AND source_id = ${link.sourceId}::uuid`;
    const parentOf = new Map(docs.map(d => [d.external_id, d.parent_id]));
    const target = link.scopeId.replace(/-/g, "");
    const norm = (v: string | null | undefined) => (v ? v.replace(/-/g, "") : v);
    return docs
      .filter(d => {
        let cur: string | null | undefined = d.external_id;
        for (let i = 0; i < 25 && cur; i++) {
          if (norm(cur) === target) return true;
          cur = parentOf.get(cur) ?? null;
        }
        return false;
      })
      .map(d => d.id);
  }

  const containment = JSON.stringify([{ type, id: link.scopeId }]);
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM documents
    WHERE workspace_id = ${workspaceId}::uuid
      AND source_id = ${link.sourceId}::uuid
      AND metadata->'scopes' @> ${containment}::jsonb`;
  return rows.map(r => r.id);
}

/** Documents that mention the project by name, other name or key. */
async function documentsByRules(
  workspaceId: string,
  project: { name: string; key: string | null; aliases: unknown }
): Promise<Map<string, { rank: number; match: Match }>> {
  const out = new Map<string, { rank: number; match: Match }>();
  const put = (id: string, rank: number, match: Match) => {
    const prev = out.get(id);
    if (!prev || prev.rank < rank) out.set(id, { rank, match });
  };

  const terms = matchTerms(project.name, project.aliases);
  const key = project.key?.trim().toUpperCase() || null;

  // Whole words only (\m … \M), case-insensitive.
  const titleTerms = [...terms, ...(key ? [key.toLowerCase()] : [])];
  if (titleTerms.length) {
    const titleRe = `\\m(${titleTerms.map(escapeRegex).join("|")})\\M`;
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM documents WHERE workspace_id = ${workspaceId}::uuid AND title ~* ${titleRe}`;
    rows.forEach(r => put(r.id, RANK.rule_title, { method: "rule", confidence: 0.9, status: "confirmed" }));
  }

  if (key) {
    // Ticket references such as "ATL-123" are a strong signal.
    const keyRe = `\\m${escapeRegex(key)}-[0-9]+\\M`;
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM documents WHERE workspace_id = ${workspaceId}::uuid AND raw_content ~* ${keyRe}`;
    rows.forEach(r => put(r.id, RANK.rule_key, { method: "rule", confidence: 0.85, status: "confirmed" }));
  }

  // A name in the body is weaker: suggest it, a person confirms. Only names of
  // 5+ characters, so short words like "core" do not flood the review queue.
  const bodyTerms = terms.filter(t => t.length >= 5);
  if (bodyTerms.length) {
    const bodyRe = `\\m(${bodyTerms.map(escapeRegex).join("|")})\\M`;
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM documents WHERE workspace_id = ${workspaceId}::uuid AND raw_content ~* ${bodyRe}`;
    rows.forEach(r => put(r.id, RANK.rule_text, { method: "rule", confidence: 0.6, status: "suggested" }));
  }

  return out;
}

export type RefreshResult = { linked: number; rule: number; suggested: number; removed: number };

/** Recomputes the automatic tags of one project. Safe to run any time. */
export async function refreshProjectTags(projectId: string): Promise<RefreshResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { links: true },
  });
  if (!project) return { linked: 0, rule: 0, suggested: 0, removed: 0 };

  const desired = await documentsByRules(project.workspaceId, project);
  for (const link of project.links) {
    for (const id of await documentsInScope(project.workspaceId, link)) {
      desired.set(id, { rank: RANK.linked, match: { method: "linked", confidence: 1, status: "confirmed" } });
    }
  }

  const existing = await prisma.documentProject.findMany({ where: { projectId } });
  const protectedIds = new Set(
    existing.filter(e => e.method === "manual" || e.method === "ai" || e.status === "rejected").map(e => e.documentId)
  );

  const ops = [];
  let removed = 0;
  for (const e of existing) {
    if (protectedIds.has(e.documentId)) continue;
    if (!desired.has(e.documentId)) {
      ops.push(prisma.documentProject.delete({ where: { documentId_projectId: { documentId: e.documentId, projectId } } }));
      removed++;
    }
  }

  const stats = { linked: 0, rule: 0, suggested: 0 };
  for (const [documentId, { match }] of desired) {
    if (protectedIds.has(documentId)) continue;
    if (match.method === "linked") stats.linked++;
    else if (match.status === "suggested") stats.suggested++;
    else stats.rule++;
    ops.push(
      prisma.documentProject.upsert({
        where: { documentId_projectId: { documentId, projectId } },
        create: { documentId, projectId, ...match },
        update: match,
      })
    );
  }

  // Write in batches so a big project does not open one huge transaction.
  for (let i = 0; i < ops.length; i += 200) {
    await prisma.$transaction(ops.slice(i, i + 200));
  }
  return { ...stats, removed };
}

/** Refreshes every project in a workspace that is not archived. Call after a sync. */
export async function refreshWorkspaceProjects(workspaceId: string) {
  const projects = await prisma.project.findMany({
    where: { workspaceId, NOT: { status: "archived" } },
    select: { id: true },
  });
  for (const p of projects) {
    try {
      await refreshProjectTags(p.id);
    } catch (err) {
      console.error(`[Projects] Failed to refresh tags for project ${p.id}:`, err);
    }
  }
}
