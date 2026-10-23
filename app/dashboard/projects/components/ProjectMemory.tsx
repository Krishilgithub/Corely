"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle, Brain, CheckCircle2, ExternalLink, Flag, HelpCircle, Info, Loader2, Plus, RefreshCw, Sparkles, Trash2, X,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { SourceLogo } from "@/components/ui/source-logo";
import { SOURCE_LABEL } from "../types";

type MemoryType = "decision" | "risk" | "milestone" | "question" | "fact";
type Memory = {
  id: string;
  type: MemoryType;
  title: string;
  content: string;
  occurredAt: string;
  confidence: number | null;
  manual: boolean;
  freshness: { score: number; label: "Fresh" | "Aged" | "Stale" };
  source: { documentId: string | null; title: string | null; url: string | null; type: string; name: string };
};

export const MEMORY_META: Record<MemoryType, { label: string; plural: string; icon: typeof Flag }> = {
  decision: { label: "Decision", plural: "Decisions", icon: CheckCircle2 },
  risk: { label: "Risk", plural: "Risks", icon: AlertTriangle },
  milestone: { label: "Milestone", plural: "Milestones", icon: Flag },
  question: { label: "Open question", plural: "Questions", icon: HelpCircle },
  fact: { label: "Fact", plural: "Facts", icon: Info },
};

const FRESH_TONE = { Fresh: "success", Aged: "warning", Stale: "error" } as const;

type Props = { projectId: string; canManage: boolean; onChanged: () => void };

export default function ProjectMemory({ projectId, canManage, onChanged }: Props) {
  const [type, setType] = useState<"all" | MemoryType>("all");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Memory[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pending, setPending] = useState(0);
  const [running, setRunning] = useState<{ done: number; created: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ type: "decision" as MemoryType, title: "", content: "", occurredAt: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (query.trim()) params.set("q", query.trim());
    const res = await fetch(`/api/projects/${projectId}/memory?${params}`);
    const data = await res.json();
    if (!data.success) { setError(data.error || "Could not load memory"); setItems([]); return; }
    setItems(data.data.items);
    setCounts(data.data.counts);
    setPending(data.data.pendingDocuments);
  }, [projectId, type, query]);

  useEffect(() => {
    const t = setTimeout(load, query ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  // Reads pending documents a few at a time until none are left.
  const runExtraction = async () => {
    setError(null);
    setRunning({ done: 0, created: 0 });
    let done = 0, created = 0;
    try {
      for (let i = 0; i < 40; i++) {
        const res = await fetch(`/api/projects/${projectId}/memory/extract`, { method: "POST" });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Memory update failed");
        done += data.data.processed;
        created += data.data.created;
        setRunning({ done, created });
        setPending(data.data.remaining);
        if (data.data.remaining === 0 || data.data.processed === 0) break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Memory update failed");
    } finally {
      setRunning(null);
      await load();
      onChanged();
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const res = await fetch(`/api/projects/${projectId}/memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, occurredAt: draft.occurredAt || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok || !data.success) { setError(data.error || "Could not save"); return; }
    setAdding(false);
    setDraft({ type: "decision", title: "", content: "", occurredAt: "" });
    load(); onChanged();
  };

  const remove = async (memoryId: string) => {
    await fetch(`/api/projects/${projectId}/memory/${memoryId}`, { method: "DELETE" });
    load(); onChanged();
  };

  // Group the timeline by month.
  const groups = useMemo(() => {
    const map = new Map<string, Memory[]>();
    for (const m of items ?? []) {
      const k = format(new Date(m.occurredAt), "MMMM yyyy");
      map.set(k, [...(map.get(k) ?? []), m]);
    }
    return Array.from(map.entries());
  }, [items]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="pj-stack">
      {pending > 0 && canManage && (
        <div className="ui-card pj-banner" role="status">
          <div className="pj-list-row" style={{ flexWrap: "wrap" }}>
            <div className="pj-ident">
              <span className="ui-icon-well ui-icon-well--sm ui-icon-well--accent"><Sparkles /></span>
              <div>
                <span className="pj-name">{pending} document{pending === 1 ? "" : "s"} not read yet</span>
                <span className="pj-sub">Corely reads new and changed documents for decisions, risks and milestones after each sync. You can also do it now.</span>
              </div>
            </div>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={runExtraction} disabled={!!running}>
              {running ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              {running ? `Reading… ${running.done} done` : "Update memory"}
            </button>
          </div>
        </div>
      )}

      {error && <div className="pj-error" role="alert">{error}</div>}

      <FilterToolbar
        leading={
          <SegmentedControl<"all" | MemoryType>
            label="Filter by type"
            size="sm"
            value={type}
            onChange={setType}
            segments={[
              { value: "all", label: "All", count: total },
              ...(Object.keys(MEMORY_META) as MemoryType[]).map(t => ({ value: t, label: MEMORY_META[t].plural, count: counts[t] ?? 0 })),
            ]}
          />
        }
        search={{ value: query, onChange: setQuery, placeholder: "Search memory" }}
        actions={canManage && (
          <button type="button" className="ui-btn ui-btn--secondary" onClick={() => setAdding(v => !v)}>
            <Plus /> Add memory
          </button>
        )}
      />

      {adding && (
        <form className="ui-card" onSubmit={save}>
          <div className="ui-card-header">
            <span className="type-heading">Add a memory</span>
            <button type="button" className="ui-icon-btn ui-icon-btn--sm" onClick={() => setAdding(false)} aria-label="Close"><X size={14} /></button>
          </div>
          <div className="ui-card-body pj-stack">
            <div className="pj-row">
              <div className="pj-field">
                <label htmlFor="mem-type">Type</label>
                <Select
                  id="mem-type"
                  value={draft.type}
                  onChange={v => setDraft(d => ({ ...d, type: v as MemoryType }))}
                  options={(Object.keys(MEMORY_META) as MemoryType[]).map(t => ({ value: t, label: MEMORY_META[t].label }))}
                />
              </div>
              <div className="pj-field">
                <label htmlFor="mem-date">Date</label>
                <input id="mem-date" type="date" className="ui-input" value={draft.occurredAt} onChange={e => setDraft(d => ({ ...d, occurredAt: e.target.value }))} />
              </div>
            </div>
            <div className="pj-field">
              <label htmlFor="mem-title">Title</label>
              <input id="mem-title" className="ui-input" value={draft.title} maxLength={140} required onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="We chose Postgres over MongoDB" />
            </div>
            <div className="pj-field">
              <label htmlFor="mem-content">Details</label>
              <textarea id="mem-content" className="ui-input" rows={3} maxLength={2000} value={draft.content} onChange={e => setDraft(d => ({ ...d, content: e.target.value }))} placeholder="Why, who decided, and anything else worth remembering." />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="ui-btn ui-btn--secondary" onClick={() => setAdding(false)}>Cancel</button>
              <button type="submit" className="ui-btn ui-btn--primary" disabled={saving || !draft.title.trim()}>{saving && <Loader2 className="animate-spin" />} Save memory</button>
            </div>
          </div>
        </form>
      )}

      {items === null ? (
        <div className="pj-stack">{[0, 1, 2].map(i => <div key={i} className="ui-skeleton" style={{ height: 88 }} />)}</div>
      ) : items.length === 0 ? (
        <div className="ui-card">
          <EmptyState
            icon={<Brain />}
            title={total === 0 ? "No project memory yet" : "Nothing matches"}
            description={
              total === 0
                ? "Link sources on the Sources tab. Corely then reads the project's documents and records its decisions, risks, milestones and open questions here."
                : "Try another type or search term."
            }
          />
        </div>
      ) : (
        <div className="pj-timeline">
          {groups.map(([month, list]) => (
            <section key={month} className="pj-month">
              <h3 className="type-label pj-month__label">{month}</h3>
              <div className="ui-card pj-list">
                {list.map(m => {
                  const Meta = MEMORY_META[m.type];
                  return (
                    <article key={m.id} className="pj-memory">
                      <span className={`pj-memory__icon pj-memory__icon--${m.type}`} aria-hidden="true"><Meta.icon /></span>
                      <div className="pj-memory__body">
                        <div className="pj-memory__head">
                          <span className="pj-memory__type">{Meta.label}</span>
                          <span className="pj-sub">{format(new Date(m.occurredAt), "d MMM yyyy")}</span>
                        </div>
                        <h4 className="pj-memory__title">{m.title}</h4>
                        {m.content && m.content !== m.title && <p className="pj-memory__text">{m.content}</p>}
                        <div className="pj-memory__foot">
                          {m.manual ? (
                            <span className="ui-badge ui-badge--neutral">Added by {m.source.name}</span>
                          ) : m.source.url ? (
                            <a className="pj-source-chip" href={m.source.url} target="_blank" rel="noreferrer">
                              <SourceLogo type={m.source.type} size={12} tile={false} />
                              {SOURCE_LABEL[m.source.type] ?? m.source.type} · {m.source.title} <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="pj-source-chip"><SourceLogo type={m.source.type} size={12} tile={false} />{SOURCE_LABEL[m.source.type] ?? m.source.type} · {m.source.title}</span>
                          )}
                          {!m.manual && <StatusBadge tone={FRESH_TONE[m.freshness.label]} dot>{m.freshness.label} · {m.freshness.score}%</StatusBadge>}
                          {m.confidence !== null && m.confidence < 0.6 && <span className="pj-sub">Low confidence</span>}
                        </div>
                      </div>
                      {canManage && (
                        <button type="button" className="ui-icon-btn ui-icon-btn--sm pj-memory__delete" onClick={() => remove(m.id)} aria-label={`Delete memory: ${m.title}`}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
