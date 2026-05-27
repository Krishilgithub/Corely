"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Database,
  FileText,
  Clock,
  Activity,
  Search,
  Filter,
  List,
  MoreHorizontal,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Folder,
  Check,
  Trash2,
} from "lucide-react";

// ── Temporary MVP workspace/user IDs ─────────────────────────────────────────
// In production these come from your auth session.
const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";
const USER_ID = "00000000-0000-0000-0000-000000000002";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Source {
  id: string;
  name: string;
  type: string;
  status: "idle" | "syncing" | "synced" | "error";
  itemsIndexed: number;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  config: { email?: string };
}

// ── Brand Icons ───────────────────────────────────────────────────────────────
const GoogleDriveIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <path d="M4.93 17.57L3 21l5.25-.02 1.93-3.41H4.93z" fill="#0066DA" />
    <path d="M12 3L6.75 12h10.5L12 3z" fill="#00AC47" />
    <path d="M19.07 17.57H12l1.93 3.41L19.25 21l-2.18-3.43z" fill="#EA4335" />
    <path d="M6.75 12L3 17.57h5.93L12 12H6.75z" fill="#00832D" />
    <path d="M17.25 12L19.07 17.57 21 14.14l-3.75-6.14H12l5.25 4z" fill="#FFBA00" />
    <path d="M12 3l5.25 9H6.75L12 3z" fill="#00AC47" opacity="0.3"/>
  </svg>
);

const NotionIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 3A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3h-15Z" fill="#000000"/>
    <path d="M7 17V7h2.2l5.2 6.8V7H17v10h-2.2L9.6 10.2V17H7Z" fill="#FFFFFF"/>
  </svg>
);

function StatusBadge({ status }: { status: Source["status"] }) {
  const map: Record<
    Source["status"],
    { label: string; color: string; bg: string; icon: ReactElement }
  > = {
    idle: { label: "Idle", color: "#71717a", bg: "#f4f4f5", icon: <Clock size={12} /> },
    syncing: {
      label: "Syncing",
      color: "#2563eb",
      bg: "#eff6ff",
      icon: <Loader2 size={12} className="animate-spin" />,
    },
    synced: {
      label: "Synced",
      color: "#16a34a",
      bg: "#dcfce7",
      icon: <CheckCircle2 size={12} />,
    },
    error: {
      label: "Error",
      color: "#dc2626",
      bg: "#fee2e2",
      icon: <AlertCircle size={12} />,
    },
  };

  const s = map[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        background: s.bg,
        color: s.color,
        fontSize: 11.5,
        fontWeight: 700,
      }}
    >
      {s.icon} {s.label}
    </span>
  );
}

// ── Connect Modal ─────────────────────────────────────────────────────────────
function ConnectModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "32px",
            width: "100%",
            maxWidth: 480,
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111" }}>Add Data Source</h2>
              <p style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>
                Connect your first data source to get started.
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                border: "none",
                background: "#f4f4f5",
                borderRadius: 8,
                padding: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={16} color="#52525b" />
            </button>
          </div>

          {/* Google Drive Card */}
          <div
            style={{
              border: "1.5px solid #e4e4e7",
              borderRadius: 12,
              padding: "20px",
              marginBottom: 12,
              cursor: "pointer",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "#ff6b00";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 3px #fff3ee";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "#e4e4e7";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <GoogleDriveIcon />
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "#111" }}>Google Drive</div>
                  <div style={{ fontSize: 12.5, color: "#71717a", marginTop: 2 }}>
                    Docs, Sheets, PDFs, and more
                  </div>
                </div>
              </div>
              <a
                href={`/api/sources/google-drive/connect?workspaceId=${WORKSPACE_ID}&userId=${USER_ID}`}
                style={{
                  padding: "8px 18px",
                  background: "#ff6b00",
                  color: "#fff",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "background 0.15s",
                }}
              >
                Connect
              </a>
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {["Google Docs", "Google Sheets", "PDFs", "Text Files", "Markdown"].map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#52525b",
                    background: "#f4f4f5",
                    padding: "3px 8px",
                    borderRadius: 6,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Notion Card */}
          <div
            style={{
              border: "1.5px solid #e4e4e7",
              borderRadius: 12,
              padding: "20px",
              marginBottom: 12,
              cursor: "pointer",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "#8b5cf6";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 3px #f5f3ff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "#e4e4e7";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <NotionIcon />
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "#111" }}>Notion</div>
                  <div style={{ fontSize: 12.5, color: "#71717a", marginTop: 2 }}>
                    Wikis, documents, and workspace databases
                  </div>
                </div>
              </div>
              <a
                href={`/api/sources/notion/connect?workspaceId=${WORKSPACE_ID}&userId=${USER_ID}`}
                style={{
                  padding: "8px 18px",
                  background: "#8b5cf6",
                  color: "#fff",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "background 0.15s",
                }}
              >
                Connect
              </a>
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {["Pages", "Databases", "Wikis", "Docs", "Nested Blocks"].map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#52525b",
                    background: "#f4f4f5",
                    padding: "3px 8px",
                    borderRadius: 6,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Coming soon connectors */}
          {[
            { name: "Slack", desc: "Messages, channels, and files" },
            { name: "Confluence", desc: "Spaces, pages, and comments" },
          ].map((c) => (
            <div
              key={c.name}
              style={{
                border: "1px solid #f4f4f5",
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: 0.6,
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "#71717a" }}>{c.desc}</div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#71717a",
                  background: "#f4f4f5",
                  padding: "4px 10px",
                  borderRadius: 20,
                }}
              >
                Coming Soon
              </span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SourcesMain() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [configuringSourceId, setConfiguringSourceId] = useState<string | null>(null);

  // New state for tabs, dropdowns, toast notifications, and disconnect modals
  const [activeTab, setActiveTab] = useState<"all" | "synced" | "syncing">("all");
  const [activeDropdownSourceId, setActiveDropdownSourceId] = useState<string | null>(null);
  const [disconnectingSource, setDisconnectingSource] = useState<Source | null>(null);
  const [managingSource, setManagingSource] = useState<Source | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" } | null>(null);

  const showToast = useCallback((text: string, type: "success" | "info" = "success") => {
    setToastMessage({ text, type });
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Close active actions dropdown if user clicks anywhere outside in window
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownSourceId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // ── Fetch sources from API ─────────────────────────────────────
  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch(`/api/sources?workspaceId=${WORKSPACE_ID}`);
      if (!res.ok) return;
      const data = await res.json();
      setSources(data.sources ?? []);
    } catch (err) {
      console.error("Failed to fetch sources:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Poll for sync progress ─────────────────────────────────────
  useEffect(() => {
    fetchSources();
    // Poll every 5 seconds to update syncing statuses
    const interval = setInterval(fetchSources, 5000);
    return () => clearInterval(interval);
  }, [fetchSources]);

  // ── Detect successful connection redirect ──────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    if (connected === "google_drive") {
      const sourceId = params.get("sourceId");
      if (sourceId) {
        setConfiguringSourceId(sourceId);
      } else {
        showToast("Google Drive connected! Sync in progress...", "success");
      }
      window.history.replaceState({}, "", "/dashboard/sources");
    } else if (connected === "notion") {
      showToast("Notion connected! Sync in progress...", "success");
      window.history.replaceState({}, "", "/dashboard/sources");
    }
  }, [showToast]);

  // ── Trigger manual re-sync ─────────────────────────────────────
  const handleSync = async (sourceId: string) => {
    try {
      const res = await fetch(`/api/sources/${sourceId}/sync`, { method: "POST" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to trigger sync");
      }
      showToast("Ingestion sync triggered successfully.", "success");
      fetchSources();
    } catch (err) {
      console.error("Sync error:", err);
      showToast((err as Error).message || "Failed to start sync", "info");
    }
  };

  // ── Filter sources based on Tab and Search query ───────────────
  const filtered = sources
    .filter((s) => {
      if (activeTab === "synced") return s.status === "synced";
      if (activeTab === "syncing") return s.status === "syncing";
      return true;
    })
    .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalIndexed = sources.reduce((sum, s) => sum + s.itemsIndexed, 0);
  const syncedCount = sources.filter((s) => s.status === "synced").length;
  const syncingCount = sources.filter((s) => s.status === "syncing").length;

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* ── Dynamic Success/Info Toast ───────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed",
              top: 24,
              right: 24,
              zIndex: 9999,
              background: "#111",
              color: "#fff",
              padding: "14px 20px",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13.5,
              fontWeight: 600,
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            }}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 size={18} color="#4ade80" />
            ) : (
              <AlertCircle size={18} color="#60a5fa" />
            )}
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ───────────────────────────────────────────────── */}
      <motion.div
        className="src-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="src-title">Sources</h1>
          <p className="src-subtitle">Connect, manage, and monitor all your data sources.</p>
        </div>
        <div className="src-header-actions">
          <button
            className="src-btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} strokeWidth={2.5} /> Add Source
          </button>
          <button
            className="src-btn-secondary"
            onClick={fetchSources}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <motion.div
        className="src-kpi-grid"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="src-kpi-card">
          <div className="src-kpi-icon-wrap">
            <div className="src-kpi-icon-inner">
              <Database size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="src-kpi-val">{sources.length}</div>
            <div className="src-kpi-label">Connected Sources</div>
            <div className="src-kpi-trend src-trend-good">
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: syncingCount > 0 ? "#2563eb" : "#16a34a" }} />
              {syncingCount > 0 ? `${syncingCount} syncing` : "All systems operational"}
            </div>
          </div>
        </div>
        <div className="src-kpi-card">
          <div className="src-kpi-icon-wrap">
            <div className="src-kpi-icon-inner">
              <FileText size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="src-kpi-val">
              {totalIndexed > 1000
                ? `${(totalIndexed / 1000).toFixed(1)}K`
                : totalIndexed}
            </div>
            <div className="src-kpi-label">Documents Indexed</div>
            <div className="src-kpi-trend src-trend-good">
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
              Across all sources
            </div>
          </div>
        </div>
        <div className="src-kpi-card">
          <div className="src-kpi-icon-wrap">
            <div className="src-kpi-icon-inner">
              <Clock size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="src-kpi-val">
              {sources.length > 0
                ? `${Math.round((syncedCount / sources.length) * 100)}%`
                : "—"}
            </div>
            <div className="src-kpi-label">Sync Success Rate</div>
            <div className="src-kpi-trend src-trend-good">
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
              {syncedCount}/{sources.length} synced
            </div>
          </div>
        </div>
        <div className="src-kpi-card">
          <div className="src-kpi-icon-wrap">
            <div className="src-kpi-icon-inner">
              <Activity size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="src-kpi-val">{syncingCount > 0 ? syncingCount : 0}</div>
            <div className="src-kpi-label">Active Syncs</div>
            <div className="src-kpi-trend src-trend-good">
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: syncingCount > 0 ? "#2563eb" : "#16a34a" }} />
              {syncingCount > 0 ? "In progress" : "All idle"}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Table ─────────────────────────────────────────────────── */}
      <motion.div
        className="src-table-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="src-table-header">
          <div className="src-tabs">
            <button
              onClick={() => setActiveTab("all")}
              className={`src-tab ${activeTab === "all" ? "active" : ""}`}
              style={{ background: "transparent", border: "none", font: "inherit", cursor: "pointer" }}
            >
              All Sources <span className="src-tab-count">{sources.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("synced")}
              className={`src-tab ${activeTab === "synced" ? "active" : ""}`}
              style={{ background: "transparent", border: "none", font: "inherit", cursor: "pointer" }}
            >
              Synced <span className="src-tab-count">{syncedCount}</span>
            </button>
            <button
              onClick={() => setActiveTab("syncing")}
              className={`src-tab ${activeTab === "syncing" ? "active" : ""}`}
              style={{ background: "transparent", border: "none", font: "inherit", cursor: "pointer" }}
            >
              Syncing <span className="src-tab-count">{syncingCount}</span>
            </button>
          </div>
          <div className="src-table-actions">
            <div className="src-search">
              <Search size={14} style={{ color: "#71717a" }} />
              <input
                type="text"
                className="src-search-input"
                placeholder="Search sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="src-filter-btn">
              <Filter size={14} /> Filter
            </button>
            <button className="src-list-btn">
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Empty state */}
        {!loading && sources.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 20px",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#fff3ee",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Database size={28} color="#ff6b00" />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 6 }}>
                No sources connected yet
              </div>
              <div style={{ fontSize: 13.5, color: "#71717a", marginBottom: 20 }}>
                Connect Google Drive to start indexing your company data.
              </div>
              <button
                className="src-btn-primary"
                onClick={() => setShowModal(true)}
              >
                <Plus size={16} strokeWidth={2.5} /> Add your first source
              </button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ padding: "24px 20px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 56,
                  background: "#f4f4f5",
                  borderRadius: 8,
                  marginBottom: 8,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        )}

        {/* Data table */}
        {!loading && filtered.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table className="src-table">
            <thead>
              <tr>
                <th className="src-th">Source</th>
                <th className="src-th">Type</th>
                <th className="src-th">Status</th>
                <th className="src-th">Items Indexed</th>
                <th className="src-th">Last Synced</th>
                <th className="src-th" style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((source) => (
                <tr key={source.id} className="src-tr">
                  <td className="src-td">
                    <div className="src-source-cell">
                      <div className="src-source-icon">
                        {source.type === "google_drive" && <GoogleDriveIcon />}
                        {source.type === "notion" && <NotionIcon />}
                      </div>
                      <div>
                        <div className="src-source-name">{source.name}</div>
                        <div className="src-source-url">
                          {(source.config as { email?: string })?.email ??
                            (source.config as { ownerEmail?: string })?.ownerEmail ??
                            source.type}
                          {(source.config as { folderName?: string })?.folderName && (
                            <span style={{ color: "#ff6b00", fontWeight: 700, marginLeft: 6 }}>
                              • Folder: {(source.config as { folderName?: string }).folderName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="src-td">
                    <span
                      className="src-type-pill"
                      style={{
                        background:
                          source.type === "google_drive"
                            ? "#dcfce7"
                            : source.type === "notion"
                            ? "#f5f3ff"
                            : "#f4f4f5",
                        color:
                          source.type === "google_drive"
                            ? "#16a34a"
                            : source.type === "notion"
                            ? "#8b5cf6"
                            : "#52525b",
                      }}
                    >
                      {source.type === "google_drive"
                        ? "Storage"
                        : source.type === "notion"
                        ? "Workspace"
                        : source.type}
                    </span>
                  </td>
                  <td className="src-td">
                    <StatusBadge status={source.status} />
                    {source.errorMessage && (
                      <div
                        style={{ fontSize: 11, color: "#dc2626", marginTop: 4, maxWidth: 160 }}
                        title={source.errorMessage}
                      >
                        {source.errorMessage.slice(0, 50)}...
                      </div>
                    )}
                  </td>
                  <td className="src-td">
                    <div className="src-data-num">
                      {source.itemsIndexed.toLocaleString()}
                    </div>
                    <div className="src-data-type">documents</div>
                  </td>
                  <td className="src-td">
                    {source.lastSyncedAt ? (
                      <>
                        <div className="src-sync-time">
                          {new Date(source.lastSyncedAt).toLocaleDateString()}
                        </div>
                        <div className="src-sync-date">
                          {new Date(source.lastSyncedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="src-sync-date">Not yet synced</div>
                    )}
                  </td>
                  <td className="src-td" style={{ position: "relative" }}>
                    <div className="src-action-cell" style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", position: "relative" }}>
                      {source.type === "google_drive" && (
                        <button
                          title="Configure folder sync restriction"
                          onClick={() => setConfiguringSourceId(source.id)}
                          style={{
                            border: "1px solid #e4e4e7",
                            background: "#fff",
                            borderRadius: 6,
                            padding: "4px 8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "#52525b",
                          }}
                        >
                          <Folder size={12} style={{ color: "#ff6b00" }} />
                          Configure
                        </button>
                      )}
                      <button
                        title="Sync now"
                        disabled={source.status === "syncing"}
                        onClick={() => handleSync(source.id)}
                        style={{
                          border: "1px solid #e4e4e7",
                          background: "#fff",
                          borderRadius: 6,
                          padding: "4px 8px",
                          cursor: source.status === "syncing" ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: "#52525b",
                        }}
                      >
                        <RefreshCw
                          size={12}
                          className={source.status === "syncing" ? "animate-spin" : ""}
                        />
                        {source.status === "syncing" ? "Syncing..." : "Sync"}
                      </button>
                      <button
                        title="Manage indexed documents"
                        onClick={() => setManagingSource(source)}
                        style={{
                          border: "1px solid #ff6b00",
                          background: "#fff3ee",
                          borderRadius: 6,
                          padding: "4px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "#ff6b00",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#ffd7c7")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff3ee")}
                      >
                        <FileText size={12} />
                        Manage
                      </button>
                      <button
                        title="More options"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownSourceId(
                            activeDropdownSourceId === source.id ? null : source.id
                          );
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          padding: 4,
                        }}
                      >
                        <MoreHorizontal size={16} color="#a1a1aa" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdownSourceId === source.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "100%",
                            marginTop: 6,
                            background: "#ffffff",
                            border: "1px solid #e4e4e7",
                            borderRadius: 8,
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                            zIndex: 50,
                            minWidth: 160,
                            padding: 4,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              handleSync(source.id);
                              setActiveDropdownSourceId(null);
                            }}
                            disabled={source.status === "syncing"}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 12px",
                              background: "none",
                              border: "none",
                              borderRadius: 6,
                              width: "100%",
                              textAlign: "left",
                              fontSize: 12.5,
                              fontWeight: 500,
                              color: source.status === "syncing" ? "#a1a1aa" : "#3f3f46",
                              cursor: source.status === "syncing" ? "not-allowed" : "pointer",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              if (source.status !== "syncing") e.currentTarget.style.background = "#f4f4f5";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "none";
                            }}
                          >
                            <RefreshCw size={13} className={source.status === "syncing" ? "animate-spin" : ""} />
                            Sync Now
                          </button>
                          {source.type === "google_drive" && (
                            <button
                              onClick={() => {
                                setConfiguringSourceId(source.id);
                                setActiveDropdownSourceId(null);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 12px",
                                background: "none",
                                border: "none",
                                borderRadius: 6,
                                width: "100%",
                                textAlign: "left",
                                fontSize: 12.5,
                                fontWeight: 500,
                                color: "#3f3f46",
                                cursor: "pointer",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f4f4f5";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "none";
                              }}
                            >
                              <Folder size={13} style={{ color: "#ff6b00" }} />
                              Configure Scope
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setManagingSource(source);
                              setActiveDropdownSourceId(null);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 12px",
                              background: "none",
                              border: "none",
                              borderRadius: 6,
                              width: "100%",
                              textAlign: "left",
                              fontSize: 12.5,
                              fontWeight: 500,
                              color: "#3f3f46",
                              cursor: "pointer",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#f4f4f5";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "none";
                            }}
                          >
                            <FileText size={13} style={{ color: "#ff6b00" }} />
                            Manage Documents
                          </button>
                          <div style={{ height: 1, background: "#e4e4e7", margin: "4px 0" }} />
                          <button
                            onClick={() => {
                              setDisconnectingSource(source);
                              setActiveDropdownSourceId(null);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 12px",
                              background: "none",
                              border: "none",
                              borderRadius: 6,
                              width: "100%",
                              textAlign: "left",
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: "#ef4444",
                              cursor: "pointer",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#fee2e2";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "none";
                            }}
                          >
                            <X size={13} />
                            Disconnect
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="src-table-footer">
            Showing {filtered.length} of {sources.length} source
            {sources.length !== 1 ? "s" : ""}
          </div>
        )}
      </motion.div>

      {/* ── Connect Modal ─────────────────────────────────────────── */}
      {showModal && <ConnectModal onClose={() => setShowModal(false)} />}

      {/* ── Folder Configuration Modal ───────────────────────────── */}
      {configuringSourceId && (
        <ConfigureFolderModal
          sourceId={configuringSourceId}
          onClose={() => setConfiguringSourceId(null)}
          onConfigSaved={fetchSources}
        />
      )}

      {/* ── Disconnect Confirmation Modal ─────────────────────────── */}
      <AnimatePresence>
        {disconnectingSource && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setDisconnectingSource(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "28px",
                width: "100%",
                maxWidth: 480,
                boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "start", gap: 14, marginBottom: 20 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#fee2e2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <AlertCircle size={20} color="#dc2626" />
                </div>
                <div>
                  <h3 style={{ fontSize: 17.5, fontWeight: 800, color: "#111" }}>
                    Disconnect Data Source?
                  </h3>
                  <p style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>
                    Are you sure you want to disconnect <strong style={{ color: "#18181b" }}>{disconnectingSource.name}</strong>?
                  </p>
                </div>
              </div>

              {/* Consequence Box */}
              <div
                style={{
                  background: "#fafafa",
                  border: "1.5px dashed #f3f4f6",
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 24,
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>
                  This action is permanent and will:
                </div>
                <ul
                  style={{
                    fontSize: 12,
                    color: "#52525b",
                    margin: 0,
                    paddingLeft: 18,
                    lineHeight: "1.6",
                  }}
                >
                  <li>Revoke access tokens and stop all background syncing.</li>
                  <li>Permanently erase all {disconnectingSource.itemsIndexed.toLocaleString()} indexed documents.</li>
                  <li>Wipe out all database text chunks and search vectors.</li>
                  <li>Remove it from workspace memory and chat history references.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "end", gap: 10 }}>
                <button
                  onClick={() => setDisconnectingSource(null)}
                  disabled={deleting}
                  style={{
                    padding: "8px 16px",
                    background: "#fff",
                    border: "1px solid #e4e4e7",
                    color: "#52525b",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: deleting ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      const res = await fetch(`/api/sources/${disconnectingSource.id}`, {
                        method: "DELETE",
                      });
                      if (!res.ok) {
                        throw new Error("Failed to disconnect source");
                      }
                      fetchSources();
                      setDisconnectingSource(null);
                      showToast(`Source "${disconnectingSource.name}" disconnected and deleted successfully.`);
                    } catch (err) {
                      console.error("Failed to delete source:", err);
                      showToast("Error disconnecting source. Please check backend logs.", "info");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                  style={{
                    padding: "8px 18px",
                    background: deleting ? "#fca5a5" : "#ef4444",
                    border: "none",
                    color: "#fff",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: deleting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {deleting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Disconnecting...
                    </>
                  ) : (
                    "Yes, Disconnect"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Manage Documents Modal ── */}
      <AnimatePresence>
        {managingSource && (
          <ManageDocumentsModal
            source={managingSource}
            onClose={() => setManagingSource(null)}
            onDocumentsChanged={fetchSources}
            showToast={showToast}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Google Drive Folder Selector Modal ─────────────────────────────────────────

interface Folder {
  id: string;
  name: string;
  parents?: string[];
}

function ConfigureFolderModal({
  sourceId,
  onClose,
  onConfigSaved,
}: {
  sourceId: string;
  onClose: () => void;
  onConfigSaved: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncOption, setSyncOption] = useState<"all" | "folder">("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sourceName, setSourceName] = useState("Google Drive");

  // Load existing source configuration and list of folders
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        // 1. Fetch current status/config
        const sourceRes = await fetch(`/api/sources/${sourceId}/status`);
        if (!sourceRes.ok) return;
        const sourceData = await sourceRes.json();
        if (!active) return;
        setSourceName(sourceData.name || "Google Drive");

        const config = sourceData.config || {};
        if (config.folderId) {
          setSyncOption("folder");
          setSelectedFolderId(config.folderId);
        }

        // 2. Fetch folder list from Drive
        const foldersRes = await fetch(`/api/sources/${sourceId}/folders`);
        if (!foldersRes.ok) return;
        const foldersData = await foldersRes.json();
        if (!active) return;
        
        const folderList = foldersData.folders || [];
        setFolders(folderList);
        setFilteredFolders(folderList);
      } catch (err) {
        console.error("Failed to load folder configuration data:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [sourceId]);

  // Handle Search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFolders(folders);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredFolders(
        folders.filter((f) => f.name.toLowerCase().includes(query))
      );
    }
  }, [searchQuery, folders]);

  // Save the selected option and folder to config, then trigger manual sync
  const handleSave = async () => {
    setSaving(true);
    try {
      const folder =
        syncOption === "folder"
          ? folders.find((f) => f.id === selectedFolderId)
          : null;

      const configRes = await fetch(`/api/sources/${sourceId}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId: folder?.id || null,
          folderName: folder?.name || null,
        }),
      });

      if (!configRes.ok) {
        throw new Error("Failed to save folder selection");
      }

      // Automatically trigger sync so the selected folder starts ingesting immediately
      await fetch(`/api/sources/${sourceId}/sync`, { method: "POST" });

      onConfigSaved();
      onClose();
    } catch (err) {
      console.error("Error saving folder configuration:", err);
      alert("Failed to save config. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "28px",
            width: "100%",
            maxWidth: 540,
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18.5, fontWeight: 800, color: "#111" }}>Configure Folder Sync</h2>
              <p style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>
                Choose which folders to ingest from <strong style={{ color: "#18181b" }}>{sourceName}</strong>.
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                border: "none",
                background: "#f4f4f5",
                borderRadius: 8,
                padding: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={15} color="#52525b" />
            </button>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 12 }}>
              <Loader2 size={24} className="animate-spin" style={{ color: "#ff6b00" }} />
              <span style={{ fontSize: 13.5, color: "#71717a", fontWeight: 500 }}>Connecting to Google Drive and fetching folders...</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18, overflow: "hidden" }}>
              {/* Radio Group */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Option 1: Sync Everything */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    border: syncOption === "all" ? "1.5px solid #ff6b00" : "1.5px solid #e4e4e7",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: syncOption === "all" ? "#fff3ee" : "#fff",
                    transition: "all 0.15s",
                  }}
                >
                  <input
                    type="radio"
                    name="syncOption"
                    value="all"
                    checked={syncOption === "all"}
                    onChange={() => setSyncOption("all")}
                    style={{ accentColor: "#ff6b00", width: 15, height: 15 }}
                  />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111" }}>Ingest all files and items</div>
                    <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                      Sync all supported documents across the entire Google Drive space.
                    </div>
                  </div>
                </label>

                {/* Option 2: Sync Specific Folder */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    border: syncOption === "folder" ? "1.5px solid #ff6b00" : "1.5px solid #e4e4e7",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: syncOption === "folder" ? "#fff3ee" : "#fff",
                    transition: "all 0.15s",
                  }}
                >
                  <input
                    type="radio"
                    name="syncOption"
                    value="folder"
                    checked={syncOption === "folder"}
                    onChange={() => setSyncOption("folder")}
                    style={{ accentColor: "#ff6b00", width: 15, height: 15 }}
                  />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111" }}>Sync a specific folder only</div>
                    <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                      Restrict sync scope strictly to a specific folder and its nested subfolders.
                    </div>
                  </div>
                </label>
              </div>

              {/* Folder Selector Explorer Section */}
              {syncOption === "folder" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}
                >
                  {/* Search bar */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid #e4e4e7",
                    borderRadius: 8,
                    padding: "6px 12px",
                    background: "#f9f9fb"
                  }}>
                    <Search size={13.5} style={{ color: "#71717a" }} />
                    <input
                      type="text"
                      placeholder="Search folders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        border: "none",
                        background: "transparent",
                        outline: "none",
                        fontSize: 12.5,
                        width: "100%",
                        color: "#18181b"
                      }}
                    />
                  </div>

                  {/* Folder List Scroll Pane */}
                  <div style={{
                    border: "1.5px solid #e4e4e7",
                    borderRadius: 10,
                    maxHeight: 220,
                    overflowY: "auto",
                    background: "#fff"
                  }}>
                    {filteredFolders.length === 0 ? (
                      <div style={{ padding: "30px 16px", color: "#71717a", fontSize: 12.5, textAlign: "center" }}>
                        No folders found matching &quot;{searchQuery}&quot;
                      </div>
                    ) : (
                      filteredFolders.map((f) => {
                        const isSelected = selectedFolderId === f.id;
                        return (
                          <div
                            key={f.id}
                            onClick={() => setSelectedFolderId(f.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              borderBottom: "1px solid #f4f4f5",
                              cursor: "pointer",
                              background: isSelected ? "#fff8f6" : "transparent",
                              transition: "background 0.15s"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                              <Folder size={15} style={{ color: isSelected ? "#ff6b00" : "#a1a1aa", flexShrink: 0 }} />
                              <span style={{
                                fontSize: 13,
                                fontWeight: isSelected ? 700 : 500,
                                color: isSelected ? "#ff6b00" : "#18181b",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}>
                                {f.name}
                              </span>
                            </div>
                            {isSelected && (
                              <Check size={14} style={{ color: "#ff6b00", flexShrink: 0 }} />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "end", gap: 10, marginTop: 10 }}>
                <button
                  onClick={onClose}
                  disabled={saving}
                  style={{
                    padding: "8px 16px",
                    background: "#fff",
                    border: "1px solid #e4e4e7",
                    color: "#52525b",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || (syncOption === "folder" && !selectedFolderId)}
                  style={{
                    padding: "8px 18px",
                    background: saving || (syncOption === "folder" && !selectedFolderId) ? "#e4e4e7" : "#ff6b00",
                    border: "none",
                    color: "#fff",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: saving || (syncOption === "folder" && !selectedFolderId) ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save & Ingest"
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Manage Documents Modal Component ─────────────────────────────────────────

interface ManageDoc {
  id: string;
  title: string;
  fileType: string | null;
  externalId: string;
  rawContent: string | null;
  indexedAt: string | null;
  updatedAt: string;
}

function ManageDocumentsModal({
  source,
  onClose,
  onDocumentsChanged,
  showToast,
}: {
  source: Source;
  onClose: () => void;
  onDocumentsChanged: () => void;
  showToast: (text: string, type?: "success" | "info") => void;
}) {
  const [docs, setDocs] = useState<ManageDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [searchDocQuery, setSearchDocQuery] = useState("");
  
  // Add manual form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState("manual_upload");
  const [newDocContent, setNewDocContent] = useState("");
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [submitStep, setSubmitStep] = useState(0); // 0: Idle, 1: Chunking, 2: Embedding, 3: Saving
  
  // Document deleting states
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/documents?sourceId=${source.id}`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } catch (e) {
      console.error("Failed to fetch documents for source:", e);
    } finally {
      setLoadingDocs(false);
    }
  }, [source.id]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Handle Delete
  const handleDeleteDoc = async (docId: string, docTitle: string) => {
    setDeletingDocId(docId);
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setDocs((prev) => prev.filter((d) => d.id !== docId));
        showToast(`Document "${docTitle}" deleted successfully.`, "success");
        onDocumentsChanged();
      } else {
        throw new Error("Failed to delete document");
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to delete document.", "info");
    } finally {
      setDeletingDocId(null);
    }
  };

  // Handle Manual Submit
  const handleAddDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim()) {
      showToast("Title and content are required.", "info");
      return;
    }

    setSubmittingDoc(true);
    setSubmitStep(1); // Analyzing & Chunking

    // Visual step sequence for a premium feeling
    setTimeout(() => {
      setSubmitStep(2); // Generating vector embeddings
    }, 800);

    try {
      const res = await fetch(`/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: source.id,
          title: newDocTitle.trim(),
          fileType: newDocType.trim() || "manual_upload",
          rawContent: newDocContent.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmitStep(3); // Finalizing
        setTimeout(() => {
          setDocs((prev) => [data.document, ...prev]);
          showToast(`Document "${newDocTitle}" indexed successfully!`, "success");
          
          // Reset form
          setNewDocTitle("");
          setNewDocContent("");
          setShowAddForm(false);
          setSubmittingDoc(false);
          setSubmitStep(0);
          onDocumentsChanged();
        }, 600);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to index manual document");
      }
    } catch (err) {
      console.error(err);
      showToast((err as Error).message || "Failed to add manual document", "info");
      setSubmittingDoc(false);
      setSubmitStep(0);
    }
  };

  const filteredDocs = docs.filter((d) =>
    d.title.toLowerCase().includes(searchDocQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        backdropFilter: "blur(5px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "90%",
          maxWidth: 1000,
          height: "80vh",
          maxHeight: 700,
          boxShadow: "0 28px 75px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 32px",
            borderBottom: "1px solid #f4f4f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(to right, #fafafa, #ffffff)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: "#18181b" }}>
                Manage Source Documents
              </h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#ff6b00",
                  background: "#fff3ee",
                  padding: "3px 10px",
                  borderRadius: 12,
                }}
              >
                {source.name}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>
              View, add manual contents, or purge documents currently indexed under this connector.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "#f4f4f5",
              borderRadius: 10,
              padding: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e4e4e7")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f4f4f5")}
          >
            <X size={16} color="#52525b" />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, display: "flex", minHeight: 0, background: "#ffffff" }}>
          {/* Left Column: Documents List */}
          <div
            style={{
              flex: 1.3,
              borderRight: "1px solid #f4f4f5",
              display: "flex",
              flexDirection: "column",
              padding: "24px 32px",
              minWidth: 0,
            }}
          >
            {/* Table Header and Search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#f4f4f5",
                  borderRadius: 10,
                  padding: "8px 14px",
                  flex: 1,
                  border: "1.5px solid transparent",
                  transition: "border-color 0.15s",
                }}
                onFocusCapture={(e) => (e.currentTarget.style.borderColor = "#ff6b00")}
                onBlurCapture={(e) => (e.currentTarget.style.borderColor = "transparent")}
              >
                <Search size={14} color="#71717a" style={{ marginRight: 8 }} />
                <input
                  type="text"
                  placeholder="Search indexed files by title..."
                  value={searchDocQuery}
                  onChange={(e) => setSearchDocQuery(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    width: "100%",
                    fontSize: 13,
                    color: "#18181b",
                  }}
                />
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  border: "none",
                  background: showAddForm ? "#f4f4f5" : "#ff6b00",
                  color: showAddForm ? "#52525b" : "#fff",
                  borderRadius: 10,
                  padding: "10px 16px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "background 0.15s, transform 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = showAddForm ? "#e4e4e7" : "#e05e00";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = showAddForm ? "#f4f4f5" : "#ff6b00";
                }}
              >
                {showAddForm ? (
                  <>View Document List</>
                ) : (
                  <>
                    <Plus size={14} strokeWidth={2.5} /> Add Document
                  </>
                )}
              </button>
            </div>

            {/* Main view container */}
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {loadingDocs ? (
                // Loading State
                <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "20px 0" }}>
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      style={{
                        height: 52,
                        background: "#fafafa",
                        borderRadius: 10,
                        border: "1px solid #f4f4f5",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                  ))}
                </div>
              ) : filteredDocs.length === 0 ? (
                // Empty State
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    padding: 40,
                    textAlign: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "#fff3ee",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={24} color="#ff6b00" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "#18181b" }}>
                      No documents found
                    </div>
                    <div style={{ fontSize: 13, color: "#71717a", marginTop: 4, maxWidth: 280 }}>
                      {searchDocQuery
                        ? "We couldn't find any documents matching your search term."
                        : "There are no files indexed under this source. Add a manual document to get started."}
                    </div>
                  </div>
                </div>
              ) : (
                // Documents List
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid #f4f4f5" }}>
                      <th style={{ fontSize: 11.5, fontWeight: 700, color: "#71717a", padding: "10px 8px" }}>
                        Title
                      </th>
                      <th style={{ fontSize: 11.5, fontWeight: 700, color: "#71717a", padding: "10px 8px" }}>
                        Type
                      </th>
                      <th style={{ fontSize: 11.5, fontWeight: 700, color: "#71717a", padding: "10px 8px" }}>
                        Indexed Date
                      </th>
                      <th style={{ fontSize: 11.5, fontWeight: 700, color: "#71717a", padding: "10px 8px", textAlign: "center" }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((doc) => {
                      const isDeleting = deletingDocId === doc.id;
                      return (
                        <tr
                          key={doc.id}
                          style={{
                            borderBottom: "1px solid #f4f4f5",
                            opacity: isDeleting ? 0.5 : 1,
                            background: isDeleting ? "#fafafa" : "transparent",
                          }}
                        >
                          <td style={{ padding: "12px 8px", maxWidth: 220 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#18181b",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={doc.title}
                            >
                              {doc.title}
                            </div>
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 12,
                                background: doc.fileType === "manual_upload" ? "#fff3ee" : "#f4f4f5",
                                color: doc.fileType === "manual_upload" ? "#ff6b00" : "#52525b",
                              }}
                            >
                              {doc.fileType === "manual_upload"
                                ? "Manual"
                                : doc.fileType
                                ? doc.fileType.toUpperCase()
                                : "FILE"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 8px", fontSize: 12, color: "#71717a" }}>
                            {doc.indexedAt
                              ? new Date(doc.indexedAt).toLocaleDateString()
                              : new Date(doc.updatedAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "center" }}>
                            <button
                              onClick={() => handleDeleteDoc(doc.id, doc.title)}
                              disabled={isDeleting}
                              style={{
                                border: "none",
                                background: "transparent",
                                padding: 6,
                                cursor: isDeleting ? "not-allowed" : "pointer",
                                borderRadius: 6,
                                color: "#ef4444",
                                transition: "background 0.15s",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              title="Delete document"
                            >
                              {isDeleting ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Column: Statistics or Form Panel */}
          <div
            style={{
              flex: 0.8,
              padding: "24px 32px",
              background: "#fafafa",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              overflowY: "auto",
            }}
          >
            {showAddForm ? (
              // Manual Document Form
              <form onSubmit={handleAddDocSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#18181b", display: "flex", alignItems: "center", gap: 6 }}>
                    <Plus size={16} strokeWidth={2.5} style={{ color: "#ff6b00" }} />
                    Add Manual Document
                  </h3>
                  <p style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                    Paste plain text content to index it manually under this source container.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#52525b" }}>Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q3 Strategic Budget Ingestion"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    disabled={submittingDoc}
                    style={{
                      background: "#fff",
                      border: "1.5px solid #e4e4e7",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 13,
                      color: "#18181b",
                      outline: "none",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#ff6b00")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#e4e4e7")}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#52525b" }}>File Type Label</label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    disabled={submittingDoc}
                    style={{
                      background: "#fff",
                      border: "1.5px solid #e4e4e7",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 13,
                      color: "#18181b",
                      outline: "none",
                    }}
                  >
                    <option value="manual_upload">Manual Upload</option>
                    <option value="pdf">PDF Document</option>
                    <option value="txt">Text File (TXT)</option>
                    <option value="md">Markdown Ingestion</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#52525b" }}>Raw Content</label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Paste plain text content here. We will automatically chunk and embed it..."
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    disabled={submittingDoc}
                    style={{
                      background: "#fff",
                      border: "1.5px solid #e4e4e7",
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 13,
                      color: "#18181b",
                      fontFamily: "inherit",
                      resize: "none",
                      outline: "none",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#ff6b00")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#e4e4e7")}
                  />
                </div>

                {submittingDoc ? (
                  // Premium Embedding Progress Stepper
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #e4e4e7",
                      borderRadius: 10,
                      padding: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Loader2 size={14} className="animate-spin" style={{ color: "#ff6b00" }} />
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#18181b" }}>
                        {submitStep === 1
                          ? "Analyzing & chunking text..."
                          : submitStep === 2
                          ? "Generating vector embeddings..."
                          : "Indexing document chunks..."}
                      </div>
                    </div>
                    {/* Pulsing Progress Bar */}
                    <div style={{ height: 4, width: "100%", background: "#f4f4f5", borderRadius: 2, overflow: "hidden" }}>
                      <motion.div
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        style={{ height: "100%", width: "50%", background: "#ff6b00", borderRadius: 2 }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    style={{
                      background: "#ff6b00",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 18px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "background 0.15s",
                      textAlign: "center",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#e05e00")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#ff6b00")}
                  >
                    Embedding & Index Document
                  </button>
                )}
              </form>
            ) : (
              // Source General Statistics
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 800, color: "#18181b", display: "flex", alignItems: "center", gap: 6 }}>
                    <Database size={15} style={{ color: "#ff6b00" }} />
                    Connector Overview
                  </h3>
                  <p style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                    Status overview and index stats for this data source integration.
                  </p>
                </div>

                {/* Metrics list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #f4f4f5",
                      borderRadius: 10,
                      padding: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#71717a", fontWeight: 500 }}>Index Count</span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "#18181b" }}>
                      {docs.length} documents
                    </span>
                  </div>
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #f4f4f5",
                      borderRadius: 10,
                      padding: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#71717a", fontWeight: 500 }}>Connector Type</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 12,
                        background: source.type === "google_drive" ? "#dcfce7" : "#f5f3ff",
                        color: source.type === "google_drive" ? "#16a34a" : "#8b5cf6",
                      }}
                    >
                      {source.type === "google_drive" ? "Storage (Drive)" : "Workspace (Notion)"}
                    </span>
                  </div>
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #f4f4f5",
                      borderRadius: 10,
                      padding: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#71717a", fontWeight: 500 }}>Sync Status</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: source.status === "synced" ? "#16a34a" : "#2563eb",
                      }}
                    >
                      {source.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Info Note */}
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 12,
                    color: "#b45309",
                    lineHeight: "1.5",
                  }}
                >
                  <strong>💡 Dynamic RAG Search Context:</strong> Manually added documents are split into semantic word blocks, embedded via OpenAI, and made instantly searchable inside the Ask Corely conversational Q&A lane.
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

