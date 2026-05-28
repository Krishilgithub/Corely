import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const onboardSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, "Name is required"),
  roleId: z.string().uuid("Invalid Role ID"),
  teamIds: z.array(z.string().uuid()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // RBAC Check: Only users with TEAMS_MANAGE can onboard new members
    const currentUser = await requirePermission(Permissions.TEAMS_MANAGE);

    const body = await request.json();
    const result = onboardSchema.safeParse(body);
    
    if (!result.success) {
      return errorResponse("Invalid input formatting", 400);
    }

    const { email, name, roleId, teamIds } = result.data;

    // Verify role belongs to this workspace
    const role = await prisma.workspaceRole.findUnique({
      where: { id: roleId },
    });

    if (!role || role.workspaceId !== currentUser.workspaceId) {
      return errorResponse("Invalid Role", 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse("User with this email already exists", 409);
    }

    // Generate secure random password
    const generatedPassword = crypto.randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(generatedPassword, 10);

    // Create user and connect to teams
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "member", // Legacy field, keeping for fallback
        roleId: roleId,
        workspaceId: currentUser.workspaceId,
        teams: teamIds && teamIds.length > 0 ? {
          connect: teamIds.map(id => ({ id }))
        } : undefined,
      },
      include: { workspaceRole: true, teams: true },
    });

    // --- MOCK EMAIL SENDING ---
    console.log("===================================================");
    console.log(`[MOCK EMAIL] To: ${email}`);
    console.log(`[MOCK EMAIL] Subject: You've been invited to Corely`);
    console.log(`[MOCK EMAIL] Body: Hi ${name}, you have been invited to join your team's workspace!`);
    console.log(`[MOCK EMAIL] Your temporary password is: ${generatedPassword}`);
    console.log(`[MOCK EMAIL] Please login at http://localhost:3000/login`);
    console.log("===================================================");
    // --------------------------

    return successResponse({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        roleId: newUser.roleId,
        roleName: newUser.workspaceRole?.name,
        teams: newUser.teams.map(t => t.name),
      },
      // Passing password back for development convenience, normally NEVER do this!
      _devPassword: generatedPassword, 
    });

  } catch (error) {
    console.error("Onboarding error:", error);
    if (error instanceof Error && error.message === "Forbidden: Insufficient permissions") {
      return errorResponse(error.message, 403);
    }
    return errorResponse("Internal server error", 500);
  }
}
