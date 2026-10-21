"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Check, ChevronRight, Loader2, Search, X } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SOURCE_LABEL, type ProjectLink } from "../types";

type Source = { id: string; name: string; type: string; status: string; itemsIndexed?: number };
type Scope = { type: string; id: string; name: string; documents: number };

const SCOPE_LABEL: Record<string, string> = {
  source: "Whole source",
  channel: "Channel",
  page: "Page and sub-pages",
  folder: "Folder",
  repo: "Repository",
  linear_team: "Team",
  linear_project: "Project",
};

type Props = {
  open: boolean;
  projectId: string;
  existing: ProjectLink[];
  onClose: () => void;
  onLinked: (message: string) => void;
};

export default function LinkSourcesModal({ open, projectId, existing, onClose, onLinked }: Props) {
  const [sources, setSources] = useState<Source[] | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [scopes, setScopes] = useState<Scope[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSource(null); setScopes(null); setSelected(new Set()); setQuery(""); setError(null);
    fetch("/api/sources").then(r => r.json()).then(d => setSources(d.data?.sources ?? [])).catch(() => setSources([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const pickSource = async (s: Source) => {
    setSource(s); setScopes(null); setSelected(new Set()); setQuery(""); setError(null);
    try {
      const res = await fetch(`/api/sources/${s.id}/scopes`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Could not load this source");
      setScopes(data.data.scopes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this source");
      setScopes([]);
    }
  };

  const linkedKeys = useMemo(
    () => new Set(existing.filter(l => l.sourceId === source?.id).map(l => `${l.scopeType}:${l.scopeId}`)),
    [existing, source]
  );

  const visibleScopes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (scopes ?? []).filter(s => !q || s.name.toLowerCase().includes(q));
  }, [scopes, query]);

  if (!open || typeof document === "undefined") return null;

  const keyOf = (s: Scope) => `${s.type}:${s.id}`;
  const toggle = (s: Scope) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(keyOf(s))) next.delete(keyOf(s)); else next.add(keyOf(s));
      return next;
    });

  const save = async () => {
    if (!source || !scopes) return;
    setSaving(true); setError(null);
    try {
      const picked = scopes.filter(s => selected.has(keyOf(s))).map(s => ({ type: s.type, id: s.id, name: s.name }));
      const res = await fetch(`/api/projects/${projectId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: source.id, scopes: picked }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Could not link these items");
      const t = data.data.tags;
      onLinked(`Linked ${picked.length} item${picked.length === 1 ? "" : "s"}. ${t.linked} document${t.linked === 1 ? "" : "s"} now belong to this project.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not link these items");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="pj-overlay" onMouseDown={onClose}>
      <div className="pj-modal ui-popover" role="dialog" aria-modal="true" aria-labelledby="pj-link-title" onMouseDown={e => e.stopPropagation()}>
        <div className="pj-modal__head">
          <div style={{ minWidth: 0 }}>
            <div className="pj-modal__title" id="pj-link-title">{source ? `Link from ${source.name}` : "Link sources"}</div>
            <p className="type-subtitle" style={{ marginTop: 2 }}>
              {source ? "Pick what belongs to this project. Everything inside it joins the project's memory." : "Choose a connected source."}
            </p>
          </div>
          <button type="button" className="ui-icon-btn ui-icon-btn--sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <div className="pj-modal__body">
          {error && <div className="pj-error" role="alert">{error}</div>}

          {!source && (
            sources === null ? (
              <div className="pj-stack">{[0, 1, 2].map(i => <div key={i} className="ui-skeleton" style={{ height: 56 }} />)}</div>
            ) : sources.length === 0 ? (
              <EmptyState compact title="No sources connected" description="Connect Slack, Notion, Drive or another tool on the Sources page first." />
            ) : (
              <div className="ui-card pj-list">
                {sources.map(s => (
                  <button key={s.id} type="button" className="pj-list-row pj-pick" onClick={() => pickSource(s)}>
                    <span className="pj-ident">
                      <span className="pj-tile">{(SOURCE_LABEL[s.type] ?? s.type).slice(0, 2)}</span>
                      <span>
                        <span className="pj-name">{s.name}</span>
                        <span className="pj-sub">{SOURCE_LABEL[s.type] ?? s.type}</span>
                      </span>
                    </span>
                    <ChevronRight size={16} style={{ color: "var(--icon-secondary)" }} />
                  </button>
                ))}
              </div>
            )
          )}

          {source && (
            <>
              <div className="pj-toolbar">
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { setSource(null); setScopes(null); }}>
                  <ArrowLeft /> All sources
                </button>
                <div className="pj-search" style={{ maxWidth: "none" }}>
                  <Search />
                  <input className="ui-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" aria-label="Search items" />
                </div>
              </div>

              {scopes === null ? (
                <div className="pj-stack">{[0, 1, 2, 3].map(i => <div key={i} className="ui-skeleton" style={{ height: 48 }} />)}</div>
              ) : visibleScopes.length === 0 ? (
                <EmptyState compact title="Nothing to link yet" description="Sync this source first. Channels, folders and repos show up here once their documents are indexed." />
              ) : (
                <div className="ui-card pj-list" role="listbox" aria-multiselectable="true" aria-label="Items to link">
                  {visibleScopes.map(s => {
                    const linked = linkedKeys.has(keyOf(s));
                    const on = selected.has(keyOf(s));
                    return (
                      <button
                        key={keyOf(s)}
                        type="button"
                        role="option"
                        aria-selected={on || linked}
                        disabled={linked}
                        className="pj-list-row pj-pick"
                        data-on={on ? "true" : "false"}
                        onClick={() => toggle(s)}
                      >
                        <span className="pj-ident">
                          <span className="pj-check" aria-hidden="true">{(on || linked) && <Check size={12} />}</span>
                          <span>
                            <span className="pj-name">{s.name}</span>
                            <span className="pj-sub">{SCOPE_LABEL[s.type] ?? s.type} · {s.documents.toLocaleString()} document{s.documents === 1 ? "" : "s"}</span>
                          </span>
                        </span>
                        {linked && <span className="ui-badge ui-badge--neutral">Linked</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="pj-modal__foot">
          <button type="button" className="ui-btn ui-btn--secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="ui-btn ui-btn--primary" disabled={!source || selected.size === 0 || saving} onClick={save}>
            {saving && <Loader2 className="animate-spin" />}
            Link {selected.size > 0 ? selected.size : ""} {selected.size === 1 ? "item" : "items"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
