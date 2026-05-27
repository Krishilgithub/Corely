import { NextRequest } from 'next/server';
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const settingsSchema = z.object({
  preferences: z.record(z.string(), z.unknown()).optional(),
  workspaceSettings: z.record(z.string(), z.unknown()).optional(),
  workspaceName: z.string().min(1).optional(),
  workspaceSlug: z.string().min(1).optional(),
});

export async function GET() {
  try {
    const { user, workspace } = await auth();

    return successResponse({
      preferences: user.preferences,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.plan,
        logoUrl: workspace.logoUrl,
        settings: workspace.settings
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/settings error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, workspace } = await auth();
    
    const body = await req.json();
    const result = settingsSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Invalid payload", 400);
    }

    const { preferences, workspaceSettings, workspaceName, workspaceSlug } = result.data;

    // Update User preferences if provided
    if (preferences) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          preferences: {
            ...(typeof user.preferences === 'object' && user.preferences !== null ? user.preferences : {}),
            ...preferences
          } as import("@prisma/client").Prisma.InputJsonValue
        }
      });
    }

    // Update Workspace settings if provided
    if (workspaceSettings || workspaceName || workspaceSlug) {
      const workspaceUpdateData: Record<string, unknown> = {};
      
      if (workspaceSettings) {
        workspaceUpdateData.settings = {
          ...(typeof workspace.settings === 'object' && workspace.settings !== null ? workspace.settings : {}),
          ...workspaceSettings
        } as import("@prisma/client").Prisma.InputJsonValue;
      }
      
      if (workspaceName) workspaceUpdateData.name = workspaceName;
      if (workspaceSlug) workspaceUpdateData.slug = workspaceSlug;

      await prisma.workspace.update({
        where: { id: workspace.id },
        data: workspaceUpdateData
      });
    }

    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("PATCH /api/settings error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
