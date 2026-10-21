import { prisma } from "./db";
import { errorResponse } from "./api-response";
import type { Prisma } from "@prisma/client";

export const PROJECT_STATUSES = ["planning", "active", "on_hold", "completed", "archived"] as const;
export const PROJECT_PHASES = ["discovery", "build", "beta", "launch", "maintenance"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Turns the errors thrown by auth() / requirePermission() into the usual API replies. */
export function projectRouteError(error: unknown, label: string) {
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    if (error.message === "Forbidden: Insufficient permissions") return errorResponse("Forbidden", 403);
    if (error.message.startsWith("Invalid:")) return errorResponse(error.message.slice(9).trim(), 400);
    if (error.message === "Not found") return errorResponse("Project not found", 404);
  }
  console.error(`${label} error:`, error);
  return errorResponse("Internal Server Error", 500);
}

const invalid = (msg: string) => new Error(`Invalid: ${msg}`);

function optionalDate(v: unknown, field: string): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) throw invalid(`${field} is not a valid date`);
  return d;
}

function optionalText(v: unknown, field: string, max: number): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const s = String(v).trim();
  if (s.length > max) throw invalid(`${field} must be ${max} characters or fewer`);
  return s || null;
}

/**
 * Checks a create/update body and returns only the fields Prisma should write.
 * `partial` is true for PATCH, where every field is optional.
 */
export async function parseProjectInput(body: Record<string, unknown>, workspaceId: string, partial: boolean) {
  const data: Prisma.ProjectUncheckedUpdateInput = {};

  if (!partial || body.name !== undefined) {
    const name = String(body.name ?? "").trim();
    if (!name) throw invalid("Project name is required");
    if (name.length > 120) throw invalid("Project name must be 120 characters or fewer");
    data.name = name;
  }

  if (body.key !== undefined) {
    const key = body.key === null ? "" : String(body.key).trim().toUpperCase();
    if (key && !/^[A-Z][A-Z0-9]{1,9}$/.test(key)) {
      throw invalid("Project key must be 2–10 letters or numbers and start with a letter, for example ATL");
    }
    data.key = key || null;
  }

  const description = optionalText(body.description, "Description", 2000);
  if (description !== undefined) data.description = description;

  if (body.aliases !== undefined) {
    const raw = Array.isArray(body.aliases) ? body.aliases : String(body.aliases ?? "").split(",");
    const aliases = Array.from(new Set(raw.map(a => String(a).trim()).filter(Boolean))).slice(0, 20);
    if (aliases.some(a => a.length > 60)) throw invalid("Each alias must be 60 characters or fewer");
    data.aliases = aliases;
  }

  if (body.status !== undefined) {
    if (!PROJECT_STATUSES.includes(body.status as ProjectStatus)) throw invalid("Unknown project status");
    data.status = body.status as string;
  }

  if (body.phase !== undefined) {
    if (body.phase !== null && body.phase !== "" && !PROJECT_PHASES.includes(body.phase as (typeof PROJECT_PHASES)[number])) {
      throw invalid("Unknown project phase");
    }
    data.phase = (body.phase as string) || null;
  }

  if (body.ownerId !== undefined) {
    if (body.ownerId) {
      const owner = await prisma.user.findFirst({ where: { id: String(body.ownerId), workspaceId }, select: { id: true } });
      if (!owner) throw invalid("Owner must be a member of this workspace");
    }
    data.ownerId = (body.ownerId as string) || null;
  }

  if (body.teamId !== undefined) {
    if (body.teamId) {
      const team = await prisma.team.findFirst({ where: { id: String(body.teamId), workspaceId }, select: { id: true } });
      if (!team) throw invalid("Team must belong to this workspace");
    }
    data.teamId = (body.teamId as string) || null;
  }

  const startDate = optionalDate(body.startDate, "Start date");
  if (startDate !== undefined) data.startDate = startDate;
  const targetDate = optionalDate(body.targetDate, "Target date");
  if (targetDate !== undefined) data.targetDate = targetDate;

  if (data.startDate instanceof Date && data.targetDate instanceof Date && data.targetDate < data.startDate) {
    throw invalid("Target date must be after the start date");
  }

  return data;
}

/** Loads a project only if it belongs to the caller's workspace. */
export async function getWorkspaceProject(projectId: string, workspaceId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, workspaceId } });
  if (!project) throw new Error("Not found");
  return project;
}

/** Latest update time of the confirmed documents in each project. */
export async function lastActivityByProject(projectIds: string[]) {
  if (projectIds.length === 0) return new Map<string, Date>();
  const rows = await prisma.$queryRaw<Array<{ project_id: string; last: Date }>>`
    SELECT dp.project_id, MAX(d.updated_at) AS last
    FROM document_projects dp
    JOIN documents d ON d.id = dp.document_id
    WHERE dp.project_id = ANY(${projectIds}::uuid[]) AND dp.status = 'confirmed'
    GROUP BY dp.project_id`;
  return new Map(rows.map(r => [r.project_id, r.last]));
}
