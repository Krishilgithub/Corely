import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // We are simulating a logged-in user with a hardcoded workspace for now
    // In a real app, you would use getServerSession or similar auth mechanism
    
    // First let's find the first user in the db, since we don't have auth
    const user = await prisma.user.findFirst({
      include: {
        workspace: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    return NextResponse.json({
      preferences: user.preferences,
      workspace: {
        id: user.workspace.id,
        name: user.workspace.name,
        slug: user.workspace.slug,
        plan: user.workspace.plan,
        logoUrl: user.workspace.logoUrl,
        settings: user.workspace.settings
      }
    });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { preferences, workspaceSettings, workspaceName, workspaceSlug } = body;

    const user = await prisma.user.findFirst({
      include: {
        workspace: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    // Update User preferences if provided
    if (preferences) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          preferences: {
            ...(user.preferences as object),
            ...preferences
          }
        }
      });
    }

    // Update Workspace settings if provided
    if (workspaceSettings || workspaceName || workspaceSlug) {
      const workspaceUpdateData: Record<string, unknown> = {};
      
      if (workspaceSettings) {
        workspaceUpdateData.settings = {
          ...(user.workspace.settings as object),
          ...workspaceSettings
        };
      }
      
      if (workspaceName) workspaceUpdateData.name = workspaceName;
      if (workspaceSlug) workspaceUpdateData.slug = workspaceSlug;

      await prisma.workspace.update({
        where: { id: user.workspace.id },
        data: workspaceUpdateData
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
