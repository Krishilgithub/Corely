import { prisma } from "./db";

// Define all valid system permissions
export const Permissions = {
  MEMORY_READ: "memory:read",
  MEMORY_WRITE: "memory:write",
  INSIGHTS_READ: "insights:read",
  INSIGHTS_WRITE: "insights:write",
  TEAMS_READ: "teams:read",
  TEAMS_MANAGE: "teams:manage",
  SOURCES_READ: "sources:read",
  SOURCES_WRITE: "sources:write",
  PROJECTS_READ: "projects:read",
  PROJECTS_MANAGE: "projects:manage",
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

// Workflows reuse the project permissions instead of having their own.
// Why: each role keeps its permission list in the database (workspace_roles).
// A brand-new permission would be missing from every existing role, so every
// current user, admins too, would lose access to workflows until someone
// edited the roles by hand. The project permissions already give the right
// split: every default role can view, and Admin, Developer and Product Manager
// can create, edit, delete and run. Viewer can only look.
// To give workflows their own permissions later, change these two lines and
// add the new values to the stored roles at the same time.
export const WorkflowPermissions = {
  READ: Permissions.PROJECTS_READ,
  MANAGE: Permissions.PROJECTS_MANAGE,
} as const;

export const DefaultRoles = {
  ADMIN: {
    name: "Admin",
    description: "Full access to all workspace settings, members, and data.",
    permissions: Object.values(Permissions),
  },
  DEVELOPER: {
    name: "Developer",
    description: "Can read and write memory and sources, read insights.",
    permissions: [
      Permissions.MEMORY_READ,
      Permissions.MEMORY_WRITE,
      Permissions.SOURCES_READ,
      Permissions.SOURCES_WRITE,
      Permissions.INSIGHTS_READ,
      Permissions.TEAMS_READ,
      Permissions.PROJECTS_READ,
      Permissions.PROJECTS_MANAGE,
    ],
  },
  PRODUCT_MANAGER: {
    name: "Product Manager",
    description: "Can read and write insights, read memory and sources.",
    permissions: [
      Permissions.MEMORY_READ,
      Permissions.INSIGHTS_READ,
      Permissions.INSIGHTS_WRITE,
      Permissions.SOURCES_READ,
      Permissions.TEAMS_READ,
      Permissions.PROJECTS_READ,
      Permissions.PROJECTS_MANAGE,
    ],
  },
  VIEWER: {
    name: "Viewer",
    description: "Can only view memory, insights, and teams.",
    permissions: [
      Permissions.MEMORY_READ,
      Permissions.INSIGHTS_READ,
      Permissions.TEAMS_READ,
      Permissions.SOURCES_READ,
      Permissions.PROJECTS_READ,
    ],
  },
};

/**
 * Creates default roles for a given workspace.
 * Typically called during workspace registration.
 */
export async function createDefaultRolesForWorkspace(workspaceId: string) {
  const rolesData = Object.values(DefaultRoles).map((role) => ({
    workspaceId,
    name: role.name,
    description: role.description,
    permissions: role.permissions,
  }));

  // Prisma createMany is efficient for this
  await prisma.workspaceRole.createMany({
    data: rolesData,
  });

  // Return the created admin role so it can be assigned to the creator
  return prisma.workspaceRole.findFirst({
    where: { workspaceId, name: DefaultRoles.ADMIN.name },
  });
}

/**
 * Validates if an array of permissions includes the required permission.
 */
export function hasPermission(userPermissions: unknown, requiredPermission: Permission): boolean {
  if (!Array.isArray(userPermissions)) return false;
  return userPermissions.includes(requiredPermission);
}

/**
 * Helper to ensure user has ALL required permissions
 */
export function hasAllPermissions(userPermissions: unknown, requiredPermissions: Permission[]): boolean {
  if (!Array.isArray(userPermissions)) return false;
  return requiredPermissions.every(p => userPermissions.includes(p));
}

/**
 * Helper to ensure user has ANY of the required permissions
 */
export function hasAnyPermission(userPermissions: unknown, requiredPermissions: Permission[]): boolean {
  if (!Array.isArray(userPermissions)) return false;
  return requiredPermissions.some(p => userPermissions.includes(p));
}
