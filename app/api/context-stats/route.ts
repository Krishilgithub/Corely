import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { workspace } = await auth();
    const workspaceId = workspace.id;

    const [peopleCount, sourcesCount, sessionsCount, memoriesCount] = await Promise.all([
      prisma.user.count({ where: { workspaceId } }),
      prisma.source.count({ where: { workspaceId } }),
      prisma.chatSession.count({ where: { workspaceId } }),
      prisma.orgMemory.count({ where: { workspaceId } }),
    ]);

    return NextResponse.json({
      people: peopleCount,
      sources: sourcesCount,
      sessions: sessionsCount,
      memories: memoriesCount,
    });
  } catch (error) {
    console.error("Context stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch context stats" },
      { status: 500 }
    );
  }
}
