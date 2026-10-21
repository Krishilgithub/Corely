import { prisma } from "./db";

type AccessUser = {
  id: string;
  workspaceId: string;
  role: string;
  workspaceRole?: { permissions: unknown } | null;
};

/**
 * The sources a user may read: their own, the ones shared with everyone, and
 * all sources when they are an admin or hold sources:read.
 *
 * This is the same rule /api/ask uses. Keep them in step; when roles are
 * tightened (feature-gap plan, Phase 1) change it here and in /api/ask.
 */
export async function getVisibleSourceIds(user: AccessUser): Promise<string[]> {
  const perms = Array.isArray(user.workspaceRole?.permissions) ? (user.workspaceRole!.permissions as string[]) : [];
  if (user.role === "admin" || perms.includes("sources:read")) {
    const all = await prisma.source.findMany({ where: { workspaceId: user.workspaceId }, select: { id: true } });
    return all.map(s => s.id);
  }
  const [own, shared] = await Promise.all([
    prisma.source.findMany({ where: { workspaceId: user.workspaceId, userId: user.id }, select: { id: true } }),
    prisma.source.findMany({
      where: { workspaceId: user.workspaceId, config: { path: ["permissions"], equals: "everyone" } },
      select: { id: true },
    }),
  ]);
  return Array.from(new Set([...own, ...shared].map(s => s.id)));
}
