import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { cookies } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      return errorResponse("Invalid input formatting", 400);
    }

    const { name, company, email, password } = result.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse("Account with this email already exists", 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate a unique slug for the workspace based on the company name
    const baseSlug = company.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    // Create Workspace and User in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: company,
          slug: slug,
          plan: "trial", // Initial trial plan
        },
      });

      const newUser = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: "admin",
          workspaceId: workspace.id,
        },
        include: { workspace: true },
      });

      return newUser;
    });

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
    console.error("Registration error:", error);
    return errorResponse("Internal server error", 500);
  }
}
