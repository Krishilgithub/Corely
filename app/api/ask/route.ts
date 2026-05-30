import { NextRequest } from "next/server";
import { openai, generateEmbedding } from "@/lib/openai";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { errorResponse } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { Prisma } from "@prisma/client";

interface ChatCompletionMessageParam {
  role: "system" | "user" | "assistant";
  content: string;
}

export const dynamic = "force-dynamic";

interface ChunkResult {
  id: string;
  content: string;
  document_id: string;
  source_id: string;
  metadata: Record<string, unknown>;
  source_updated_at: Date | null;
  created_at: Date;
  similarity: number;
}

const askSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
  workspaceId: z.string().optional(),
  sessionId: z.string().optional(),
});

/**
 * Temporal confidence using the document's source_updated_at (actual content date)
 * falling back to chunk created_at. Content-type-aware decay rates.
 */
function calculateTemporalConfidence(
  sourceUpdatedAt: Date | null,
  createdAt: Date,
  sourceType?: string
): { score: number; label: "Fresh" | "Stale" | "Aged" } {
  const referenceDate = sourceUpdatedAt ?? createdAt;
  const ageInDays = (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);

  // Content-type-aware decay rates
  let decayRate = 0.5; // Default: 0.5 pts/day → 200 days to zero
  if (sourceType === "slack_channel") decayRate = 2.0;      // Slack is highly ephemeral
  else if (sourceType === "github_issue" || sourceType === "github_pr") decayRate = 0.3;
  else if (sourceType === "notion_page" || sourceType === "google_doc") decayRate = 0.2;
  else if (sourceType === "linear_issue") decayRate = 0.4;

  let score = 100 - (ageInDays * decayRate);
  if (score < 0) score = 0;

  let label: "Fresh" | "Stale" | "Aged" = "Fresh";
  if (score < 50) label = "Stale";
  else if (score < 80) label = "Aged";

  return { score: Math.round(score), label };
}

const NO_KNOWLEDGE_RESPONSE = `I don't have enough information about that in the connected knowledge base.

**What you can try:**
- Connect more data sources (GitHub, Slack, Notion, Google Drive) to give me more context
- Rephrase your question with more specific terms
- Check if the relevant source has been synced recently in **Sources → Configure**

I will never fabricate answers from outside your connected knowledge base.`;

export async function POST(request: NextRequest) {
  try {
    const { user, workspace } = await auth();

    // Raised from 5 to 20 req/min for better usability
    const rl = await rateLimit(user.id, 20, 60);
    if (!rl.success) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Rate limit exceeded. Please wait a moment before asking again." })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      });
      return new Response(readable, {
        status: 429,
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    const body = await request.json();
    const result = askSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Invalid payload", 400);
    }

    const { question, sessionId } = result.data;
    const workspaceId = workspace.id;

    if (sessionId) {
      await prisma.chatMessage.create({
        data: { sessionId, sender: "user", text: question },
      });
    }

    let conversationHistory: ChatCompletionMessageParam[] = [];
    if (sessionId) {
      const history = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: "desc" },
        take: 6,
      });
      history.reverse();
      conversationHistory = history
        .filter((msg) => msg.text !== question)
        .map((msg) => ({
          role: (msg.sender === "user" ? "user" : "assistant") as "user" | "assistant",
          content: msg.text,
        }));
    }

    // 1. PERMISSION-AWARE RETRIEVAL LAYER
    // Query sources the user owns OR sources explicitly shared with everyone in the workspace
    const userSources = await prisma.source.findMany({
      where: { workspaceId, userId: user.id },
      select: { id: true },
    });

    const sharedSources = await prisma.source.findMany({
      where: {
        workspaceId,
        config: { path: ["permissions"], equals: "everyone" }
      },
      select: { id: true },
    });

    const allowedSourceIdSet = new Set([
      ...userSources.map(s => s.id),
      ...sharedSources.map(s => s.id),
    ]);

    // If user is admin, they can query all workspace sources
    if (user.role === "admin" || (user.workspaceRole?.permissions as string[] | undefined)?.includes("sources:read")) {
      const allSources = await prisma.source.findMany({
        where: { workspaceId },
        select: { id: true },
      });
      allSources.forEach(s => allowedSourceIdSet.add(s.id));
    }

    const allowedSourceIds = allowedSourceIdSet.size > 0
      ? Array.from(allowedSourceIdSet)
      : ["00000000-0000-0000-0000-000000000000"];

    const queryEmbedding = await generateEmbedding(question);
    const vectorQuery = `[${queryEmbedding.join(",")}]`;

    // Vector search with source_updated_at for correct temporal scoring
    const chunks = await prisma.$queryRaw<ChunkResult[]>`
      SELECT 
        dc.id,
        dc.content,
        dc.document_id,
        dc.source_id,
        dc.metadata,
        dc.created_at,
        d.updated_at as source_updated_at,
        1 - (dc.embedding <=> ${vectorQuery}::vector) as similarity
      FROM document_chunks dc
      LEFT JOIN documents d ON d.id = dc.document_id
      WHERE dc.workspace_id = ${workspaceId}::uuid
        AND dc.source_id::text IN (${Prisma.join(allowedSourceIds)})
        AND 1 - (dc.embedding <=> ${vectorQuery}::vector) > 0.55
      ORDER BY dc.embedding <=> ${vectorQuery}::vector
      LIMIT 8;
    `;

    // 2. HALLUCINATION PREVENTION — if no relevant chunks found, return safe response
    if (chunks.length === 0) {
      const encoder = new TextEncoder();
      const noKnowledgeText = NO_KNOWLEDGE_RESPONSE;
      const readable = new ReadableStream({
        async start(controller) {
          const safeEnqueue = (data: string) => {
            try { controller.enqueue(encoder.encode(data)); } catch {}
          };
          safeEnqueue(`data: ${JSON.stringify({ type: "sources", sources: [] })}\n\n`);
          safeEnqueue(`data: ${JSON.stringify({ type: "no_knowledge", text: noKnowledgeText })}\n\n`);

          if (sessionId) {
            await prisma.chatMessage.create({
              data: { sessionId, sender: "corely", text: noKnowledgeText, sources: [] },
            });
            const session = await prisma.chatSession.findUnique({
              where: { id: sessionId }, select: { title: true },
            });
            if (session?.title === "New Conversation") {
              await prisma.chatSession.update({
                where: { id: sessionId },
                data: { title: question.slice(0, 40) + (question.length > 40 ? "..." : "") },
              });
            }
          }

          safeEnqueue("data: [DONE]\n\n");
          try { controller.close(); } catch {}
        }
      });
      return new Response(readable, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
      });
    }

    // 3. TEMPORAL CONFIDENCE SCORING (using actual document dates)
    const context = chunks
      .map((c, i) => {
        const meta = c.metadata as Record<string, unknown>;
        const sourceType = meta?.file_type as string | undefined ?? meta?.source_type as string | undefined;
        const confidence = calculateTemporalConfidence(
          c.source_updated_at ? new Date(c.source_updated_at) : null,
          new Date(c.created_at),
          sourceType
        );
        return `[Source ${i + 1}: ${meta?.document_title ?? "Unnamed"} | Type: ${sourceType ?? "document"} | Freshness: ${confidence.label} (${confidence.score}%)]
${c.content}`;
      })
      .join("\n\n---\n\n");

    const sources = chunks.map((c) => {
      const meta = c.metadata as Record<string, unknown>;
      const sourceType = meta?.file_type as string | undefined ?? meta?.source_type as string | undefined;
      const confidence = calculateTemporalConfidence(
        c.source_updated_at ? new Date(c.source_updated_at) : null,
        new Date(c.created_at),
        sourceType
      );
      return {
        title: meta?.document_title ?? "Unnamed",
        url: meta?.url ?? null,
        type: sourceType ?? "knowledge",
        confidenceScore: confidence.score,
        confidenceLabel: confidence.label,
      };
    });

    // 4. REAL STREAMING via GPT-4o stream mode
    const systemInstruction: ChatCompletionMessageParam = {
      role: "system",
      content: `You are Corely, an AI institutional memory engine for the organization.
Synthesize a coherent, accurate response ONLY from the provided source context.
If the query asks about a decision (e.g., "why was X delayed"), construct a timeline with stakeholder attribution.
Always note if information is Stale or Aged based on the freshness scores provided.
If the context does not contain enough information to answer confidently, say so clearly — do NOT fabricate or guess.
Format your response in clean Markdown.`,
    };

    const userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: `Context from company knowledge base:\n\n${context}\n\n---\n\nQuestion: ${question}`,
    };

    const apiMessages = [
      systemInstruction,
      ...conversationHistory,
      userMessage,
    ] as ChatCompletionMessageParam[];

    // Real streaming from OpenAI
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: apiMessages,
      temperature: 0.2,
      stream: true,
      max_tokens: 1500,
    });

    const encoder = new TextEncoder();
    let fullAnswer = "";

    const readable = new ReadableStream({
      async start(controller) {
        const safeEnqueue = (data: string) => {
          try { controller.enqueue(encoder.encode(data)); } catch {}
        };

        try {
          // Send sources first
          safeEnqueue(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`);

          // Stream tokens as they arrive from OpenAI
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              fullAnswer += delta;
              safeEnqueue(`data: ${JSON.stringify({ type: "text", text: delta })}\n\n`);
            }
          }

          // Persist the full answer after streaming completes
          if (sessionId && fullAnswer) {
            await prisma.chatMessage.create({
              data: {
                sessionId,
                sender: "corely",
                text: fullAnswer,
                sources: JSON.parse(JSON.stringify(sources)),
              },
            });

            const session = await prisma.chatSession.findUnique({
              where: { id: sessionId },
              select: { title: true },
            });
            if (session?.title === "New Conversation") {
              await prisma.chatSession.update({
                where: { id: sessionId },
                data: { title: question.slice(0, 40) + (question.length > 40 ? "..." : "") },
              });
            } else {
              await prisma.chatSession.update({
                where: { id: sessionId },
                data: { updatedAt: new Date() },
              });
            }
          }

          safeEnqueue("data: [DONE]\n\n");
        } catch (error) {
          console.error("Streaming error:", error);
          safeEnqueue(`data: ${JSON.stringify({ type: "error", message: "An error occurred while generating the response." })}\n\n`);
          safeEnqueue("data: [DONE]\n\n");
        } finally {
          try { controller.close(); } catch {}
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Ask API] ❌ Error:", errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
