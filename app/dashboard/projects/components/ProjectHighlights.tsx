"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { MEMORY_META } from "./ProjectMemory";

type Item = { id: string; type: "decision" | "risk" | "milestone"; title: string; occurredAt: string; source: { name: string; title: string | null } };

const SECTIONS = [
  { type: "decision", title: "Decisions", empty: "No decisions recorded yet." },
  { type: "risk", title: "Open risks", empty: "No risks recorded." },
  { type: "milestone", title: "Milestones", empty: "No milestones recorded yet." },
] as const;

/** Overview cards: the newest decisions, risks and milestones of a project. */
export default function ProjectHighlights({ projectId, onOpenMemory, refreshKey }: { projectId: string; onOpenMemory: () => void; refreshKey: number }) {
  const [data, setData] = useState<Record<string, Item[] | null>>({ decision: null, risk: null, milestone: null });

  useEffect(() => {
    let alive = true;
    for (const s of SECTIONS) {
      fetch(`/api/projects/${projectId}/memory?type=${s.type}&limit=5`)
        .then(r => r.json())
        .then(d => { if (alive) setData(prev => ({ ...prev, [s.type]: d.success ? d.data.items : [] })); })
        .catch(() => { if (alive) setData(prev => ({ ...prev, [s.type]: [] })); });
    }
    return () => { alive = false; };
  }, [projectId, refreshKey]);

  return (
    <div className="pj-highlights">
      {SECTIONS.map(s => {
        const Icon = MEMORY_META[s.type].icon;
        const items = data[s.type];
        return (
          <div key={s.type} className="ui-card">
            <div className="ui-card-header">
              <span className="type-heading" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className={`pj-memory__icon pj-memory__icon--${s.type}`} style={{ width: 28, height: 28 }}><Icon /></span>
                {s.title}
              </span>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={onOpenMemory}>View all <ArrowRight /></button>
            </div>
            {items === null ? (
              <div className="ui-card-body pj-stack">{[0, 1].map(i => <div key={i} className="ui-skeleton" style={{ height: 36 }} />)}</div>
            ) : items.length === 0 ? (
              <div className="ui-card-body"><span className="pj-sub">{s.empty}</span></div>
            ) : (
              <div className="pj-list">
                {items.map(m => (
                  <div key={m.id} className="pj-list-row" style={{ alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="type-body" style={{ fontWeight: 500 }}>{m.title}</div>
                      <div className="pj-sub">{format(new Date(m.occurredAt), "d MMM yyyy")} · {m.source.title ?? m.source.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
