"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, ExternalLink, Loader2, MessageSquare } from "lucide-react";
import CorelyLogo from "@/components/icons/corely-logo";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

type Source = { title: string; url: string | null; type: string; confidenceScore: number; confidenceLabel: "Fresh" | "Aged" | "Stale" };
type Turn = { role: "user" | "corely"; text: string; sources?: Source[]; pending?: boolean; notice?: boolean };

const FRESH_TONE = { Fresh: "success", Aged: "warning", Stale: "error" } as const;

/** Ask Corely, limited to one project's documents and memory. */
export default function ProjectAsk({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    `What are the main decisions on ${projectName} so far?`,
    `What risks or blockers does ${projectName} have?`,
    `What changed on ${projectName} in the last two weeks?`,
  ];

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    setTurns(t => [...t, { role: "user", text: q }, { role: "corely", text: "", pending: true }]);
    const update = (patch: Partial<Turn>) =>
      setTurns(t => t.map((turn, i) => (i === t.length - 1 ? { ...turn, ...patch } : turn)));

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, projectId }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Corely could not answer right now");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const ev = JSON.parse(payload);
            if (ev.type === "sources") update({ sources: ev.sources });
            else if (ev.type === "text") { text += ev.text ?? ""; update({ text, pending: false }); }
            else if (ev.type === "no_knowledge") update({ text: ev.text, pending: false, notice: true });
            else if (ev.type === "error") throw new Error(ev.error || ev.message || "Corely could not answer");
          } catch (err) {
            if (err instanceof SyntaxError) continue;
            throw err;
          }
        }
      }
      update({ pending: false });
    } catch (err) {
      update({ text: err instanceof Error ? err.message : "Corely could not answer right now", pending: false, notice: true });
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    }
  };

  return (
    <div className="ui-card pj-ask">
      <div className="pj-ask__thread">
        {turns.length === 0 ? (
          <EmptyState
            icon={<MessageSquare />}
            title={`Ask about ${projectName}`}
            description="Answers use only this project's documents and memory, with sources and how fresh they are."
            action={
              <div className="pj-ask__suggestions">
                {suggestions.map(s => (
                  <button key={s} type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => ask(s)}>{s}</button>
                ))}
              </div>
            }
          />
        ) : (
          turns.map((t, i) =>
            t.role === "user" ? (
              <div key={i} className="pj-ask__user">{t.text}</div>
            ) : (
              <div key={i} className="pj-ask__answer">
                <span className="db-logo-tile" aria-hidden="true"><CorelyLogo size={16} /></span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {t.pending ? (
                    <div className="pj-stack" aria-label="Corely is thinking">
                      <div className="ui-skeleton" style={{ height: 12, width: "70%" }} />
                      <div className="ui-skeleton" style={{ height: 12, width: "45%" }} />
                    </div>
                  ) : (
                    <div className={`ac-md ${t.notice ? "pj-ask__notice" : ""}`}><ReactMarkdown>{t.text}</ReactMarkdown></div>
                  )}
                  {t.sources && t.sources.length > 0 && !t.pending && (
                    <div className="pj-ask__sources">
                      {t.sources.map((s, j) => (
                        <a key={j} className="pj-source-chip" href={s.url ?? undefined} target="_blank" rel="noreferrer" aria-disabled={!s.url}>
                          <b>{j + 1}</b> {s.title}
                          <StatusBadge tone={FRESH_TONE[s.confidenceLabel]}>{s.confidenceLabel}</StatusBadge>
                          {s.url && <ExternalLink size={11} />}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )
        )}
        <div ref={endRef} />
      </div>
      <form className="pj-ask__composer" onSubmit={e => { e.preventDefault(); ask(input); }}>
        <textarea
          className="ui-input"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }}
          placeholder={`Ask anything about ${projectName}`}
          aria-label="Question"
        />
        <button type="submit" className="ui-btn ui-btn--primary" disabled={busy || !input.trim()} aria-label="Send">
          {busy ? <Loader2 className="animate-spin" /> : <ArrowUp />}
        </button>
      </form>
    </div>
  );
}
