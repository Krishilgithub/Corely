import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { cookies } from "next/headers";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      return errorResponse("Invalid email format", 400);
    }

    const { email } = result.data;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
      include: { workspace: true },
    });

    if (!user) {
      // For MVP, auto-provision user and workspace
      const newWorkspace = await prisma.workspace.create({
        data: {
          name: `${email.split("@")[0]}'s Workspace`,
          slug: email.split("@")[1] + "-" + Date.now(),
          plan: "enterprise",
        },
      });

      user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          role: "admin",
          workspaceId: newWorkspace.id,
        },
        include: { workspace: true },
      });
    }

    // Generate JWT
    const token = await encrypt({ 
      userId: user.id,
      email: user.email,
      workspaceId: user.workspaceId 
    });

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("corely_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      workspace: user.workspace,
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Internal server error", 500);
  }
}
