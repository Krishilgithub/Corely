import { NextRequest } from "next/server";
import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateEmbedding } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(20).optional().default(5),
});

export async function POST(request: NextRequest) {
  try {
    const { workspace } = await auth();

    const body = await request.json();
    const result = searchSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Invalid payload", 400);
    }

    const { query, limit } = result.data;

    const queryEmbedding = await generateEmbedding(query);

    const { data: chunks, error } = await supabaseAdmin.rpc("match_chunks", {
      query_embedding: queryEmbedding,
      workspace_filter: workspace.id,
      match_threshold: 0.5,
      match_count: limit,
    });

    if (error) {
      console.error("pgvector search error:", error);
      return errorResponse("Search failed internally", 500);
    }

    return successResponse({ results: chunks || [] });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("POST /api/search error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
