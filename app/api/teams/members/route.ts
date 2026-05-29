import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sendEmail } from "@/lib/email";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createNotification } from "@/lib/notifications";

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

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 8px;">
        <h2 style="color: #ff6b00;">Welcome to Corely</h2>
        <p>Hi ${name},</p>
        <p>You have been invited to join your team's workspace on Corely.</p>
        <div style="background-color: #f4f4f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #52525b;">Your temporary password is:</p>
          <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; letter-spacing: 2px;">${generatedPassword}</p>
        </div>
        <p>Please login and change your password as soon as possible.</p>
        <a href="http://localhost:3000/login" style="display: inline-block; background-color: #ff6b00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Login to Corely</a>
      </div>
    `;

    await sendEmail(email, "You've been invited to Corely", html);

    // Create a broadcast notification for the workspace that a new member joined
    await createNotification({
      workspaceId: currentUser.workspaceId,
      title: "New Team Member",
      message: `${name} has been invited to join the workspace.`,
      iconType: "UserPlus"
    });

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
