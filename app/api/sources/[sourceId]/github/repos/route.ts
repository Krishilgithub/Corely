import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { decrypt } from "@/lib/crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  try {
    const { sourceId } = await params;
    const { user } = await auth();

    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source || source.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }
    
    if (source.type !== "github" || !source.accessToken) {
      return NextResponse.json({ error: "Invalid source type or no access token" }, { status: 400 });
    }

    const decryptedToken = decrypt(source.accessToken);

    // Fetch user's repositories from GitHub
    const reposRes = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        Authorization: `Bearer ${decryptedToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Corely-App",
      },
    });

    if (!reposRes.ok) {
      const errData = await reposRes.text();
      console.error(`[GitHub Repos API] Error fetching repos: ${errData}`);
      return NextResponse.json({ error: "Failed to fetch repositories from GitHub" }, { status: reposRes.status });
    }

    const reposData = await reposRes.json();
    
    // Map to a simplified format for the frontend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repos = reposData.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      updatedAt: repo.updated_at,
    }));

    return NextResponse.json({ data: repos });
  } catch (error) {
    console.error("[GitHub Repos API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
