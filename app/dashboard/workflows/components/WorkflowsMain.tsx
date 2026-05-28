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
  Search,
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
  AlertTriangle
} from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { WorkflowItem } from "./WorkflowsLayout";

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
  onImport: () => void;
}

export default function WorkflowsMain({
  workflows,
  onRun,
  onToggleStatus,
  onDelete,
  onAdd,
  onEdit,
  onImport
}: WorkflowsMainProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("all workflows");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showFilterBar, setShowFilterBar] = useState(false);

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
  const [formOwner, setFormOwner] = useState("KS");

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

  // ── Dynamic KPIs ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const activeCount = workflows.filter((w) => w.status === "Active").length;
    const runningCount = workflows.filter((w) => w.status === "Active").length > 0 ? 7 + (workflows.filter((w) => w.status === "Active").length - 6) : 0;
    
    // Sum executions
    const totalExecutionsBase = 1842;
    const currentExecs = workflows.reduce((acc, curr) => acc + curr.executions, 0);
    const initialExecs = 1620; // baseline executions sum of static INITIAL_WORKFLOWS
    const totalExecutions = totalExecutionsBase + (currentExecs - initialExecs);

    // Hours saved calculation: executions * 0.4 hours saved
    const totalHoursSaved = 128 + Math.round((currentExecs - initialExecs) * 0.4);

    return {
      activeCount,
      runningCount: Math.max(0, runningCount),
      totalExecutions,
      totalHoursSaved
    };
  }, [workflows]);

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
      if (selectedOwner !== "all" && wf.owner !== selectedOwner) return false;

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
    setFormOwner(wf.owner);
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

    let ownerBg = "#0ea5e9";
    let ownerName = user?.name || "User";
    if (formOwner === "JD") { ownerBg = "#c2410c"; ownerName = "Jane Doe"; }
    else if (formOwner === "AM") { ownerBg = "#db2777"; ownerName = "Alex Morgan"; }
    else if (formOwner === "TR") { ownerBg = "#4f46e5"; ownerName = "Taylor Rogers"; }

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
      owner: formOwner,
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
    setFormOwner("KS");
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

    let ownerBg = "#0ea5e9";
    let ownerName = user?.name || "User";
    if (formOwner === "JD") { ownerBg = "#c2410c"; ownerName = "Jane Doe"; }
    else if (formOwner === "AM") { ownerBg = "#db2777"; ownerName = "Alex Morgan"; }
    else if (formOwner === "TR") { ownerBg = "#4f46e5"; ownerName = "Taylor Rogers"; }

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
      owner: formOwner,
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

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* ── 1. Header ── */}
      <motion.div
        className="wf-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <div className="wf-title-wrap">
            <GitBranch size={28} style={{ color: "#ff6b00" }} />
            <h1 className="wf-title">Workflows</h1>
          </div>
          <p className="wf-subtitle">Automate repetitive work and orchestrate intelligent actions across your organization.</p>
        </div>
        <div className="src-header-actions" style={{ display: "flex", gap: "10px" }}>
          <button className="src-btn-secondary" onClick={onImport}>
            <Upload size={14} /> Import Workflow
          </button>
          <button className="src-btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} strokeWidth={2.5} /> New Workflow
          </button>
        </div>
      </motion.div>

      {/* ── 2. KPI Cards Grid ── */}
      <motion.div
        className="wf-kpi-grid"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Card 1 */}
        <div className="wf-kpi-card">
          <div className="wf-kpi-icon-wrap" style={{ borderColor: "#ffd7c7" }}>
            <div className="wf-kpi-icon-inner" style={{ background: "#fff3ee" }}>
              <GitBranch size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="wf-kpi-val">{stats.activeCount}</div>
            <div className="wf-kpi-label">Active Workflows</div>
            <div className="wf-kpi-trend src-trend-good" style={{ color: "#16a34a" }}>
              <ArrowUpRightIcon size={12} strokeWidth={3} /> 4 vs last month
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="wf-kpi-card">
          <div className="wf-kpi-icon-wrap" style={{ borderColor: "#ffd7c7" }}>
            <div className="wf-kpi-icon-inner" style={{ background: "#fff3ee" }}>
              <PlayCircle size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="wf-kpi-val">{stats.runningCount}</div>
            <div className="wf-kpi-label">Running Now</div>
            <div className="wf-kpi-trend src-trend-good" style={{ color: "#16a34a" }}>
              <ArrowUpRightIcon size={12} strokeWidth={3} /> Live executions
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="wf-kpi-card">
          <div className="wf-kpi-icon-wrap" style={{ borderColor: "#ffd7c7" }}>
            <div className="wf-kpi-icon-inner" style={{ background: "#fff3ee" }}>
              <CheckCircle2 size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="wf-kpi-val">{stats.totalExecutions.toLocaleString()}</div>
            <div className="wf-kpi-label">Executions (This Month)</div>
            <div className="wf-kpi-trend src-trend-good" style={{ color: "#16a34a" }}>
              <ArrowUpRightIcon size={12} strokeWidth={3} /> 23% vs last month
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="wf-kpi-card">
          <div className="wf-kpi-icon-wrap" style={{ borderColor: "#ffd7c7" }}>
            <div className="wf-kpi-icon-inner" style={{ background: "#fff3ee" }}>
              <Clock size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="wf-kpi-val">{stats.totalHoursSaved}</div>
            <div className="wf-kpi-label">Hours Saved</div>
            <div className="wf-kpi-trend src-trend-good" style={{ color: "#16a34a" }}>
              <ArrowUpRightIcon size={12} strokeWidth={3} /> 18% vs last month
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 3. Table/Grid Card ── */}
      <motion.div
        className="wf-table-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Table Header Controls */}
        <div className="wf-table-header">
          <div className="wf-tabs">
            {["all workflows", "active", "draft", "scheduled", "inactive"].map((tab) => (
              <div
                key={tab}
                className={`wf-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
                style={{ textTransform: "capitalize" }}
              >
                {tab}
              </div>
            ))}
          </div>

          <div className="wf-table-actions">
            <div className="src-search">
              <Search size={14} style={{ color: "#71717a" }} />
              <input
                type="text"
                className="src-search-input"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className={`src-filter-btn ${showFilterBar ? "active" : ""}`}
              onClick={() => setShowFilterBar((prev) => !prev)}
            >
              <Filter size={14} /> Filter
            </button>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                className="src-list-btn"
                style={viewMode === "grid" ? { background: "#fff3ee", borderColor: "#ffedd5", color: "#ff6b00" } : {}}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                className="src-list-btn"
                style={viewMode === "list" ? { background: "#fff3ee", borderColor: "#ffedd5", color: "#ff6b00" } : {}}
                onClick={() => setViewMode("list")}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Sliding Filter Bar Drawer */}
        <AnimatePresence>
          {showFilterBar && (
            <motion.div
              className="wf-filter-bar"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="wf-filter-row-inner">
                <div className="wf-filter-group">
                  <label className="wf-filter-label">Trigger Type</label>
                  <select
                    className="wf-filter-select"
                    value={selectedTrigger}
                    onChange={(e) => setSelectedTrigger(e.target.value)}
                  >
                    <option value="all">All Triggers</option>
                    <option value="Schedule">Schedule</option>
                    <option value="Event">Event</option>
                    <option value="Condition">Condition</option>
                  </select>
                </div>

                <div className="wf-filter-group">
                  <label className="wf-filter-label">Owner</label>
                  <select
                    className="wf-filter-select"
                    value={selectedOwner}
                    onChange={(e) => setSelectedOwner(e.target.value)}
                  >
                    <option value="all">All Owners</option>
                    <option value="KS">{user?.name || "User"}</option>
                    <option value="JD">Jane Doe</option>
                    <option value="AM">Alex Morgan</option>
                    <option value="TR">Taylor Rogers</option>
                  </select>
                </div>

                {(selectedTrigger !== "all" || selectedOwner !== "all") && (
                  <button
                    className="wf-filter-clear-btn"
                    onClick={() => {
                      setSelectedTrigger("all");
                      setSelectedOwner("all");
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Table List View ── */}
        {viewMode === "list" ? (
          <table className="wf-table">
            <thead>
              <tr>
                <th className="wf-th">Workflow</th>
                <th className="wf-th">Trigger</th>
                <th className="wf-th">Last Run</th>
                <th className="wf-th">Executions</th>
                <th className="wf-th">Status</th>
                <th className="wf-th" style={{ textAlign: "center" }}>Owner</th>
                <th className="wf-th" />
              </tr>
            </thead>
            <tbody>
              {filteredWorkflows.map((row) => (
                <tr key={row.id} className="wf-tr">
                  <td className="wf-td">
                    <div className="wf-cell-flex">
                      <div className="wf-icon-box" style={{ background: row.iconBg }}>
                        {getLucideIcon(row.icon, 16, "", )}
                      </div>
                      <div>
                        <div className="wf-cell-title">{row.title}</div>
                        <div className="wf-cell-desc">{row.desc}</div>
                      </div>
                    </div>
                  </td>
                  <td className="wf-td">
                    <div className="wf-trigger-icon">
                      {getLucideIcon(row.triggerIcon, 14)} {row.triggerType}
                    </div>
                    <div className="wf-cell-desc">{row.triggerDesc}</div>
                  </td>
                  <td className="wf-td">
                    <div className="src-sync-time">{row.lastRun}</div>
                    <div className="src-sync-date">{row.lastRunTime}</div>
                  </td>
                  <td className="wf-td" style={{ fontSize: 12.5, fontWeight: 600, color: "#111111" }}>
                    {row.executions}
                  </td>
                  <td className="wf-td">
                    <div className={`wf-status-badge ${row.status === "Active" ? "wf-status-active" : "wf-status-draft"}`}>
                      <div className="wf-status-dot" /> {row.status}
                    </div>
                  </td>
                  <td className="wf-td" align="center">
                    <div className="wf-avatar" style={{ background: row.ownerBg }} title={row.ownerName}>
                      {row.owner}
                    </div>
                  </td>
                  <td className="wf-td" align="right" style={{ position: "relative" }}>
                    <div className="wf-actions-container" ref={activeDropdownId === row.id ? dropdownRef : null}>
                      <button className="wf-more-btn" onClick={() => setActiveDropdownId(activeDropdownId === row.id ? null : row.id)}>
                        <MoreHorizontal size={16} />
                      </button>
                      
                      {activeDropdownId === row.id && (
                        <div className="wf-actions-dropdown">
                          <button className="wf-actions-dropdown-item" onClick={() => onRun(row.id)}>
                            <Play size={12} style={{ color: "#ff6b00" }} />
                            Run Now
                          </button>
                          <button className="wf-actions-dropdown-item" onClick={() => onToggleStatus(row.id)}>
                            <ToggleLeft size={12} />
                            Toggle Active
                          </button>
                          <button className="wf-actions-dropdown-item" onClick={() => openEditModal(row)}>
                            <Edit2 size={12} />
                            Edit Settings
                          </button>
                          <button className="wf-actions-dropdown-item delete" onClick={() => confirmDeleteWorkflow(row)}>
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* ── Grid Cards View ── */
          <div className="wf-grid-layout">
            {filteredWorkflows.map((row) => (
              <div key={row.id} className="wf-grid-card">
                <div className="wf-grid-card-header">
                  <div className="wf-grid-card-icon-title">
                    <div className="wf-icon-box" style={{ background: row.iconBg, width: 34, height: 34 }}>
                      {getLucideIcon(row.icon, 18)}
                    </div>
                    <div className="wf-grid-card-title">{row.title}</div>
                  </div>

                  <div className="wf-actions-container" ref={activeDropdownId === row.id ? dropdownRef : null}>
                    <button className="wf-more-btn" onClick={() => setActiveDropdownId(activeDropdownId === row.id ? null : row.id)}>
                      <MoreHorizontal size={16} />
                    </button>
                    
                    {activeDropdownId === row.id && (
                      <div className="wf-actions-dropdown" style={{ right: 0, top: "100%" }}>
                        <button className="wf-actions-dropdown-item" onClick={() => onRun(row.id)}>
                          <Play size={12} style={{ color: "#ff6b00" }} />
                          Run Now
                        </button>
                        <button className="wf-actions-dropdown-item" onClick={() => onToggleStatus(row.id)}>
                          <ToggleLeft size={12} />
                          Toggle Active
                        </button>
                        <button className="wf-actions-dropdown-item" onClick={() => openEditModal(row)}>
                          <Edit2 size={12} />
                          Edit Settings
                        </button>
                        <button className="wf-actions-dropdown-item delete" onClick={() => confirmDeleteWorkflow(row)}>
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="wf-grid-card-desc">{row.desc}</p>

                <div className="wf-grid-card-meta">
                  <div className="wf-grid-meta-row">
                    <span style={{ fontWeight: 700 }}>Trigger:</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                      {getLucideIcon(row.triggerIcon, 12)}
                      {row.triggerDesc}
                    </span>
                  </div>
                  <div className="wf-grid-meta-row">
                    <span style={{ fontWeight: 700 }}>Executions:</span>
                    <span style={{ fontWeight: 650 }}>{row.executions} runs</span>
                  </div>
                  <div className="wf-grid-meta-row">
                    <span style={{ fontWeight: 700 }}>Last Run:</span>
                    <span>{row.lastRun} {row.lastRunTime}</span>
                  </div>
                  <div className="wf-grid-meta-row" style={{ paddingTop: 6, borderTop: "1px dashed #f4f4f5" }}>
                    <div className={`wf-status-badge ${row.status === "Active" ? "wf-status-active" : "wf-status-draft"}`}>
                      <div className="wf-status-dot" /> {row.status}
                    </div>
                    <div className="wf-avatar" style={{ background: row.ownerBg }} title={row.ownerName}>
                      {row.owner}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── 4. Bottom Flowchart Banner ── */}
      <motion.div
        className="wf-banner"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div>
          <div className="wf-banner-title">Build Smarter Workflows with Corely</div>
          <div className="wf-banner-desc">Use triggers, conditions, and actions to automate any process.</div>
          <a href="#" className="wf-banner-link">
            Learn more <ArrowUpRightIcon size={14} strokeWidth={3} />
          </a>
        </div>
        
        <div className="wf-banner-flow">
          <div className="wf-flow-step">
            <div className="wf-flow-icon">
              <Zap size={18} style={{ color: "#ff6b00" }} fill="#ff6b00" />
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="wf-flow-title">1. Trigger</div>
              <div className="wf-flow-desc">Choose an event</div>
            </div>
          </div>
          
          <div className="wf-flow-arrow">--&gt;</div>
          
          <div className="wf-flow-step">
            <div className="wf-flow-icon">
              <LayoutGrid size={18} style={{ color: "#9333ea" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="wf-flow-title">2. Condition</div>
              <div className="wf-flow-desc">Set rules</div>
            </div>
          </div>
          
          <div className="wf-flow-arrow">--&gt;</div>
          
          <div className="wf-flow-step">
            <div className="wf-flow-icon">
              <PlayCircle size={18} style={{ color: "#3b82f6" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="wf-flow-title">3. Action</div>
              <div className="wf-flow-desc">Define what happens</div>
            </div>
          </div>
          
          <div className="wf-flow-arrow">--&gt;</div>
          
          <div className="wf-flow-step">
            <div className="wf-flow-icon">
              <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="wf-flow-title">4. Outcome</div>
              <div className="wf-flow-desc">Get results</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 5. Add Workflow Modal Form ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="wf-modal-overlay">
            <motion.div
              className="wf-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <h2 className="wf-modal-title">Create New Workflow</h2>
              
              <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="wf-form-group">
                  <label className="wf-form-label">Workflow Title</label>
                  <input
                    type="text"
                    className="wf-form-input"
                    placeholder="e.g. Sales Opportunity Alerts"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="wf-form-group">
                  <label className="wf-form-label">Description</label>
                  <textarea
                    className="wf-form-textarea"
                    placeholder="Describe what this workflow automates..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    required
                  />
                </div>

                <div className="wf-form-group">
                  <label className="wf-form-label">Visual Icon Theme</label>
                  <select
                    className="wf-form-select"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                  >
                    <option value="Mail">Mail Envelope (Blue)</option>
                    <option value="Video">Video Camera (Purple)</option>
                    <option value="Cloud">Database Cloud (Green)</option>
                    <option value="Headphones">Support Headphones (Orange)</option>
                    <option value="DollarSign">Dollar Sign (Red)</option>
                    <option value="Users">Users Team (Teal)</option>
                    <option value="LineChart">Analytics Chart (Orange)</option>
                    <option value="FileText">Document Text (Red)</option>
                  </select>
                </div>

                <div className="wf-form-group">
                  <label className="wf-form-label">Trigger Rule Type</label>
                  <select
                    className="wf-form-select"
                    value={formTriggerType}
                    onChange={(e) => setFormTriggerType(e.target.value as WorkflowItem["triggerType"])}
                  >
                    <option value="Schedule">Schedule (Daily, Hourly, etc.)</option>
                    <option value="Event">Event (When something happens)</option>
                    <option value="Condition">Condition (Logical evaluation)</option>
                  </select>
                </div>

                <div className="wf-form-group">
                  <label className="wf-form-label">Trigger Scope Details</label>
                  <input
                    type="text"
                    className="wf-form-input"
                    placeholder="e.g. Daily at 8:00 AM, Deal > $50K, Meeting Ended"
                    value={formTriggerDesc}
                    onChange={(e) => setFormTriggerDesc(e.target.value)}
                    required
                  />
                </div>

                <div className="wf-form-group">
                  <label className="wf-form-label">Initial Status</label>
                  <select
                    className="wf-form-select"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as WorkflowItem["status"])}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="wf-form-group">
                  <label className="wf-form-label">Workflow Owner</label>
                  <select
                    className="wf-form-select"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                  >
                    <option value="KS">Krishil Shah (You)</option>
                    <option value="JD">Jane Doe</option>
                    <option value="AM">Alex Morgan</option>
                    <option value="TR">Taylor Rogers</option>
                  </select>
                </div>

                <div className="wf-modal-actions">
                  <button type="button" className="wf-cancel-btn" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="wf-submit-btn">
                    Create Workflow
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
            <motion.div
              className="wf-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <h2 className="wf-modal-title">Edit Workflow Settings</h2>
              
              <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="wf-form-group">
                  <label className="wf-form-label">Workflow Title</label>
                  <input
                    type="text"
                    className="wf-form-input"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="wf-form-group">
                  <label className="wf-form-label">Description</label>
                  <textarea
                    className="wf-form-textarea"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    required
                  />
                </div>

                <div className="wf-form-group">
                  <label className="wf-form-label">Visual Icon Theme</label>
                  <select
                    className="wf-form-select"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                  >
                    <option value="Mail">Mail Envelope (Blue)</option>
                    <option value="Video">Video Camera (Purple)</option>
                    <option value="Cloud">Database Cloud (Green)</option>
                    <option value="Headphones">Support Headphones (Orange)</option>
                    <option value="DollarSign">Dollar Sign (Red)</option>
                    <option value="Users">Users Team (Teal)</option>
                    <option value="LineChart">Analytics Chart (Orange)</option>
                    <option value="FileText">Document Text (Red)</option>
                  </select>
                </div>

                <div className="wf-form-group">
                  <label className="wf-form-label">Trigger Rule Type</label>
                  <select
                    className="wf-form-select"
                    value={formTriggerType}
                    onChange={(e) => setFormTriggerType(e.target.value as WorkflowItem["triggerType"])}
                  >
                    <option value="Schedule">Schedule (Daily, Hourly, etc.)</option>
                    <option value="Event">Event (When something happens)</option>
                    <option value="Condition">Condition (Logical evaluation)</option>
                  </select>
                </div>

                <div className="wf-form-group">
                  <label className="wf-form-label">Trigger Scope Details</label>
                  <input
                    type="text"
                    className="wf-form-input"
                    value={formTriggerDesc}
                    onChange={(e) => setFormTriggerDesc(e.target.value)}
                    required
                  />
                </div>

                <div className="wf-form-group">
                  <label className="wf-form-label">Status</label>
                  <select
                    className="wf-form-select"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as WorkflowItem["status"])}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="wf-form-group">
                  <label className="wf-form-label">Workflow Owner</label>
                  <select
                    className="wf-form-select"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                  >
                    <option value="KS">Krishil Shah (You)</option>
                    <option value="JD">Jane Doe</option>
                    <option value="AM">Alex Morgan</option>
                    <option value="TR">Taylor Rogers</option>
                  </select>
                </div>

                <div className="wf-modal-actions">
                  <button type="button" className="wf-cancel-btn" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="wf-submit-btn">
                    Save Changes
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
            <motion.div
              className="wf-modal-card wf-cascade-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <h2 className="wf-modal-title wf-cascade-modal-title">
                <AlertTriangle size={20} />
                Delete Workflow
              </h2>
              
              <p style={{ fontSize: 13, color: "#3f3f46", margin: 0, lineHeight: 1.6 }}>
                Are you sure you want to delete the workflow <strong>&quot;{workflowToDelete.title}&quot;</strong>?
              </p>
              
              <p style={{ fontSize: 12, color: "#71717a", margin: 0, lineHeight: 1.5 }}>
                This is a cascade operation. It will permanently remove the workflow definition and flush all associated execution logs from the sidebar activity panel.
              </p>

              <div className="wf-modal-actions">
                <button type="button" className="wf-cancel-btn" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button type="button" className="wf-submit-btn wf-delete-confirm-btn" onClick={handleDeleteExecute}>
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Custom arrow up icon
function ArrowUpRightIcon({ size = 24, strokeWidth = 2, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17l9.2-9.2M17 17V7H7" />
    </svg>
  );
}
