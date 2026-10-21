"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, ExternalLink, Link2, Loader2, Plus, RefreshCw, RotateCcw, Search, X, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import LinkSourcesModal from "./LinkSourcesModal";
import { SOURCE_LABEL, type ProjectLink } from "../types";

type DocStatus = "confirmed" | "suggested" | "rejected";
type DocRow = {
  documentId: string;
  method: string;
  confidence: number;
  status: DocStatus;
  title: string;
  url: string | null;
  fileType: string | null;
  updatedAt: string;
  source: { id: string; name: string; type: string };
};

const METHOD_LABEL: Record<string, string> = {
  linked: "Linked source",
  rule: "Name match",
  ai: "AI match",
  manual: "Added by a person",
};

const SCOPE_LABEL: Record<string, string> = {
  source: "Whole source", channel: "Channel", page: "Page tree", folder: "Folder",
  repo: "Repository", linear_team: "Team", linear_project: "Project",
};

type Props = {
  projectId: string;
  links: ProjectLink[];
  canManage: boolean;
  onChanged: () => void;
};

export default function ProjectSources({ projectId, links, canManage, onChanged }: Props) {
  const [status, setStatus] = useState<DocStatus>("confirmed");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<DocRow[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (p = 1, append = false) => {
    const params = new URLSearchParams({ status, page: String(p) });
    if (query.trim()) params.set("q", query.trim());
    const res = await fetch(`/api/projects/${projectId}/documents?${params}`);
    const data = await res.json();
    if (!data.success) return;
    setCounts(data.data.counts);
    setTotal(data.data.total);
    setPage(p);
    setRows(prev => (append && prev ? [...prev, ...data.data.items] : data.data.items));
  }, [projectId, status, query]);

  useEffect(() => {
    const t = setTimeout(() => load(1), query ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  const setDocStatus = async (documentId: string, next: "confirmed" | "rejected") => {
    setBusy(documentId);
    await fetch(`/api/projects/${projectId}/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(null);
    await load(1);
    onChanged();
  };

  const unlink = async (linkId: string) => {
    setBusy(linkId);
    await fetch(`/api/projects/${projectId}/links/${linkId}`, { method: "DELETE" });
    setBusy(null);
    onChanged();
    load(1);
  };

  const refresh = async () => {
    setBusy("refresh");
    const res = await fetch(`/api/projects/${projectId}/refresh`, { method: "POST" });
    const data = await res.json();
    setBusy(null);
    if (data.success) {
      const t = data.data;
      setNotice(`Checked again: ${t.linked} from linked sources, ${t.rule} by name, ${t.suggested} to review.`);
    }
    onChanged();
    load(1);
  };

  return (
    <div className="pj-stack">
      {notice && (
        <div className="ui-card" role="status">
          <div className="pj-list-row">
            <span className="type-body">{notice}</span>
            <button type="button" className="ui-icon-btn ui-icon-btn--sm" onClick={() => setNotice(null)} aria-label="Dismiss"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Linked scopes */}
      <div className="ui-card">
        <div className="ui-card-header">
          <div>
            <div className="type-heading">Linked sources</div>
            <div className="type-caption">Everything inside a linked channel, folder, page or repo belongs to this project.</div>
          </div>
          {canManage && (
            <div className="ui-page-header__actions">
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={refresh} disabled={busy === "refresh"}>
                {busy === "refresh" ? <Loader2 className="animate-spin" /> : <RefreshCw />} Check again
              </button>
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => setLinkOpen(true)}>
                <Plus /> Link sources
              </button>
            </div>
          )}
        </div>
        {links.length === 0 ? (
          <EmptyState
            compact
            icon={<Link2 />}
            title="No sources linked yet"
            description="Link the project's Slack channels, Notion pages, Drive folders, repos or Linear teams. Corely also finds documents that mention the project by name."
            action={canManage && <button type="button" className="ui-btn ui-btn--primary" onClick={() => setLinkOpen(true)}><Plus /> Link sources</button>}
          />
        ) : (
          <div className="pj-list">
            {links.map(l => (
              <div key={l.id} className="pj-list-row">
                <div className="pj-ident">
                  <span className="pj-tile">{(SOURCE_LABEL[l.source.type] ?? l.source.type).slice(0, 2)}</span>
                  <div>
                    <span className="pj-name">{l.scopeName}</span>
                    <span className="pj-sub">{SOURCE_LABEL[l.source.type] ?? l.source.type} · {SCOPE_LABEL[l.scopeType] ?? l.scopeType} · {l.source.name}</span>
                  </div>
                </div>
                {canManage && (
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => unlink(l.id)} disabled={busy === l.id}>
                    {busy === l.id ? <Loader2 className="animate-spin" /> : <X />} Unlink
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents in the project */}
      <div className="ui-card">
        <div className="ui-card-header" style={{ flexWrap: "wrap" }}>
          <div>
            <div className="type-heading">Documents</div>
            <div className="type-caption">What Corely counts as part of this project, and how it knows.</div>
          </div>
          <div className="pj-toolbar">
            <div className="pj-seg" role="group" aria-label="Filter documents">
              {(["confirmed", "suggested", "rejected"] as DocStatus[]).map(s => (
                <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)}>
                  {s === "confirmed" ? "In project" : s === "suggested" ? "To review" : "Rejected"}
                  <span className="pj-count">{counts[s] ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="pj-search">
              <Search />
              <input className="ui-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search titles" aria-label="Search documents" />
            </div>
          </div>
        </div>

        {rows === null ? (
          <div className="ui-card-body pj-stack">{[0, 1, 2].map(i => <div key={i} className="ui-skeleton" style={{ height: 44 }} />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState
            compact
            icon={<FileText />}
            title={status === "suggested" ? "Nothing to review" : status === "rejected" ? "No rejected documents" : "No documents yet"}
            description={
              status === "suggested"
                ? "Documents that mention the project by name show up here for you to confirm."
                : status === "rejected"
                  ? "Documents you remove from the project stay here, so Corely does not add them back."
                  : "Link a source, or give the project a key and other names so Corely can find its documents."
            }
          />
        ) : (
          <div className="pj-list">
            {rows.map(r => (
              <div key={r.documentId} className="pj-list-row pj-doc-row">
                <div className="pj-ident">
                  <span className="pj-tile">{(SOURCE_LABEL[r.source.type] ?? r.source.type).slice(0, 2)}</span>
                  <div>
                    {r.url ? (
                      <a className="pj-name" href={r.url} target="_blank" rel="noreferrer">{r.title} <ExternalLink size={12} style={{ verticalAlign: -1 }} /></a>
                    ) : <span className="pj-name">{r.title}</span>}
                    <span className="pj-sub">
                      {SOURCE_LABEL[r.source.type] ?? r.source.type} · updated {formatDistanceToNow(new Date(r.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="pj-doc-meta">
                  <span className={`ui-badge ${r.method === "linked" ? "ui-badge--accent" : "ui-badge--neutral"}`}>{METHOD_LABEL[r.method] ?? r.method}</span>
                  {r.method !== "linked" && r.method !== "manual" && (
                    <span className="pj-sub pj-num">{Math.round(r.confidence * 100)}%</span>
                  )}
                  {canManage && (
                    r.status === "suggested" ? (
                      <>
                        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setDocStatus(r.documentId, "confirmed")} disabled={busy === r.documentId}><Check /> Confirm</button>
                        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setDocStatus(r.documentId, "rejected")} disabled={busy === r.documentId}><X /> Reject</button>
                      </>
                    ) : r.status === "confirmed" ? (
                      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setDocStatus(r.documentId, "rejected")} disabled={busy === r.documentId} aria-label={`Remove ${r.title} from project`}><X /> Remove</button>
                    ) : (
                      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setDocStatus(r.documentId, "confirmed")} disabled={busy === r.documentId}><RotateCcw /> Restore</button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {rows && rows.length < total && (
          <div style={{ padding: 12, borderTop: "1px solid var(--hairline)" }}>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--block" onClick={() => load(page + 1, true)}>
              Show more ({total - rows.length} left)
            </button>
          </div>
        )}
      </div>

      <LinkSourcesModal
        open={linkOpen}
        projectId={projectId}
        existing={links}
        onClose={() => setLinkOpen(false)}
        onLinked={msg => { setLinkOpen(false); setNotice(msg); onChanged(); load(1); }}
      />
    </div>
  );
}
