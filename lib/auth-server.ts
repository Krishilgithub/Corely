import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { Permission, hasPermission } from "./rbac";

// The JWT secret signs and checks every login cookie (and OAuth state tokens).
// A fixed fallback in production would let anyone who has read this code forge
// a login for any user. So in production the server refuses to start without it.
const DEV_ONLY_SECRET = "dev-only-insecure-jwt-secret-do-not-use-in-production";
const isProduction = process.env.NODE_ENV === "production";
// `next build` also runs with NODE_ENV=production and loads this file, but it
// never signs or checks a cookie. Skip the check there so a build machine does
// not need the secret. The running server still checks.
const isBuildStep = process.env.NEXT_PHASE === "phase-production-build";

if (!process.env.JWT_SECRET) {
  if (isProduction && !isBuildStep) {
    throw new Error("JWT_SECRET is not set. Corely will not start in production without it.");
  }
  if (!isProduction) {
    console.warn("[auth] JWT_SECRET is not set. Using an insecure development-only secret.");
  }
}

const key = new TextEncoder().encode(process.env.JWT_SECRET || DEV_ONLY_SECRET);

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  workspaceId: string;
}

export async function encrypt(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function decrypt(input: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("corely_session")?.value;
  if (!session) return null;

  try {
    const parsed = await decrypt(session);
    // Validate required fields
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.workspaceId !== "string"
    ) {
      return null;
    }
    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

// Dev-only: lets local tools (like Omni Studio test requests) call the API
// without a login cookie. Only active when NODE_ENV is "development" and
// OMNI_DEV_USER_ID is set. A real cookie always wins.
function devBypassUserId(): string | null {
  if (process.env.NODE_ENV !== "development") return null;
  return process.env.OMNI_DEV_USER_ID || null;
}

export async function auth() {
  const cookieSession = await getSession();
  const devUserId = cookieSession ? null : devBypassUserId();
  const session = cookieSession ?? (devUserId ? { userId: devUserId } : null);
  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { workspace: true, workspaceRole: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Auto-heal: if admin user has no roleId, assign the Admin workspace role
  if (user.role === "admin" && !user.roleId) {
    const adminRole = await prisma.workspaceRole.findFirst({
      where: { workspaceId: user.workspaceId, name: "Admin" },
    });
    if (adminRole) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: adminRole.id },
      });
      user.roleId = adminRole.id;
      user.workspaceRole = adminRole;
    }
  }

  return { user, workspace: user.workspace };
}

export async function requirePermission(permission: Permission) {
  const { user } = await auth();
  
  if (!user.workspaceRole || !hasPermission(user.workspaceRole.permissions, permission)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
  
  return user;
}
