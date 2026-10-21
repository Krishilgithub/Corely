"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft, Pencil, Trash2, LayoutDashboard, Link2, User, Users, Calendar, FileText, Brain, Inbox, Loader2, Archive, MessageSquare, CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { KpiTile } from "@/components/ui/kpi-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import ProjectFormModal from "../components/ProjectFormModal";
import ProjectSources from "../components/ProjectSources";
import ProjectMemory from "../components/ProjectMemory";
import ProjectAsk from "../components/ProjectAsk";
import ProjectHighlights from "../components/ProjectHighlights";
import { STATUS_LABEL, STATUS_TONE, PHASES, projectInitials, personName, type ProjectDetail } from "../types";
import "../projects.css";

type Tab = "overview" | "memory" | "ask" | "sources";

const fmtDate = (v: string | null) => (v ? format(new Date(v), "d MMM yyyy") : "Not set");

export default function ProjectDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("projects:manage");

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Could not load the project");
      setProject(data.data);
      setRefreshKey(k => k + 1);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the project");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const archive = async () => {
    if (!project) return;
    setBusy(true);
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: project.status === "archived" ? "active" : "archived" }),
    });
    setBusy(false);
    load();
  };

  const remove = async () => {
    setBusy(true);
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.push("/dashboard/projects");
  };

  if (loading) {
    return (
      <div className="db-content">
        <div className="ui-skeleton" style={{ height: 32, width: 140 }} />
        <div className="ui-skeleton" style={{ height: 64 }} />
        <div className="pj-kpis">{[0, 1, 2, 3].map(i => <div key={i} className="ui-skeleton" style={{ height: 140 }} />)}</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="db-content">
        <Link href="/dashboard/projects" className="ui-btn ui-btn--ghost pj-back"><ArrowLeft /> Back to projects</Link>
        <div className="ui-card">
          <EmptyState icon={<Inbox />} title="Project not found" description={error ?? "It may have been deleted, or you may not have access."} />
        </div>
      </div>
    );
  }

  const phaseLabel = PHASES.find(p => p.value === project.phase)?.label;

  return (
    <div className="db-content">
      <Link href="/dashboard/projects" className="ui-btn ui-btn--ghost ui-btn--sm pj-back"><ArrowLeft /> Back to projects</Link>

      <div className="pj-detail-head">
        <div className="pj-detail-ident">
          <span className="pj-tile pj-tile--lg pj-tile--accent">{projectInitials(project)}</span>
          <div style={{ minWidth: 0 }}>
            <h1 className="type-title">{project.name}</h1>
            <div className="pj-meta">
              <StatusBadge tone={STATUS_TONE[project.status]} dot>{STATUS_LABEL[project.status]}</StatusBadge>
              {phaseLabel && <span className="ui-badge ui-badge--neutral">{phaseLabel}</span>}
              {project.key && <span className="ui-badge ui-badge--neutral">{project.key}</span>}
              <span className="pj-sub"><User /> {personName(project.owner)}</span>
              {project.team && <span className="pj-sub"><Users /> {project.team.name}</span>}
            </div>
          </div>
        </div>
        {canManage && (
          <div className="ui-page-header__actions">
            <button type="button" className="ui-btn ui-btn--secondary" onClick={archive} disabled={busy}>
              <Archive /> {project.status === "archived" ? "Restore" : "Archive"}
            </button>
            <button type="button" className="ui-btn ui-btn--secondary" onClick={() => setEditing(true)}>
              <Pencil /> Edit
            </button>
            <button type="button" className="ui-btn ui-btn--destructive" onClick={() => setConfirmDelete(true)} aria-label="Delete project">
              <Trash2 />
            </button>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="ui-card" role="alert" style={{ borderColor: "color-mix(in srgb, var(--error) 35%, transparent)" }}>
          <div className="pj-list-row" style={{ flexWrap: "wrap" }}>
            <div>
              <div className="type-body" style={{ fontWeight: 600 }}>Delete {project.name}?</div>
              <div className="type-caption">This removes the project, its source links and its project memories. Your documents stay in Corely.</div>
            </div>
            <div className="ui-page-header__actions">
              <button type="button" className="ui-btn ui-btn--secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button type="button" className="ui-btn ui-btn--destructive" onClick={remove} disabled={busy}>
                {busy && <Loader2 className="animate-spin" />} Delete project
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pj-tabs" role="tablist" aria-label="Project sections">
        <button type="button" role="tab" aria-selected={tab === "overview"} onClick={() => setTab("overview")}><LayoutDashboard /> Overview</button>
        <button type="button" role="tab" aria-selected={tab === "memory"} onClick={() => setTab("memory")}>
          <Brain /> Memory <span className="ui-badge ui-badge--neutral">{project.counts.memories}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === "ask"} onClick={() => setTab("ask")}><MessageSquare /> Ask</button>
        <button type="button" role="tab" aria-selected={tab === "sources"} onClick={() => setTab("sources")}>
          <Link2 /> Sources
          {project.counts.suggestions > 0
            ? <span className="ui-badge ui-badge--accent" title="Documents to review">{project.counts.suggestions}</span>
            : <span className="ui-badge ui-badge--neutral">{project.links.length}</span>}
        </button>
      </div>

      {tab === "overview" && (
        <>
          <div className="pj-kpis">
            <KpiTile icon={<FileText />} label="Documents" value={project.counts.documents.toLocaleString()} />
            <KpiTile icon={<CheckCircle2 />} label="Decisions recorded" value={(project.counts.byType?.decision ?? 0).toLocaleString()} />
            <KpiTile icon={<Link2 />} label="Linked sources" value={project.links.length} />
            <KpiTile
              icon={<Calendar />}
              label="Last activity"
              value={project.lastActivityAt ? formatDistanceToNow(new Date(project.lastActivityAt), { addSuffix: false }) : "None"}
            />
          </div>

          <ProjectHighlights projectId={project.id} refreshKey={refreshKey} onOpenMemory={() => setTab("memory")} />

          <div className="pj-two-col">
            <div className="ui-card">
              <div className="ui-card-header"><span className="type-heading">About this project</span></div>
              <div className="ui-card-body">
                <p className="pj-prose">{project.description || "No description yet. Add one so Corely can find content about this project more accurately."}</p>
              </div>
            </div>
            <div className="ui-card">
              <div className="ui-card-header"><span className="type-heading">Details</span></div>
              <div className="ui-card-body">
                <dl className="pj-dl">
                  <dt>Owner</dt><dd>{personName(project.owner)}</dd>
                  <dt>Team</dt><dd>{project.team?.name ?? "No team"}</dd>
                  <dt>Start</dt><dd>{fmtDate(project.startDate)}</dd>
                  <dt>Target</dt><dd>{fmtDate(project.targetDate)}</dd>
                  <dt>Other names</dt><dd>{project.aliases.length ? project.aliases.join(", ") : "None"}</dd>
                  <dt>Created</dt><dd>{fmtDate(project.createdAt)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "memory" && <ProjectMemory projectId={project.id} canManage={canManage} onChanged={load} />}

      {tab === "ask" && <ProjectAsk projectId={project.id} projectName={project.name} />}

      {tab === "sources" && (
        <ProjectSources projectId={project.id} links={project.links} canManage={canManage} onChanged={load} />
      )}

      <ProjectFormModal
        open={editing}
        project={project}
        onClose={() => setEditing(false)}
        onSaved={() => { setEditing(false); load(); }}
      />
    </div>
  );
}
