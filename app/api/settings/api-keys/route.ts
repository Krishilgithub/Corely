import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { workspace } = await auth();
    
    const apiKeys = await prisma.apiKey.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    });

    const formattedKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      prefix: key.hint,
      createdAt: new Date(key.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      lastUsed: key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null,
      scopes: ["read", "write"],
    }));

    return successResponse({ apiKeys: formattedKeys });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET api keys error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspace } = await auth();
    const body = await request.json();
    const name = body.name || "API Key";

    const rawKey = `crl_live_${crypto.randomBytes(32).toString("hex")}`;
    const prefix = rawKey.slice(0, 16) + "...";
    
    // Hash the key for secure storage
    const keyHash = await bcrypt.hash(rawKey, 10);

    const apiKey = await prisma.apiKey.create({
      data: {
        workspaceId: workspace.id,
        name: name,
        keyHash: keyHash,
        hint: prefix,
      },
    });

    return successResponse({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.hint,
        createdAt: new Date(apiKey.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        lastUsed: null,
        scopes: ["read", "write"],
      },
      rawKey: rawKey, // Only returned once!
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST api keys error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { workspace } = await auth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return errorResponse("Missing ID", 400);

    await prisma.apiKey.deleteMany({
      where: {
        id: id,
        workspaceId: workspace.id,
      },
    });

    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("DELETE api keys error:", error);
    return errorResponse("Internal server error", 500);
  }
}
