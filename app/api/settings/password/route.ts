import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import bcrypt from "bcryptjs";
import { z } from "zod";

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const { user } = await auth();

    const body = await req.json();
    const result = passwordSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Invalid payload", 400);
    }

    const { currentPassword, newPassword } = result.data;

    // Verify current password
    if (!user.passwordHash) {
      return errorResponse("No password is set for this account (e.g. registered via OAuth). Cannot change password.", 400);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return errorResponse("Current password is incorrect.", 400);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedNewPassword },
    });

    return successResponse({ success: true, message: "Password updated successfully" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/settings/password error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
