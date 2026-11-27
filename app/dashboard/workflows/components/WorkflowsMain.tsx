"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  Upload,
  Plus,
  PlayCircle,
  CheckCircle2,
  Clock,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Mail,
  Video,
  Cloud,
  Headphones,
  DollarSign,
  Users,
  LineChart,
  FileText,
  Zap,
  Play,
  ToggleLeft,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Info
} from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { WorkflowItem } from "./WorkflowsLayout";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, toneForStatus } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";

/** KPI tile: icon well, big number, label, and an optional note under the label. */
const StatTile = ({
  icon,
  value,
  label,
  delta,
  accent = false,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  delta?: string;
  accent?: boolean;
}) => (
  <div className="ui-kpi">
    <span className={`ui-icon-well${accent ? " ui-icon-well--accent" : ""}`}>{icon}</span>
    <div className="wf-kpi-text">
      <span className="type-metric">{value}</span>
      <span className="type-caption">{label}</span>
      {delta && <span className="wf-kpi-delta">{delta}</span>}
    </div>
  </div>
);

/** Choices for the trigger type field in the forms. */
const TRIGGER_OPTIONS = [
  { value: "Schedule", label: "Schedule (Daily, Hourly, etc.)" },
  { value: "Event", label: "Event (When something happens)" },
  { value: "Condition", label: "Condition (Logical evaluation)" },
];

/** Choices for the status field in the forms. */
const STATUS_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

/** A person in the workspace, from GET /api/projects/options. */
interface WorkspacePerson {
  id: string;
  name: string | null;
  email: string;
}

/** Two-letter initials for the owner badge, e.g. "Jane Doe" → "JD". */
export const ownerInitials = (name?: string | null, email?: string | null) => {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (email || "U").slice(0, 2).toUpperCase();
};

const TABS = ["all workflows", "active", "draft", "scheduled", "inactive"];

/** Icon choices for the forms. Values are unchanged; labels no longer name colours. */
const ICON_OPTIONS = [
  { value: "Mail", label: "Mail envelope" },
  { value: "Video", label: "Video camera" },
  { value: "Cloud", label: "Database cloud" },
  { value: "Headphones", label: "Support headphones" },
  { value: "DollarSign", label: "Dollar sign" },
  { value: "Users", label: "Users team" },
  { value: "LineChart", label: "Analytics chart" },
  { value: "FileText", label: "Document text" },
];

// ── Icon Helper ──────────────────────────────────────────────────────────────
export const getLucideIcon = (name: string, size = 16, className = "") => {
  switch (name) {
    case "Mail": return <Mail size={size} className={className} />;
    case "Video": return <Video size={size} className={className} />;
    case "Cloud": return <Cloud size={size} className={className} />;
    case "Headphones": return <Headphones size={size} className={className} />;
    case "DollarSign": return <DollarSign size={size} className={className} />;
    case "Users": return <Users size={size} className={className} />;
    case "LineChart": return <LineChart size={size} className={className} />;
    case "FileText": return <FileText size={size} className={className} />;
    case "Zap": return <Zap size={size} className={className} />;
    case "Clock": return <Clock size={size} className={className} />;
    case "GitBranch": return <GitBranch size={size} className={className} />;
    case "PlayCircle": return <PlayCircle size={size} className={className} />;
    case "CheckCircle2": return <CheckCircle2 size={size} className={className} />;
    case "LayoutGrid": return <LayoutGrid size={size} className={className} />;
    case "Filter": return <Filter size={size} className={className} />;
    default: return <GitBranch size={size} className={className} />;
  }
};

interface WorkflowsMainProps {
  workflows: WorkflowItem[];
  onRun: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (wf: Omit<WorkflowItem, "id" | "executions" | "lastRun" | "lastRunTime">) => void;
  onEdit: (wf: WorkflowItem) => void;
}

export default function WorkflowsMain({
  workflows,
  onRun,
  onToggleStatus,
  onDelete,
  onAdd,
  onEdit,
}: WorkflowsMainProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("all workflows");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // ── Filters State ──────────────────────────────────────────────────────────
  const [selectedTrigger, setSelectedTrigger] = useState("all");
  const [selectedOwner, setSelectedOwner] = useState("all");

  // ── Dropdown & Modal State ──────────────────────────────────────────────────
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowItem | null>(null);

  // ── New/Edit Form State ─────────────────────────────────────────────────────
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIcon, setFormIcon] = useState("Mail");
  const [formTriggerType, setFormTriggerType] = useState<WorkflowItem["triggerType"]>("Schedule");
  const [formTriggerDesc, setFormTriggerDesc] = useState("");
  const [formStatus, setFormStatus] = useState<WorkflowItem["status"]>("Draft");
  // Owner is a real person's user id while the form is open.
  const [formOwner, setFormOwner] = useState("");

  // Real people in this workspace for the owner picker.
  const [people, setPeople] = useState<WorkspacePerson[]>([]);
  useEffect(() => {
    fetch("/api/projects/options")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setPeople(json?.data?.members || []))
      .catch((err) => console.error("Failed to load workspace people", err));
  }, []);

  // Owner choices: workspace people, or at least the signed-in user if the list could not load.
  const ownerOptions = useMemo(() => {
    const list: WorkspacePerson[] = people.length > 0
      ? people
      : user?.id ? [{ id: user.id, name: user.name ?? null, email: "" }] : [];
    return list.map((p) => ({
      value: p.id,
      label: `${p.name || p.email}${p.id === user?.id ? " (You)" : ""}`,
    }));
  }, [people, user]);

  /** Name and initials saved with the workflow for the chosen owner. */
  const ownerFields = (ownerId: string) => {
    const person = people.find((p) => p.id === ownerId);
    const name = person?.name || person?.email || user?.name || "User";
    return { owner: ownerInitials(person?.name ?? user?.name, person?.email), ownerName: name };
  };

  // Dropdown reference for click outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (activeDropdownId && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeDropdownId]);

  // ── KPIs: real counts only ─────────────────────────────────────────────────
  const stats = useMemo(() => ({
    totalCount: workflows.length,
    activeCount: workflows.filter((w) => w.status === "Active").length,
    // Manual runs recorded with "Run now". No actions are executed yet.
    recordedRuns: workflows.reduce((acc, curr) => acc + curr.executions, 0),
  }), [workflows]);

  // Owner filter: only the owners that really appear on workflows.
  const ownerFilterOptions = useMemo(
    () => Array.from(new Set(workflows.map((w) => w.ownerName).filter(Boolean))).map((name) => ({ value: name, label: name })),
    [workflows]
  );

  // ── Filtered Workflows ─────────────────────────────────────────────────────
  const filteredWorkflows = useMemo(() => {
    return workflows.filter((wf) => {
      // Tab filter
      if (activeTab !== "all workflows") {
        if (activeTab === "active" && wf.status !== "Active") return false;
        if (activeTab === "draft" && wf.status !== "Draft") return false;
        if (activeTab === "inactive" && wf.status !== "Inactive") return false;
        if (activeTab === "scheduled" && wf.triggerType !== "Schedule") return false;
      }

      // Dropdown Trigger Filter
      if (selectedTrigger !== "all" && wf.triggerType !== selectedTrigger) return false;

      // Dropdown Owner Filter
      if (selectedOwner !== "all" && wf.ownerName !== selectedOwner) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          wf.title.toLowerCase().includes(query) ||
          wf.desc.toLowerCase().includes(query) ||
          wf.triggerDesc.toLowerCase().includes(query) ||
          wf.status.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [workflows, activeTab, selectedTrigger, selectedOwner, searchQuery]);

  // ── Modal Actions ──────────────────────────────────────────────────────────
  const openEditModal = (wf: WorkflowItem) => {
    setSelectedWorkflow(wf);
    setFormTitle(wf.title);
    setFormDesc(wf.desc);
    setFormIcon(wf.icon);
    setFormTriggerType(wf.triggerType);
    setFormTriggerDesc(wf.triggerDesc);
    setFormStatus(wf.status);
    // Match the saved owner name to a real person. Fall back to the signed-in user.
    setFormOwner(people.find((p) => (p.name || p.email) === wf.ownerName)?.id || user?.id || "");
    setShowEditModal(true);
    setActiveDropdownId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim() || !formTriggerDesc.trim()) return;

    let iconBg = "#eff6ff";
    let iconCol = "#3b82f6";
    if (formIcon === "Video") { iconBg = "#f3e8ff"; iconCol = "#9333ea"; }
    else if (formIcon === "Cloud") { iconBg = "#dcfce7"; iconCol = "#16a34a"; }
    else if (formIcon === "Headphones") { iconBg = "#ffedd5"; iconCol = "#ea580c"; }
    else if (formIcon === "DollarSign") { iconBg = "#fee2e2"; iconCol = "#ef4444"; }
    else if (formIcon === "Users") { iconBg = "#f3e8ff"; iconCol = "#9333ea"; }
    else if (formIcon === "LineChart") { iconBg = "#ffedd5"; iconCol = "#ea580c"; }
    else if (formIcon === "FileText") { iconBg = "#fee2e2"; iconCol = "#ef4444"; }

    const ownerBg = "#0ea5e9";
    const { owner, ownerName } = ownerFields(formOwner);

    onAdd({
      icon: formIcon,
      iconBg,
      iconCol,
      title: formTitle.trim(),
      desc: formDesc.trim(),
      triggerType: formTriggerType,
      triggerIcon: formTriggerType === "Schedule" ? "Clock" : formTriggerType === "Condition" ? "LayoutGrid" : "Zap",
      triggerDesc: formTriggerDesc.trim(),
      status: formStatus,
      owner,
      ownerBg,
      ownerName
    });

    // Reset Form
    setFormTitle("");
    setFormDesc("");
    setFormIcon("Mail");
    setFormTriggerType("Schedule");
    setFormTriggerDesc("");
    setFormStatus("Draft");
    setFormOwner("");
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflow || !formTitle.trim() || !formDesc.trim() || !formTriggerDesc.trim()) return;

    let iconBg = "#eff6ff";
    let iconCol = "#3b82f6";
    if (formIcon === "Video") { iconBg = "#f3e8ff"; iconCol = "#9333ea"; }
    else if (formIcon === "Cloud") { iconBg = "#dcfce7"; iconCol = "#16a34a"; }
    else if (formIcon === "Headphones") { iconBg = "#ffedd5"; iconCol = "#ea580c"; }
    else if (formIcon === "DollarSign") { iconBg = "#fee2e2"; iconCol = "#ef4444"; }
    else if (formIcon === "Users") { iconBg = "#f3e8ff"; iconCol = "#9333ea"; }
    else if (formIcon === "LineChart") { iconBg = "#ffedd5"; iconCol = "#ea580c"; }
    else if (formIcon === "FileText") { iconBg = "#fee2e2"; iconCol = "#ef4444"; }

    const ownerBg = "#0ea5e9";
    const { owner, ownerName } = ownerFields(formOwner);

    onEdit({
      ...selectedWorkflow,
      icon: formIcon,
      iconBg,
      iconCol,
      title: formTitle.trim(),
      desc: formDesc.trim(),
      triggerType: formTriggerType,
      triggerIcon: formTriggerType === "Schedule" ? "Clock" : formTriggerType === "Condition" ? "LayoutGrid" : "Zap",
      triggerDesc: formTriggerDesc.trim(),
      status: formStatus,
      owner,
      ownerBg,
      ownerName
    });

    setShowEditModal(false);
    setSelectedWorkflow(null);
  };

  const confirmDeleteWorkflow = (wf: WorkflowItem) => {
    setWorkflowToDelete(wf);
    setShowDeleteConfirm(true);
    setActiveDropdownId(null);
  };

  const handleDeleteExecute = () => {
    if (workflowToDelete) {
      onDelete(workflowToDelete.id);
      setShowDeleteConfirm(false);
      setWorkflowToDelete(null);
    }
  };

  // One menu, used by both the table rows and the grid cards.
  const renderRowMenu = (row: WorkflowItem) => (
    <div className="wf-actions-container" ref={activeDropdownId === row.id ? dropdownRef : null}>
      <button
        className="ui-icon-btn ui-icon-btn--sm wf-more-btn"
        aria-label="Workflow actions"
        onClick={() => setActiveDropdownId(activeDropdownId === row.id ? null : row.id)}
      >
        <MoreHorizontal size={16} />
      </button>

      {activeDropdownId === row.id && (
        <div className="ui-popover wf-actions-dropdown">
          <button className="ui-menu-item" onClick={() => onRun(row.id)}>
            <Play size={16} />
            Record a run
          </button>
          <button className="ui-menu-item" onClick={() => onToggleStatus(row.id)}>
            <ToggleLeft size={16} />
            Toggle active
          </button>
          <button className="ui-menu-item" onClick={() => openEditModal(row)}>
            <Edit2 size={16} />
            Edit settings
          </button>
          <button className="ui-menu-item ui-menu-item--danger" onClick={() => confirmDeleteWorkflow(row)}>
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      )}
    </div>
  );

  const modalMotion = {
    initial: { scale: 0.98, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.98, opacity: 0 },
    transition: { duration: 0.15, ease: "easeOut" as const },
  };

  return (
    <div className="wf-main">

      {/* ── 1. Header ── */}
      <PageHeader
        title="Workflows"
        subtitle="Automate repetitive work and orchestrate intelligent actions across your organization."
        actions={
          <>
            {/* Import has no file picker or parser yet, so it is disabled. */}
            <button className="ui-btn ui-btn--secondary" disabled title="Not available yet">
              <Upload size={16} /> Import workflow
              <span className="ui-badge ui-badge--neutral">Coming soon</span>
            </button>
            <button
              className="ui-btn ui-btn--primary"
              onClick={() => {
                setFormOwner(user?.id || "");
                setShowAddModal(true);
              }}
            >
              <Plus size={16} /> New workflow
            </button>
          </>
        }
      />

      {/* ── Beta Notice ── */}
      <div className="wf-notice">
        <Info size={16} />
        <div style={{ minWidth: 0 }}>
          <div className="wf-notice__head">
            <span className="wf-notice__title">Workflows is in Beta.</span>
            <span className="ui-badge ui-badge--neutral">Coming soon</span>
          </div>
          <div className="wf-notice__text">
            You can create and organize workflow definitions. Triggers and actions are not executed yet.
            &quot;Record a run&quot; only adds a run record and a log entry. Nothing else happens.
          </div>
        </div>
      </div>

      <div className="wf-kpi-grid">
        <StatTile
          accent
          icon={<GitBranch />}
          value={stats.totalCount}
          label="Workflows"
        />
        <StatTile
          icon={<PlayCircle />}
          value={stats.activeCount}
          label="Active workflows"
        />
        <StatTile
          icon={<CheckCircle2 />}
          value={stats.recordedRuns.toLocaleString()}
          label="Runs recorded"
          delta="Manual runs only. Actions are not executed yet."
        />
      </div>

      {/* ── 3. Table/Grid Card ── */}
      <div className="wf-table-card">
        {/* Table Header Controls */}
        <FilterToolbar
          className="wf-toolbar"
          leading={
            <SegmentedControl
              label="Filter workflows"
              size="sm"
              value={activeTab}
              onChange={setActiveTab}
              segments={TABS.map((tab) => ({ value: tab, label: tab.charAt(0).toUpperCase() + tab.slice(1) }))}
            />
          }
          search={{ value: searchQuery, onChange: setSearchQuery, placeholder: "Search workflows" }}
          filters={[
            {
              id: "trigger",
              label: "Trigger",
              icon: <Zap size={14} />,
              options: TRIGGER_OPTIONS.map((o) => ({ value: o.value, label: o.value })),
              value: selectedTrigger,
              onChange: setSelectedTrigger,
              emptyValue: "all",
            },
            {
              id: "owner",
              label: "Owner",
              icon: <Users size={14} />,
              options: ownerFilterOptions,
              value: selectedOwner,
              onChange: setSelectedOwner,
              emptyValue: "all",
            },
          ]}
          actions={
            <SegmentedControl
              label="View"
              size="sm"
              value={viewMode}
              onChange={setViewMode}
              segments={[
                { value: "grid", label: <span className="sr-only">Grid view</span>, icon: <LayoutGrid size={16} aria-hidden="true" /> },
                { value: "list", label: <span className="sr-only">List view</span>, icon: <List size={16} aria-hidden="true" /> },
              ]}
            />
          }
        />

        {/* ── Table List View ── */}
        {viewMode === "list" ? (
          <div className="table-responsive-wrapper">
            <table className="ui-table">
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Trigger</th>
                <th>Last run</th>
                <th>Runs recorded</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Owner</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filteredWorkflows.length === 0 && (
                <tr className="wf-empty-row">
                  <td colSpan={7}>
                    <EmptyState compact icon={<GitBranch />} title="No workflows found" description="Try another tab, search or filter." />
                  </td>
                </tr>
              )}
              {filteredWorkflows.map((row) => (
                <tr key={row.id}>
                  <td style={{ minWidth: 240 }}>
                    <div className="wf-cell-flex">
                      <div className="wf-icon-box">
                        {getLucideIcon(row.icon, 16, "", )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="wf-cell-title">{row.title}</div>
                        <div className="wf-cell-desc wf-clamp">{row.desc}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="wf-trigger-icon">
                      {getLucideIcon(row.triggerIcon, 14)} {row.triggerType}
                    </div>
                    <div className="wf-cell-desc">{row.triggerDesc}</div>
                  </td>
                  <td className="wf-nowrap">
                    <div>{row.lastRun}</div>
                    <div className="wf-cell-desc">{row.lastRunTime}</div>
                  </td>
                  <td className="wf-num">
                    {row.executions}
                  </td>
                  <td>
                    <StatusBadge tone={toneForStatus(row.status)} dot>{row.status}</StatusBadge>
                  </td>
                  <td align="center">
                    <div className="wf-avatar" title={row.ownerName}>
                      {row.owner}
                    </div>
                  </td>
                  <td align="right" style={{ position: "relative" }}>
                    {renderRowMenu(row)}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        ) : (
          /* ── Grid Cards View ── */
          filteredWorkflows.length === 0 ? (
            <EmptyState compact icon={<GitBranch />} title="No workflows found" description="Try another tab, search or filter." />
          ) : (
          <div className="wf-grid-layout">
            {filteredWorkflows.map((row) => (
              <div key={row.id} className="wf-grid-card">
                <div className="wf-grid-card-header">
                  <div className="wf-grid-card-icon-title">
                    <div className="wf-icon-box">
                      {getLucideIcon(row.icon, 18)}
                    </div>
                    <div className="wf-cell-title" style={{ minWidth: 0 }}>{row.title}</div>
                  </div>

                  {renderRowMenu(row)}
                </div>

                <p className="wf-grid-card-desc">{row.desc}</p>

                <div className="wf-grid-card-meta">
                  <div className="wf-grid-meta-row">
                    <span>Trigger</span>
                    <span>
                      {getLucideIcon(row.triggerIcon, 12)}
                      {row.triggerDesc}
                    </span>
                  </div>
                  <div className="wf-grid-meta-row">
                    <span>Runs recorded</span>
                    <span className="wf-num">{row.executions}</span>
                  </div>
                  <div className="wf-grid-meta-row">
                    <span>Last run</span>
                    <span>{row.lastRun} {row.lastRunTime}</span>
                  </div>
                  <div className="wf-grid-meta-row wf-grid-meta-row--foot">
                    <StatusBadge tone={toneForStatus(row.status)} dot>{row.status}</StatusBadge>
                    <div className="wf-avatar" title={row.ownerName}>
                      {row.owner}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )
        )}
      </div>

      {/* ── 4. Bottom Flowchart Banner ── */}
      <div className="wf-banner">
        <div>
          <div className="type-heading">Build smarter workflows with Corely</div>
          <div className="type-subtitle wf-banner-desc">Use triggers, conditions, and actions to automate any process.</div>
        </div>

        <div className="wf-banner-flow">
          <div className="wf-flow-step">
            <div className="wf-flow-icon">
              <Zap size={18} />
            </div>
            <div>
              <div className="wf-flow-title">1. Trigger</div>
              <div className="wf-flow-desc">Choose an event</div>
            </div>
          </div>

          <div className="wf-flow-arrow" aria-hidden="true"><ArrowRight size={16} /></div>

          <div className="wf-flow-step">
            <div className="wf-flow-icon">
              <LayoutGrid size={18} />
            </div>
            <div>
              <div className="wf-flow-title">2. Condition</div>
              <div className="wf-flow-desc">Set rules</div>
            </div>
          </div>

          <div className="wf-flow-arrow" aria-hidden="true"><ArrowRight size={16} /></div>

          <div className="wf-flow-step">
            <div className="wf-flow-icon">
              <PlayCircle size={18} />
            </div>
            <div>
              <div className="wf-flow-title">3. Action</div>
              <div className="wf-flow-desc">Define what happens</div>
            </div>
          </div>

          <div className="wf-flow-arrow" aria-hidden="true"><ArrowRight size={16} /></div>

          <div className="wf-flow-step">
            <div className="wf-flow-icon">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="wf-flow-title">4. Outcome</div>
              <div className="wf-flow-desc">Get results</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Add Workflow Modal Form ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="wf-modal-overlay">
            <motion.div className="ui-popover wf-modal-card" {...modalMotion}>
              <div className="wf-modal-header">
                <h2 className="type-heading wf-modal-title">Create new workflow</h2>
              </div>

              <form onSubmit={handleAddSubmit} className="wf-modal-form">
                <div className="wf-modal-body">
                  <div className="wf-form-group">
                    <label className="wf-form-label">Workflow title</label>
                    <input
                      type="text"
                      className="ui-input"
                      placeholder="e.g. Sales Opportunity Alerts"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="wf-form-group">
                    <label className="wf-form-label">Description</label>
                    <textarea
                      className="ui-input"
                      rows={3}
                      placeholder="Describe what this workflow automates..."
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      required
                    />
                  </div>

                  <div className="wf-form-row">
                    <div className="wf-form-group">
                      <label className="wf-form-label">Icon</label>
                      <Select
                        aria-label="Icon"
                        value={formIcon}
                        onChange={setFormIcon}
                        options={ICON_OPTIONS.map((o) => ({ ...o, icon: getLucideIcon(o.value) }))}
                      />
                    </div>

                    <div className="wf-form-group">
                      <label className="wf-form-label">Trigger rule type</label>
                      <Select
                        aria-label="Trigger rule type"
                        value={formTriggerType}
                        onChange={(v) => setFormTriggerType(v as WorkflowItem["triggerType"])}
                        options={TRIGGER_OPTIONS}
                      />
                    </div>
                  </div>

                  <div className="wf-form-group">
                    <label className="wf-form-label">Trigger scope details</label>
                    <input
                      type="text"
                      className="ui-input"
                      placeholder="e.g. Daily at 8:00 AM, Deal > $50K, Meeting Ended"
                      value={formTriggerDesc}
                      onChange={(e) => setFormTriggerDesc(e.target.value)}
                      required
                    />
                  </div>

                  <div className="wf-form-row">
                    <div className="wf-form-group">
                      <label className="wf-form-label">Initial status</label>
                      <Select
                        aria-label="Status"
                        value={formStatus}
                        onChange={(v) => setFormStatus(v as WorkflowItem["status"])}
                        options={STATUS_OPTIONS}
                      />
                    </div>

                    <div className="wf-form-group">
                      <label className="wf-form-label">Workflow owner</label>
                      <Select
                        aria-label="Workflow owner"
                        value={formOwner}
                        onChange={setFormOwner}
                        placeholder="Select an owner"
                        options={ownerOptions}
                      />
                    </div>
                  </div>
                </div>

                <div className="wf-modal-actions">
                  <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="ui-btn ui-btn--primary">
                    Create workflow
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 6. Edit Workflow Modal Form ── */}
      <AnimatePresence>
        {showEditModal && (
          <div className="wf-modal-overlay">
            <motion.div className="ui-popover wf-modal-card" {...modalMotion}>
              <div className="wf-modal-header">
                <h2 className="type-heading wf-modal-title">Edit workflow settings</h2>
              </div>

              <form onSubmit={handleEditSubmit} className="wf-modal-form">
                <div className="wf-modal-body">
                  <div className="wf-form-group">
                    <label className="wf-form-label">Workflow title</label>
                    <input
                      type="text"
                      className="ui-input"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="wf-form-group">
                    <label className="wf-form-label">Description</label>
                    <textarea
                      className="ui-input"
                      rows={3}
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      required
                    />
                  </div>

                  <div className="wf-form-row">
                    <div className="wf-form-group">
                      <label className="wf-form-label">Icon</label>
                      <Select
                        aria-label="Icon"
                        value={formIcon}
                        onChange={setFormIcon}
                        options={ICON_OPTIONS.map((o) => ({ ...o, icon: getLucideIcon(o.value) }))}
                      />
                    </div>

                    <div className="wf-form-group">
                      <label className="wf-form-label">Trigger rule type</label>
                      <Select
                        aria-label="Trigger rule type"
                        value={formTriggerType}
                        onChange={(v) => setFormTriggerType(v as WorkflowItem["triggerType"])}
                        options={TRIGGER_OPTIONS}
                      />
                    </div>
                  </div>

                  <div className="wf-form-group">
                    <label className="wf-form-label">Trigger scope details</label>
                    <input
                      type="text"
                      className="ui-input"
                      value={formTriggerDesc}
                      onChange={(e) => setFormTriggerDesc(e.target.value)}
                      required
                    />
                  </div>

                  <div className="wf-form-row">
                    <div className="wf-form-group">
                      <label className="wf-form-label">Status</label>
                      <Select
                        aria-label="Status"
                        value={formStatus}
                        onChange={(v) => setFormStatus(v as WorkflowItem["status"])}
                        options={STATUS_OPTIONS}
                      />
                    </div>

                    <div className="wf-form-group">
                      <label className="wf-form-label">Workflow owner</label>
                      <Select
                        aria-label="Workflow owner"
                        value={formOwner}
                        onChange={setFormOwner}
                        placeholder="Select an owner"
                        options={ownerOptions}
                      />
                    </div>
                  </div>
                </div>

                <div className="wf-modal-actions">
                  <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="ui-btn ui-btn--primary">
                    Save changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 7. Cascade Deletion Confirmation Modal ── */}
      <AnimatePresence>
        {showDeleteConfirm && workflowToDelete && (
          <div className="wf-modal-overlay">
            <motion.div className="ui-popover wf-modal-card wf-modal-card--sm" {...modalMotion}>
              <div className="wf-modal-header">
                <span className="wf-danger-tile"><AlertTriangle size={18} /></span>
                <h2 className="type-heading wf-modal-title">Delete workflow</h2>
              </div>

              <div className="wf-modal-body">
                <p className="wf-confirm-text">
                  Are you sure you want to delete the workflow <strong>&quot;{workflowToDelete.title}&quot;</strong>?
                </p>

                <p className="wf-confirm-note">
                  This permanently removes the workflow definition and all of its recorded runs from the activity panel.
                </p>
              </div>

              <div className="wf-modal-actions">
                <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button type="button" className="ui-btn ui-btn--destructive" onClick={handleDeleteExecute}>
                  Confirm delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
