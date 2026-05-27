import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const secretKey = process.env.JWT_SECRET || "fallback-secret-for-development-only";
const key = new TextEncoder().encode(secretKey);

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

export async function auth() {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { workspace: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return { user, workspace: user.workspace };
}
