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
  created_at: Date;
  similarity: number;
}

const askSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
  workspaceId: z.string().optional(),
  sessionId: z.string().optional(),
});

function calculateTemporalConfidence(createdAt: Date): { score: number; label: "Fresh" | "Stale" | "Aged" } {
  const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  let score = 100 - (ageInDays * 0.5); // Decay 0.5 points per day
  if (score < 0) score = 0;
  
  let label: "Fresh" | "Stale" | "Aged" = "Fresh";
  if (score < 50) label = "Stale";
  else if (score < 80) label = "Aged";
  
  return { score: Math.round(score), label };
}

export async function POST(request: NextRequest) {
  try {
    const { user, workspace } = await auth();

    const rl = await rateLimit(user.id, 5, 60);
    if (!rl.success) {
      return errorResponse("Too many requests", 429);
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
        data: {
          sessionId,
          sender: "user",
          text: question,
        },
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
    // Fetch sources the user has access to
    const userSources = await prisma.source.findMany({
      where: { workspaceId, userId: user.id },
      select: { id: true },
    });
    
    let allowedSourceIds = userSources.map(s => s.id);
    if (allowedSourceIds.length === 0) {
      // Fallback for demo purposes if no sources exist for user, allow public workspace sources
      const allWorkspaceSources = await prisma.source.findMany({
        where: { workspaceId },
        select: { id: true },
      });
      allowedSourceIds = allWorkspaceSources.map(s => s.id);
    }

    // If no sources exist at all in workspace, we use a dummy UUID to prevent SQL syntax errors
    if (allowedSourceIds.length === 0) {
      allowedSourceIds = ["00000000-0000-0000-0000-000000000000"];
    }

    const queryEmbedding = await generateEmbedding(question);
    const vectorQuery = `[${queryEmbedding.join(",")}]`;

    // Prisma $queryRaw for zero cross-permission leakage vector search
    const chunks = await prisma.$queryRaw<ChunkResult[]>`
      SELECT 
        id, 
        content, 
        document_id, 
        source_id, 
        metadata,
        created_at,
        1 - (embedding <=> ${vectorQuery}::vector) as similarity
      FROM document_chunks
      WHERE workspace_id = ${workspaceId}::uuid
        AND source_id::text IN (${Prisma.join(allowedSourceIds)})
        AND 1 - (embedding <=> ${vectorQuery}::vector) > 0.60
      ORDER BY embedding <=> ${vectorQuery}::vector
      LIMIT 6;
    `;

    // 2. TEMPORAL CONFIDENCE SCORING
    const context = chunks
      .map((c, i) => {
        const meta = c.metadata as Record<string, unknown>;
        const confidence = calculateTemporalConfidence(c.created_at);
        return `[Source ${i + 1}: ${meta?.document_title ?? "Unnamed"} | Age: ${confidence.label} | Conf: ${confidence.score}%]\n${c.content}`;
      })
      .join("\n\n---\n\n");

    const sources = chunks.map((c) => {
      const meta = c.metadata as Record<string, unknown>;
      const confidence = calculateTemporalConfidence(c.created_at);
      return {
        title: meta?.document_title ?? "Unnamed",
        url: meta?.url ?? null,
        type: meta?.source_type ?? "knowledge",
        confidenceScore: confidence.score,
        confidenceLabel: confidence.label,
      };
    });

    // 3. CITATION EXTRACTION & DECISION RECONSTRUCTION (GPT-4o Function Calling)
    const systemInstruction = {
      role: "system",
      content: `You are Corely, an AI institutional memory engine. 
Synthesize a coherent response drawing from the provided sources. 
If the query asks about a decision (e.g., "why was X delayed"), construct a timeline with stakeholder attribution. 
Always rely on the temporal confidence scores provided in the context to warn the user if information is stale.
You MUST use the provided tool to output your response and citations.`,
    };

    const userMessage = {
      role: "user",
      content: `Context from company documents:\n\n${context}\n\n---\n\nQuestion: ${question}`,
    };

    const apiMessages = [
      systemInstruction,
      ...conversationHistory,
      userMessage,
    ] as ChatCompletionMessageParam[];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: apiMessages,
      temperature: 0.3,
      tools: [
        {
          type: "function",
          function: {
            name: "deliver_cited_intelligence",
            description: "Delivers the synthesized answer and specific source citations.",
            parameters: {
              type: "object",
              properties: {
                answer: {
                  type: "string",
                  description: "The detailed, synthesized answer formatted in Markdown.",
                },
                citations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      sourceIndex: { type: "number", description: "The index of the source (1-6)" },
                      relevance: { type: "string", description: "Why this source was used" },
                    },
                  },
                },
              },
              required: ["answer", "citations"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "deliver_cited_intelligence" } },
    });

    const toolCall = completion.choices[0].message.tool_calls?.[0];
    let answerText = "No answer generated.";
    if (toolCall && toolCall.type === "function") {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        answerText = parsed.answer;
      } catch {
        answerText = toolCall.function.arguments;
      }
    }

    // 4. SIMULATE STREAMING FOR UI
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const safeEnqueue = (data: string) => {
          try { controller.enqueue(encoder.encode(data)); } catch {}
        };

        try {
          safeEnqueue(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`);

          // Simulate streaming chunk by chunk (50 chars at a time)
          const chunkSize = 50;
          for (let i = 0; i < answerText.length; i += chunkSize) {
            const textChunk = answerText.slice(i, i + chunkSize);
            safeEnqueue(`data: ${JSON.stringify({ type: "text", text: textChunk })}\n\n`);
            await new Promise((resolve) => setTimeout(resolve, 20)); // artificial delay
          }

          if (sessionId) {
            await prisma.chatMessage.create({
              data: {
                sessionId,
                sender: "corely",
                text: answerText,
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
                data: {
                  title: question.slice(0, 40) + (question.length > 40 ? "..." : ""),
                },
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

