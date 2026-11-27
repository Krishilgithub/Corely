import { NextRequest } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { generateEmbedding } from "@/lib/embeddings";
import { anthropic } from "@/lib/anthropic";
import { normaliseAnswerModel } from "@/lib/llm-models";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { errorResponse } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { calculateTemporalConfidence } from "@/lib/freshness";
import { trace, context as otelContext, SpanStatusCode, type Span } from "@opentelemetry/api";

// Agent step spans for Omni Studio. ADOT exports them; these give evaluators
// the input and output of each step (turn → retrieve → LLM call).
const tracer = trace.getTracer("corely-ask");

function failSpan(span: Span, err: unknown) {
  span.recordException(err instanceof Error ? err : new Error(String(err)));
  span.setStatus({ code: SpanStatusCode.ERROR });
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
  sessionId: z.string().uuid().optional(),
  /** When set, only this project's documents and memory are used. */
  projectId: z.string().uuid().optional(),
});

// The Claude model the workspace picked in Settings (or the default).
function pickModel(settings: unknown) {
  return normaliseAnswerModel((settings as { defaultLlm?: unknown } | null)?.defaultLlm);
}

const SYSTEM_PROMPT = `You are Corely, an AI institutional memory engine for the organization.
Synthesize a coherent, accurate response ONLY from the provided source context.

CRITICAL INSTRUCTIONS:
1. CITATIONS: You MUST use inline citations for every factual claim you make. Use the format [1], [2], etc., corresponding exactly to the "Source X" numbers provided in the context. Place the citation at the end of the relevant sentence or claim.
2. DECISION RECONSTRUCTION: If the user asks about a decision (e.g., "why was X delayed", "how did we decide"), you must construct a chronological timeline with stakeholder attribution. Clearly state WHO decided WHAT and WHEN.
3. TEMPORAL DECAY: Always note if information is Stale or Aged based on the freshness scores provided.
4. NO HALLUCINATION: If the context does not contain enough information to answer confidently, say so clearly — do NOT fabricate or guess.
5. Format your response in clean Markdown.`;

const REFUSAL_RESPONSE = "I can't help with that request. Try rephrasing your question.";

const NO_KNOWLEDGE_RESPONSE = `I don't have enough information about that in the connected knowledge base.

**What you can try:**
- Connect more data sources (GitHub, Slack, Notion, Google Drive) to give me more context
- Rephrase your question with more specific terms
- Check if the relevant source has been synced recently in **Sources → Configure**

I will never fabricate answers from outside your connected knowledge base.`;

export async function POST(request: NextRequest) {
  let turnSpan: Span | undefined;
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

    const { question, sessionId, projectId } = result.data;
    const workspaceId = workspace.id;
    const model = pickModel(workspace.settings);

    // A chat session can only be used inside its own workspace.
    if (sessionId) {
      const ownSession = await prisma.chatSession.findFirst({ where: { id: sessionId, workspaceId }, select: { id: true } });
      if (!ownSession) return errorResponse("Conversation not found", 404);
    }

    turnSpan = tracer.startSpan("agent.turn", {
      attributes: {
        "openinference.span.kind": "AGENT",
        "input.value": question,
        ...(sessionId ? { "session.id": sessionId } : {}),
      },
    });
    const turnCtx = trace.setSpan(otelContext.active(), turnSpan);

    // Project scope: the project must belong to this workspace.
    const project = projectId
      ? await prisma.project.findFirst({ where: { id: projectId, workspaceId }, select: { id: true, name: true } })
      : null;
    if (projectId && !project) {
      turnSpan.setAttribute("output.value", "Project not found");
      turnSpan.end();
      return errorResponse("Project not found", 404);
    }

    if (sessionId) {
      await prisma.chatMessage.create({
        data: { sessionId, sender: "user", text: question },
      });
    }

    let conversationHistory: Anthropic.Beta.BetaMessageParam[] = [];
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
      // Claude needs the conversation to start with a user message.
      while (conversationHistory[0]?.role === "assistant") conversationHistory.shift();
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

    const retrieveChunks = async () => {
      const queryEmbedding = await generateEmbedding(question);
      const vectorQuery = `[${queryEmbedding.join(",")}]`;

      // Vector search with source_updated_at for correct temporal scoring
      return prisma.$queryRaw<ChunkResult[]>`
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
        ${project
          ? Prisma.sql`AND dc.document_id IN (SELECT document_id FROM document_projects WHERE project_id = ${project.id}::uuid AND status = 'confirmed')`
          : Prisma.empty}
        AND 1 - (dc.embedding <=> ${vectorQuery}::vector) > 0.55
      ORDER BY dc.embedding <=> ${vectorQuery}::vector
      LIMIT 8;
    `;
    };

    const chunks = await tracer.startActiveSpan(
      "agent.retrieve",
      { attributes: { "openinference.span.kind": "RETRIEVER", "input.value": question } },
      turnCtx,
      async (retrieveSpan) => {
        try {
          const found = await retrieveChunks();
          retrieveSpan.setAttribute("retrieval.documents", String(found.length));
          retrieveSpan.setAttribute(
            "output.value",
            JSON.stringify(found.map(c => ({ id: c.id, similarity: Number(c.similarity), content: c.content.slice(0, 500) })))
          );
          return found;
        } catch (err) {
          failSpan(retrieveSpan, err);
          throw err;
        } finally {
          retrieveSpan.end();
        }
      }
    );

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
            const saved = await prisma.chatMessage.create({
              data: { sessionId, sender: "corely", text: noKnowledgeText, sources: [] },
            });
            // Tell the client the saved id so feedback can point at the real message.
            safeEnqueue(`data: ${JSON.stringify({ type: "message_id", id: saved.id })}\n\n`);
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
          turnSpan?.setAttribute("output.value", noKnowledgeText);
          turnSpan?.end();
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

    // 4. REAL STREAMING from the workspace's chosen Claude model
    // Project questions also get the project's recorded decisions, risks and milestones.
    let projectMemoryBlock = "";
    if (project) {
      const memories = await prisma.orgMemory.findMany({
        where: {
          projectId: project.id,
          OR: [{ sourceDocumentId: null }, { sourceDocument: { sourceId: { in: allowedSourceIds } } }],
        },
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        take: 15,
        select: { type: true, title: true, content: true, occurredAt: true, createdAt: true },
      });
      if (memories.length) {
        projectMemoryBlock =
          `Recorded memory for project "${project.name}" (newest first):\n` +
          memories
            .map(m => `- [${m.type ?? "fact"} · ${(m.occurredAt ?? m.createdAt).toISOString().slice(0, 10)}] ${m.title}: ${m.content}`)
            .join("\n") +
          "\n\n---\n\n";
      }
    }

    const userMessage: Anthropic.Beta.BetaMessageParam = {
      role: "user",
      content: `${project ? `The user is asking about the project "${project.name}". Answer about this project only.\n\n` : ""}${projectMemoryBlock}Context from company knowledge base:\n\n${context}\n\n---\n\nQuestion: ${question}`,
    };

    const apiMessages: Anthropic.Beta.BetaMessageParam[] = [...conversationHistory, userMessage];

    const llmSpan = tracer.startSpan(
      "agent.llm_call",
      {
        attributes: {
          "openinference.span.kind": "LLM",
          "llm.model_name": model,
          "input.value": JSON.stringify({ system: SYSTEM_PROMPT, messages: apiMessages }),
        },
      },
      turnCtx
    );

    // Stream from Claude. Thinking is adaptive by default; effort "medium" is
    // set explicitly. On Opus, if Claude declines for safety reasons the API
    // retries the same request on a suitable fallback model ("default").
    const stream = otelContext.with(trace.setSpan(turnCtx, llmSpan), () =>
      anthropic.beta.messages.stream({
        model,
        max_tokens: 64000,
        system: SYSTEM_PROMPT,
        messages: apiMessages,
        output_config: { effort: "medium" },
        ...(model === "claude-opus-5-5"
          ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
          : {}),
      })
    );

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

          // Stream answer text as it arrives from Claude (thinking blocks are not shown)
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              fullAnswer += event.delta.text;
              safeEnqueue(`data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`);
            }
          }
          const final = await stream.finalMessage();
          llmSpan.setAttribute("llm.model_name", final.model);
          // Claude (and any fallback) declined: say so instead of leaving an empty answer.
          if (final.stop_reason === "refusal" && !fullAnswer) {
            fullAnswer = REFUSAL_RESPONSE;
            safeEnqueue(`data: ${JSON.stringify({ type: "text", text: REFUSAL_RESPONSE })}\n\n`);
          }
          llmSpan.setAttribute("output.value", fullAnswer.slice(0, 4000));
          llmSpan.end();

          // Persist the full answer after streaming completes
          if (sessionId && fullAnswer) {
            const saved = await prisma.chatMessage.create({
              data: {
                sessionId,
                sender: "corely",
                text: fullAnswer,
                sources: JSON.parse(JSON.stringify(sources)),
              },
            });
            // Tell the client the saved id so feedback can point at the real message.
            safeEnqueue(`data: ${JSON.stringify({ type: "message_id", id: saved.id })}\n\n`);

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
          if (llmSpan.isRecording()) {
            failSpan(llmSpan, error);
            llmSpan.end();
          }
          if (turnSpan) failSpan(turnSpan, error);
          safeEnqueue(`data: ${JSON.stringify({ type: "error", message: "An error occurred while generating the response." })}\n\n`);
          safeEnqueue("data: [DONE]\n\n");
        } finally {
          try { controller.close(); } catch {}
          turnSpan?.setAttribute("output.value", fullAnswer.slice(0, 4000));
          turnSpan?.end();
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
    if (turnSpan) {
      failSpan(turnSpan, err);
      turnSpan.end();
    }
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
