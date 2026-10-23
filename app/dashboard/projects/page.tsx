"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { FolderKanban, Plus, Search, LayoutGrid, List, FileText, Brain, Inbox, Pencil } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { PageHeader } from "@/components/ui/page-header";
import { KpiTile } from "@/components/ui/kpi-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SourceLogo } from "@/components/ui/source-logo";
import ProjectFormModal from "./components/ProjectFormModal";
import { STATUS_LABEL, STATUS_TONE, projectInitials, personName, type ProjectStatus, type ProjectSummary } from "./types";
import "./projects.css";

const FILTERS: Array<{ value: "all" | ProjectStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "planning", label: "Planning" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const ago = (v: string | null) => (v ? formatDistanceToNow(new Date(v), { addSuffix: true }) : "No activity yet");

export default function ProjectsPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("projects:manage");

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"table" | "grid">("table");
  const [modal, setModal] = useState<{ open: boolean; project: ProjectSummary | null }>({ open: false, project: null });

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Could not load projects");
      setProjects(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: projects.length };
    for (const p of projects) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [projects]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter(p => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!q) return true;
      return [p.name, p.key, p.description, ...(p.aliases ?? [])].some(v => v?.toLowerCase().includes(q));
    });
  }, [projects, filter, query]);

  const totals = useMemo(() => ({
    active: projects.filter(p => p.status === "active").length,
    documents: projects.reduce((n, p) => n + p.counts.documents, 0),
    memories: projects.reduce((n, p) => n + p.counts.memories, 0),
    suggestions: projects.reduce((n, p) => n + p.counts.suggestions, 0),
  }), [projects]);

  const openNew = () => setModal({ open: true, project: null });

  return (
    <div className="db-content">
      <PageHeader
        title="Projects"
        subtitle="Every project in development, with the memory Corely has gathered for each one."
        actions={canManage && (
          <button type="button" className="ui-btn ui-btn--primary" onClick={openNew}>
            <Plus /> New project
          </button>
        )}
      />

      <div className="pj-kpis">
        <KpiTile icon={<FolderKanban />} label="Active projects" value={loading ? "–" : totals.active} />
        <KpiTile icon={<FileText />} label="Documents linked to projects" value={loading ? "–" : totals.documents.toLocaleString()} />
        <KpiTile icon={<Brain />} label="Project memories" value={loading ? "–" : totals.memories.toLocaleString()} />
        <KpiTile icon={<Inbox />} label="Suggestions to review" value={loading ? "–" : totals.suggestions.toLocaleString()} />
      </div>

      <FilterToolbar
        leading={
          <SegmentedControl
            label="Filter by status"
            size="sm"
            value={filter}
            onChange={setFilter}
            segments={FILTERS.map(f => ({ value: f.value, label: f.label, count: counts[f.value] ?? 0 }))}
          />
        }
        search={{ value: query, onChange: setQuery, placeholder: "Search projects" }}
        actions={
          <SegmentedControl
            label="View"
            size="sm"
            value={view}
            onChange={setView}
            segments={[
              { value: "table", label: <span className="sr-only">Table view</span>, icon: <List size={16} aria-hidden="true" /> },
              { value: "grid", label: <span className="sr-only">Card view</span>, icon: <LayoutGrid size={16} aria-hidden="true" /> },
            ]}
          />
        }
      />

      {error && <div className="pj-error" role="alert">{error}</div>}

      {loading ? (
        <div className="pj-stack">
          {[0, 1, 2].map(i => <div key={i} className="ui-skeleton" style={{ height: 64 }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="ui-card">
          <EmptyState
            icon={<FolderKanban />}
            title="No projects yet"
            description="Create a project, then link its Slack channels, docs and repos. Corely builds the project's memory from them."
            action={canManage && <button type="button" className="ui-btn ui-btn--primary" onClick={openNew}><Plus /> New project</button>}
          />
        </div>
      ) : visible.length === 0 ? (
        <div className="ui-card">
          <EmptyState compact icon={<Search />} title="No projects match" description="Try another status or search term." />
        </div>
      ) : view === "table" ? (
        <div className="ui-table-wrap">
          <table className="ui-table pj-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Sources</th>
                <th className="pj-num">Documents</th>
                <th className="pj-num">Memories</th>
                <th>Last activity</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {visible.map(p => (
                <tr key={p.id} data-href={`/dashboard/projects/${p.id}`} onClick={() => router.push(`/dashboard/projects/${p.id}`)}>
                  <td>
                    <div className="pj-ident">
                      <span className="pj-tile">{projectInitials(p)}</span>
                      <div>
                        <Link href={`/dashboard/projects/${p.id}`} className="pj-name" onClick={e => e.stopPropagation()}>{p.name}</Link>
                        <span className="pj-sub">{[p.key, p.team?.name].filter(Boolean).join(" · ") || "No team"}</span>
                      </div>
                    </div>
                  </td>
                  <td><StatusBadge tone={STATUS_TONE[p.status]} dot>{STATUS_LABEL[p.status]}</StatusBadge></td>
                  <td className="type-body">{personName(p.owner)}</td>
                  <td>
                    {p.sourceTypes && p.sourceTypes.length > 0 ? (
                      <div className="pj-chips">
                        {p.sourceTypes.map(t => (
                          <SourceLogo key={t} type={t} size={14} tileSize={24} />
                        ))}
                      </div>
                    ) : <span className="pj-sub">Not linked</span>}
                  </td>
                  <td className="pj-num">{p.counts.documents.toLocaleString()}</td>
                  <td className="pj-num">{p.counts.memories.toLocaleString()}</td>
                  <td className="pj-sub">{ago(p.lastActivityAt)}</td>
                  <td className="pj-actions">
                    {canManage && (
                      <button
                        type="button"
                        className="ui-icon-btn ui-icon-btn--sm"
                        aria-label={`Edit ${p.name}`}
                        onClick={e => { e.stopPropagation(); setModal({ open: true, project: p }); }}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="pj-grid">
          {visible.map(p => (
            <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="pj-card">
              <div className="pj-card__head">
                <div className="pj-ident">
                  <span className="pj-tile">{projectInitials(p)}</span>
                  <div>
                    <span className="pj-name">{p.name}</span>
                    <span className="pj-sub">{personName(p.owner)}</span>
                  </div>
                </div>
                <StatusBadge tone={STATUS_TONE[p.status]} dot>{STATUS_LABEL[p.status]}</StatusBadge>
              </div>
              <p className="pj-card__desc">{p.description || "No description yet."}</p>
              <div className="pj-card__stats">
                <div className="pj-card__stat"><b>{p.counts.documents}</b><span>Documents</span></div>
                <div className="pj-card__stat"><b>{p.counts.memories}</b><span>Memories</span></div>
                <div className="pj-card__stat"><b>{p.counts.links ?? 0}</b><span>Linked</span></div>
              </div>
              <span className="pj-sub">{ago(p.lastActivityAt)}</span>
            </Link>
          ))}
        </div>
      )}

      <ProjectFormModal
        open={modal.open}
        project={modal.project}
        onClose={() => setModal({ open: false, project: null })}
        onSaved={saved => {
          const wasNew = !modal.project;
          setModal({ open: false, project: null });
          if (wasNew) router.push(`/dashboard/projects/${saved.id}`);
          else load();
        }}
      />
    </div>
  );
}
