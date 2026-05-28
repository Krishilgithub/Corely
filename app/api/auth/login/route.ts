import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { cookies } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

// Simple in-memory rate limiter (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      return errorResponse("Invalid email or password format", 400);
    }

    const { email, password } = result.data;
    
    // Rate Limiting Logic
    const identifier = email.toLowerCase();
    const now = Date.now();
    const record = rateLimitMap.get(identifier);

    if (record) {
      if (now - record.timestamp < RATE_LIMIT_WINDOW_MS) {
        if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) {
          return errorResponse("Too many login attempts. Please try again later.", 429);
        }
      } else {
        rateLimitMap.delete(identifier);
      }
    }

    const incrementRateLimit = () => {
      const current = rateLimitMap.get(identifier);
      if (current) {
        current.count += 1;
        rateLimitMap.set(identifier, current);
      } else {
        rateLimitMap.set(identifier, { count: 1, timestamp: now });
      }
    };

    const clearRateLimit = () => {
      rateLimitMap.delete(identifier);
    };

    let user = await prisma.user.findUnique({
      where: { email },
      include: { workspace: true, workspaceRole: true },
    });

    if (!user) {
      incrementRateLimit();
      return errorResponse("Invalid credentials", 401);
    }

    // MVP Legacy Migration Logic: 
    // If a user exists but doesn't have a passwordHash yet, we seamlessly assign the 
    // provided password as their new hashed password to allow them in.
    if (!user.passwordHash) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.update({
        where: { email },
        data: { passwordHash: hashedPassword },
        include: { workspace: true, workspaceRole: true },
      });
    } else {
      // Verify standard password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        incrementRateLimit();
        return errorResponse("Invalid credentials", 401);
      }
    }

    clearRateLimit(); // Login successful, clear attempts

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
        roleId: user.roleId,
        roleName: user.workspaceRole?.name || (user.role === "admin" ? "Admin" : "Member"),
        permissions: user.workspaceRole?.permissions || [],
      },
      workspace: user.workspace,
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Internal server error", 500);
  }
}
