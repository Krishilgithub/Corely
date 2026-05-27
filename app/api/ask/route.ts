import { NextRequest } from "next/server";
import { openai, generateEmbedding } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/db";


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
  metadata?: {
    document_title?: string;
    url?: string;
    source_type?: string;
  };
  similarity: number;
}

export async function POST(request: NextRequest) {
  try {
    const { question, workspaceId, sessionId } = await request.json();

    if (!question || !workspaceId) {
      return new Response("Missing question or workspaceId", { status: 400 });
    }

    // 1. If sessionId is active, save the user message to database
    if (sessionId) {
      await prisma.chatMessage.create({
        data: {
          sessionId,
          sender: "user",
          text: question,
        },
      });
    }

    // 2. Fetch last 5 conversation history messages if sessionId is present to provide chat context
    let conversationHistory: ChatCompletionMessageParam[] = [];
    if (sessionId) {
      const history = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: "desc" },
        take: 6, // User message is already saved above, get previous 5 + current user message
      });
      
      // Reverse history to chronological order (oldest first)
      history.reverse();
      
      // Map history to ChatGPT messages format (exclude the current user message to avoid duplicate addition)
      conversationHistory = history
        .filter((msg: { text: string; sender: string }) => msg.text !== question)
        .map((msg: { text: string; sender: string }) => ({
          role: (msg.sender === "user" ? "user" : "assistant") as "user" | "assistant",
          content: msg.text,
        }));
    }

    // 3. Embed the user's question
    const queryEmbedding = await generateEmbedding(question);

    // 4. Semantic search via pgvector similarity
    const { data: chunks, error } = await supabaseAdmin.rpc("match_chunks", {
      query_embedding: queryEmbedding,
      workspace_filter: workspaceId,
      match_threshold: 0.65,
      match_count: 6,
    });

    if (error) {
      console.error("pgvector search error:", error);
      return new Response(`Search failed: ${error.message}`, { status: 500 });
    }

    const chunkResults = (chunks ?? []) as ChunkResult[];

    // 5. Build context from retrieved chunks
    const context = chunkResults
      .map((c, i: number) =>
        `[Source ${i + 1}: ${c.metadata?.document_title ?? "Unnamed"}]\n${c.content}`
      )
      .join("\n\n---\n\n");

    const sources = chunkResults.map((c) => ({
      title: c.metadata?.document_title ?? "Unnamed",
      url: c.metadata?.url ?? null,
      type: c.metadata?.source_type ?? "google_drive",
    }));

    // 6. Build the LLM messages sequence
    const systemInstruction = {
      role: "system",
      content: `You are Corely, an AI assistant with deep knowledge of this company's data.
Answer questions based ONLY on the provided context. Be concise, professional, and specific.
If the context doesn't contain the answer, say so honestly. Do not make up facts.
Always cite which sources your answer is based on.`,
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

    // 7. Stream the AI response using GPT-4o mini
    const responseStream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: apiMessages,
      temperature: 0.3,
      max_tokens: 1000,
    });

    // 8. Stream the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let accumulatedText = "";
        const safeEnqueue = (data: string) => {
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            // ignore closed or aborted states
          }
        };

        try {
          // First, send the sources metadata as a special chunk
          safeEnqueue(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`);

          for await (const chunk of responseStream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              accumulatedText += text;
              safeEnqueue(`data: ${JSON.stringify({ type: "text", text })}\n\n`);
            }
          }

          // If sessionId is active, persist the generated Corely response to DB
          if (sessionId) {
            await prisma.chatMessage.create({
              data: {
                sessionId,
                sender: "corely",
                text: accumulatedText,
                // JSON.parse(JSON.stringify(...)) produces a plain value that
                // satisfies Prisma's InputJsonValue without importing the Prisma namespace
                sources: JSON.parse(JSON.stringify(sources)),
              },
            });

            // Update chat session title if it is "New Conversation"
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
              // Touch updatedAt time
              await prisma.chatSession.update({
                where: { id: sessionId },
                data: { updatedAt: new Date() },
              });
            }
          }

          safeEnqueue("data: [DONE]\n\n");
        } catch (err) {
          console.error("Streaming error:", err);
        } finally {
          try {
            controller.close();
          } catch {
            // ignore already closed stream
          }
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

