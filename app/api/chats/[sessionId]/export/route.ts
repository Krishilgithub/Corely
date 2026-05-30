import { NextRequest } from "next/server";
import { auth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/chats/[sessionId]/export
 * Returns a Markdown file with the full conversation transcript.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { workspace } = await auth();
    const { sessionId } = await params;

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, workspaceId: workspace.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) return errorResponse("Session not found", 404);

    const lines: string[] = [
      `# ${session.title}`,
      ``,
      `**Workspace:** ${workspace.name}`,
      `**Exported:** ${new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}`,
      `**Session ID:** ${session.id}`,
      ``,
      `---`,
      ``,
    ];

    for (const msg of session.messages) {
      const sender = msg.sender === "user" ? "**You**" : "**Corely AI**";
      const time = new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      lines.push(`### ${sender} · ${time}`);
      lines.push(``);
      lines.push(msg.text);
      lines.push(``);

      // Append sources if present and is a Corely message
      if (msg.sender === "corely" && msg.sources) {
        const sources = msg.sources as Array<{ title?: string; url?: string; type?: string; confidenceScore?: number }>;
        if (Array.isArray(sources) && sources.length > 0) {
          lines.push(`> **Sources used:** ${sources.map(s => s.title || "Unnamed").join(", ")}`);
          lines.push(``);
        }
      }

      if (msg.feedback) {
        lines.push(`> *Feedback: ${msg.feedback === "up" ? "👍 Helpful" : "👎 Not helpful"}*`);
        lines.push(``);
      }

      lines.push(`---`);
      lines.push(``);
    }

    const markdown = lines.join("\n");
    const filename = `corely-chat-${session.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-")}.md`;

    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
    console.error("GET /api/chats/[sessionId]/export error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
