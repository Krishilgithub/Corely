import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { prisma } from "./db";
import { anthropic } from "./anthropic";

/**
 * Builds a project's memory from its documents.
 *
 * For each confirmed project document that is new or has changed since the
 * last run, a small model reads it and pulls out decisions, risks,
 * milestones, open questions and key facts about this project. Each item is
 * saved as an OrgMemory row that points back to its source document.
 *
 * Cost control:
 *  - only new or changed documents are read (document_projects.extracted_hash);
 *  - a cheap model (EXTRACTION_MODEL);
 *  - at most `limit` documents per call, and at most MAX_CHARS of each.
 */
export const EXTRACTION_MODEL = process.env.CORELY_EXTRACTION_MODEL || "claude-haiku-5-5";
const MAX_CHARS = 12_000;
const MAX_ITEMS_PER_DOC = 8;
const MAX_FACTS_PER_DOC = 3;
const MIN_CONFIDENCE = 0.5;
// Safety net: never store anything that looks like a secret, whatever the model returns.
const SECRET_RE = /(password|passcode|credential|api[ _-]?key|secret|token|private key|login details)/i;

export const MEMORY_TYPES = ["decision", "risk", "milestone", "question", "fact"] as const;
export type MemoryType = (typeof MEMORY_TYPES)[number];

type Extracted = { type: MemoryType; title: string; detail: string; date: string | null; confidence: number };

function buildPrompt(project: { name: string; key: string | null; description: string | null }) {
  return `You extract project memory for a company knowledge base.
Project: "${project.name}"${project.key ? ` (key ${project.key})` : ""}.
${project.description ? `About the project: ${project.description}\n` : ""}
Read the document and list only facts about THIS project. Return JSON:
{"items":[{"type":"decision|risk|milestone|question|fact","title":"...","detail":"...","date":"YYYY-MM-DD or null","confidence":0.0-1.0}]}

Types:
- decision: something that was decided or chosen, with the reason if given.
- risk: a problem, blocker or concern that could hurt the project.
- milestone: a release, launch, deadline or completed phase.
- question: an open question that is still unanswered.
- fact: another important, lasting fact (owner, scope, architecture, customer).

Rules:
- At most ${MAX_ITEMS_PER_DOC} items. Fewer, more useful items are better than many small ones.
- Skip small talk, greetings and anything not about this project.
- Do NOT restate the project description above, or general statements about what the project is or includes.
- A change someone made on purpose (chose, added, removed, switched, closed, dropped, replaced) is a decision, not a fact. Say what changed and why.
- Use fact only for lasting details a new team member must know: owners, architecture, important constraints, customers. At most 3 facts.
- Never record passwords, login details, API keys, tokens or other secrets, even if the text contains them.
- Skip links, PR or ticket numbers on their own, authors of a change, test plans, and setup or install steps.
- title: under 90 characters, plain words, no trailing full stop.
- detail: one or two sentences. Name who decided or said it when the text says so.
- date: when it happened, if the text says. Otherwise null.
- confidence: how sure you are the item is correct and about this project.
- If nothing is relevant, return {"items":[]}.`;
}

function clean(raw: unknown): Extracted[] {
  const items = (raw as { items?: unknown })?.items;
  if (!Array.isArray(items)) return [];
  let facts = 0;
  return items
    .map(i => i as Record<string, unknown>)
    .filter(i => MEMORY_TYPES.includes(i.type as MemoryType) && typeof i.title === "string" && i.title.trim())
    .slice(0, MAX_ITEMS_PER_DOC)
    .map(i => ({
      type: i.type as MemoryType,
      title: String(i.title).trim().slice(0, 140),
      detail: String(i.detail ?? "").trim().slice(0, 600),
      date: typeof i.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(i.date) ? i.date : null,
      confidence: Math.max(0, Math.min(1, Number(i.confidence) || 0.5)),
    }))
    .filter(i => i.confidence >= MIN_CONFIDENCE)
    .filter(i => !SECRET_RE.test(i.title) && !SECRET_RE.test(i.detail))
    .filter(i => i.type !== "fact" || ++facts <= MAX_FACTS_PER_DOC);
}

async function extractFromDocument(
  project: { name: string; key: string | null; description: string | null },
  doc: { title: string; rawContent: string }
): Promise<Extracted[]> {
  // Structured output: the API returns JSON that matches ExtractionSchema.
  const res = await anthropic.messages.parse({
    model: EXTRACTION_MODEL,
    max_tokens: 16000,
    system: buildPrompt(project),
    messages: [
      { role: "user", content: `Document title: ${doc.title}\n\n${doc.rawContent.slice(0, MAX_CHARS)}` },
    ],
    output_config: { effort: "medium", format: zodOutputFormat(ExtractionSchema) },
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) return [];
  return clean(res.parsed_output);
}

const ExtractionSchema = z.object({
  items: z.array(
    z.object({
      type: z.enum(MEMORY_TYPES),
      title: z.string(),
      detail: z.string(),
      date: z.string().nullable(),
      confidence: z.number(),
    })
  ),
});

export type ExtractResult = { processed: number; created: number; remaining: number; failed: number };

/** Reads up to `limit` new or changed documents of one project. */
export async function extractProjectMemory(projectId: string, limit = 6): Promise<ExtractResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, workspaceId: true, name: true, key: true, description: true },
  });
  if (!project) return { processed: 0, created: 0, remaining: 0, failed: 0 };

  // Confirmed documents whose content changed since the last extraction.
  const pending = await prisma.$queryRaw<Array<{ document_id: string }>>`
    SELECT dp.document_id
    FROM document_projects dp
    JOIN documents d ON d.id = dp.document_id
    WHERE dp.project_id = ${projectId}::uuid
      AND dp.status = 'confirmed'
      AND d.raw_content IS NOT NULL
      AND (dp.extracted_hash IS DISTINCT FROM COALESCE(d.content_hash, md5(d.raw_content)))
    ORDER BY d.updated_at DESC`;

  const batch = pending.slice(0, limit);
  let created = 0;
  let failed = 0;

  for (const { document_id } of batch) {
    const doc = await prisma.document.findUnique({
      where: { id: document_id },
      select: { id: true, title: true, rawContent: true, contentHash: true, updatedAt: true, source: { select: { name: true } } },
    });
    if (!doc?.rawContent) continue;
    const hash = doc.contentHash ?? (await md5(doc.rawContent));

    try {
      const items = await extractFromDocument(project, { title: doc.title, rawContent: doc.rawContent });
      await prisma.$transaction([
        // Replace what this document said before; hand-written memories are kept.
        prisma.orgMemory.deleteMany({ where: { projectId, sourceDocumentId: doc.id } }),
        ...items.map(it =>
          prisma.orgMemory.create({
            data: {
              workspaceId: project.workspaceId,
              projectId,
              type: it.type,
              category: it.type,
              title: it.title,
              content: it.detail || it.title,
              badges: [it.type],
              sourceName: doc.source.name,
              sourceDocumentId: doc.id,
              occurredAt: it.date ? new Date(`${it.date}T00:00:00Z`) : doc.updatedAt,
              confidence: it.confidence,
            },
          })
        ),
        prisma.documentProject.update({
          where: { documentId_projectId: { documentId: doc.id, projectId } },
          data: { extractedHash: hash },
        }),
      ]);
      created += items.length;
    } catch (err) {
      failed++;
      console.error(`[Projects] Memory extraction failed for document ${doc.id}:`, err);
    }
  }

  return { processed: batch.length, created, remaining: Math.max(0, pending.length - batch.length), failed };
}

/** After a sync: extract memory for every active project, a few documents each. */
export async function extractWorkspaceProjectMemory(workspaceId: string, perProject = 10) {
  const projects = await prisma.project.findMany({
    where: { workspaceId, status: { in: ["active", "planning", "on_hold"] } },
    select: { id: true },
  });
  for (const p of projects) {
    try {
      await extractProjectMemory(p.id, perProject);
    } catch (err) {
      console.error(`[Projects] Memory extraction failed for project ${p.id}:`, err);
    }
  }
}

async function md5(text: string) {
  const crypto = await import("crypto");
  return crypto.createHash("md5").update(text).digest("hex");
}
