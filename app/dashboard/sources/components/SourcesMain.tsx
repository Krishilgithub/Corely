"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Database,
  FileText,
  Clock,
  Search,
  Filter,
  List,
  LayoutGrid,
  MoreHorizontal,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Folder,
  Trash2,
  UploadCloud,
  Upload,
  Check,
  History,
  Link2,
  Lock,
  Info,
  Copy,
} from "lucide-react";

import { useAuth } from "../../../lib/auth-context";
import { StatusBadge } from "@/components/ui/status-badge";
import type { StatusTone } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import SyncHistoryModal from "./SyncHistoryModal";

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

interface Folder {
  id: string;
  name: string;
}

interface Repo {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  updatedAt: string;
}

// ── Brand Icons ───────────────────────────────────────────────────────────────
const GoogleDriveIcon = ({ size = 22 }: { size?: number }) => (
  <Image src="/drive.png" alt="Google Drive" width={size} height={size} style={{ objectFit: 'contain' }} />
);

const NotionIcon = ({ size = 22 }: { size?: number }) => (
  <Image src="/notion.png" alt="Notion" width={size} height={size} style={{ objectFit: 'contain', borderRadius: 6 }} />
);

const GmailIcon = ({ size = 22 }: { size?: number }) => (
  <Image src="/gmail.png" alt="Gmail" width={size} height={size} style={{ objectFit: 'contain', borderRadius: 6 }} />
);

const SlackIcon = ({ size = 22 }: { size?: number }) => (
  <Image src="/slack.png" alt="Slack" width={size} height={size} style={{ objectFit: 'contain', borderRadius: 6 }} />
);

const LinearIcon = ({ size = 22 }: { size?: number }) => (
  <Image src="/linear.png" alt="Linear" width={size} height={size} style={{ objectFit: 'contain', borderRadius: 6 }} />
);

/** Logo tile for a source type. Brand PNGs sit on a light tile; others get a neutral glyph tile. */
function SourceLogo({ type, small = false }: { type: string; small?: boolean }) {
  const size = small ? 18 : 22;
  const logo =
    type === "google_drive" ? <GoogleDriveIcon size={size} />
    : type === "notion" ? <NotionIcon size={size} />
    : type === "gmail" ? <GmailIcon size={size} />
    : type === "slack" ? <SlackIcon size={size} />
    : type === "linear" ? <LinearIcon size={size} />
    : null;
  if (logo) return <span className={`src-logo-tile${small ? " src-logo-tile--sm" : ""}`}>{logo}</span>;
  return (
    <span className={`src-glyph-tile${small ? " src-glyph-tile--sm" : ""}`}>
      <Database size={small ? 16 : 18} />
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_META: Record<Source["status"], { label: string; tone: StatusTone }> = {
  idle: { label: "Idle", tone: "neutral" },
  syncing: { label: "Syncing", tone: "warning" },
  synced: { label: "Synced", tone: "success" },
  error: { label: "Error", tone: "error" },
};

function SourceStatusBadge({ status }: { status: Source["status"] }) {
  const s = STATUS_META[status] || STATUS_META["idle"];
  if (status === "syncing") {
    return (
      <StatusBadge tone={s.tone}>
        <Loader2 className="animate-spin" /> {s.label}
      </StatusBadge>
    );
  }
  return <StatusBadge tone={s.tone} dot>{s.label}</StatusBadge>;
}

// ── Small display helpers (formatting only) ───────────────────────────────────
function formatCount(n: number) {
  return n > 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;
}

function formatRelative(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "—";
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} d ago`;
}

/** Who can search this source, read from the saved config (see /api/search). */
function accessFor(source: Source): { label: string; title: string } {
  const permissions = (source.config as { permissions?: string })?.permissions;
  if (permissions === "everyone") return { label: "Everyone", title: "Everyone in the workspace can search this source" };
  if (permissions === "admins") return { label: "Admins only", title: "Only workspace admins can search this source" };
  return { label: "Private", title: "Only the owner and admins can search this source" };
}

// ── Connect Modal ─────────────────────────────────────────────────────────────
type ProviderCategory = "all" | "docs" | "communication" | "engineering";

const CATEGORY_LABELS: { id: ProviderCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "docs", label: "Docs & files" },
  { id: "communication", label: "Communication" },
  { id: "engineering", label: "Engineering" },
];

// What each connector reads, based on modules/sources/connectors/*.
const PROVIDERS: { type: string; name: string; category: Exclude<ProviderCategory, "all">; description: string }[] = [
  { type: "google_drive", name: "Google Drive", category: "docs", description: "Docs, Sheets, PDFs and Word files" },
  { type: "notion", name: "Notion", category: "docs", description: "Pages and databases" },
  { type: "gmail", name: "Gmail", category: "communication", description: "Email threads from the last 180 days" },
  { type: "slack", name: "Slack", category: "communication", description: "Messages in public channels the bot is in" },
  { type: "linear", name: "Linear", category: "engineering", description: "Issues and comments" },
];

const modalFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15, ease: "easeOut" as const },
};
const modalSlide = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.15, ease: "easeOut" as const },
};

function ConnectModal({ onClose, existingDriveSource, onDuplicate, connectedTypes = [] }: { onClose: () => void; existingDriveSource?: Source; onDuplicate?: (id: string) => void; connectedTypes?: string[] }) {
  const { workspaceId, user } = useAuth();
  const WORKSPACE_ID = workspaceId || "00000000-0000-0000-0000-000000000001";
  const USER_ID = user?.id || "00000000-0000-0000-0000-000000000002";
  const [isDuplicating, setIsDuplicating] = useState(false);
  // Popup-only filters (client side, over the static provider list)
  const [providerQuery, setProviderQuery] = useState("");
  const [category, setCategory] = useState<ProviderCategory>("all");

  const connectHref: Record<string, string> = {
    google_drive: `/api/sources/google-drive/connect?workspaceId=${WORKSPACE_ID}&userId=${USER_ID}`,
    notion: `/api/sources/notion/connect?workspaceId=${WORKSPACE_ID}&userId=${USER_ID}`,
    gmail: `/api/sources/gmail/connect?workspaceId=${WORKSPACE_ID}&userId=${USER_ID}`,
    slack: `/api/sources/slack/connect?workspaceId=${WORKSPACE_ID}&userId=${USER_ID}`,
    linear: `/api/sources/linear/connect?workspaceId=${WORKSPACE_ID}&userId=${USER_ID}`,
  };

  const visibleProviders = PROVIDERS.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      p.name.toLowerCase().includes(providerQuery.trim().toLowerCase())
  );

  return (
    <AnimatePresence>
      <motion.div
        {...modalFade}
        className="src-modal-overlay"
        style={{ zIndex: 1000 }}
        onClick={onClose}
      >
        <motion.div
          {...modalSlide}
          className="ui-popover src-modal src-modal--wide"
          role="dialog"
          aria-modal="true"
          aria-labelledby="src-connect-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="src-modal__header">
            <div className="src-modal__titles">
              <h2 id="src-connect-title" className="src-modal__title">Add a source</h2>
              <p className="type-subtitle">
                Connect a tool or upload files. Corely indexes the content so you can ask questions about it.
              </p>
            </div>
            <button type="button" className="ui-icon-btn ui-icon-btn--sm" onClick={onClose} aria-label="Close" title="Close">
              <X size={16} />
            </button>
          </div>

          {/* Toolbar: search + category pills */}
          <div className="src-modal__toolbar">
            <div className="src-search src-search--sm">
              <Search />
              <input
                type="text"
                className="ui-input"
                placeholder="Search sources"
                aria-label="Search sources"
                value={providerQuery}
                onChange={(e) => setProviderQuery(e.target.value)}
              />
            </div>
            <div className="src-pills" role="group" aria-label="Category">
              {CATEGORY_LABELS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`src-pill ${category === c.id ? "is-active" : ""}`}
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="src-modal__body">
            {visibleProviders.length === 0 ? (
              <EmptyState
                compact
                icon={<Search />}
                title={`No sources match '${providerQuery}'`}
                description="Try another name or category."
              />
            ) : (
              <div className="src-provider-grid">
                {visibleProviders.map((p) => {
                  const isDrive = p.type === "google_drive";
                  const isConnected = connectedTypes.includes(p.type);
                  return (
                    <div
                      key={p.type}
                      className="src-provider"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        // Enter or Space on the focused card presses its Connect control.
                        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          (e.currentTarget.querySelector(".src-provider__cta") as HTMLElement | null)?.click();
                        }
                      }}
                    >
                      <div className="src-provider__top">
                        <SourceLogo type={p.type} />
                        <div className="src-provider__text">
                          <div className="src-provider__name-row">
                            <span className="src-provider__name">{p.name}</span>
                            {isConnected && <StatusBadge tone="success" dot>Connected</StatusBadge>}
                          </div>
                          <span className="src-provider__desc">{p.description}</span>
                        </div>
                        <a href={connectHref[p.type]} className="ui-btn ui-btn--secondary ui-btn--sm src-provider__cta">
                          {isDrive && existingDriveSource ? "New account" : "Connect"}
                        </a>
                      </div>
                      {isDrive && existingDriveSource && (
                        <div className="src-provider__extra">
                          <button
                            type="button"
                            className="ui-btn ui-btn--ghost ui-btn--sm"
                            onClick={async () => {
                              if (onDuplicate) {
                                setIsDuplicating(true);
                                await onDuplicate(existingDriveSource.id);
                                setIsDuplicating(false);
                              }
                            }}
                            disabled={isDuplicating}
                          >
                            {isDuplicating ? <Loader2 className="animate-spin" /> : <Plus />}
                            {isDuplicating ? "Adding..." : "Add another folder"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Manual upload */}
            <div className="src-dropzone">
              <span className="ui-icon-well ui-icon-well--sm"><UploadCloud /></span>
              <div className="src-dropzone__text">
                <span className="type-body" style={{ fontWeight: 600 }}>Upload a file</span>
                <span className="type-caption">PDF, DOC, DOCX, TXT, MD, CSV or JSON</span>
              </div>
              <button
                type="button"
                className="ui-btn ui-btn--secondary ui-btn--sm"
                onClick={() => {
                  document.getElementById("manual-upload-input")?.click();
                  onClose();
                }}
              >
                <Upload /> Choose file
              </button>
            </div>
          </div>

          <div className="src-modal__footer src-modal__footer--split">
            <span className="src-modal__note type-caption">
              <Lock /> You can disconnect a source at any time.
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SourcesMain() {
  const { workspaceId } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [configuringSourceId, setConfiguringSourceId] = useState<string | null>(null);

  // New state for tabs, dropdowns, toast notifications, and disconnect modals
  const [activeTab, setActiveTab] = useState<"all" | "synced" | "syncing" | "error">("all");
  const [activeDropdownSourceId, setActiveDropdownSourceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string | "all">("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [viewingHistorySourceId, setViewingHistorySourceId] = useState<string | null>(null);
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
    const handleOutsideClick = (e: MouseEvent) => {
      setActiveDropdownSourceId(null);
      const target = e.target as HTMLElement;
      if (!target.closest('.src-filter-container')) {
        setShowFilterDropdown(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // ── Fetch sources from API ─────────────────────────────────────
  const fetchSources = useCallback(async () => {
    try {
      if (!workspaceId) return;
      const res = await fetch(`/api/sources?workspaceId=${workspaceId}`);
      if (!res.ok) return;
      const json = await res.json();
      const data = json.data || json;
      setSources(data.sources ?? []);
    } catch (err) {
      console.error("Failed to fetch sources:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

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
    } else if (connected === "gmail") {
      showToast("Gmail connected! Sync in progress...", "success");
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

  // ── Duplicate a Google Drive connection (add another folder) ───
  // Same logic the Add-source popup used; now also reachable from the row menu.
  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/sources/${id}/duplicate`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        fetchSources();
        setShowModal(false);
        if (data.data?.id) {
          setConfiguringSourceId(data.data.id);
          showToast("Google Drive connection added! Please select a folder.", "success");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ── Manual Upload ──────────────────────────────────────────────
  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be uploaded again if needed
    e.target.value = '';

    showToast(`Uploading ${file.name}...`, "info");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/sources/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      showToast(`${file.name} uploaded successfully!`, "success");
      fetchSources(); // Refresh sources list
    } catch (err) {
      console.error("Manual upload error:", err);
      showToast("Failed to upload file.", "info");
    }
  };

  // ── Filter sources based on Tab and Search query ───────────────
  const filtered = sources
    .filter((s) => {
      if (activeTab === "synced") return s.status === "synced";
      if (activeTab === "syncing") return s.status === "syncing";
      if (activeTab === "error") return s.status === "error";
      return true;
    })
    .filter((s) => filterType === "all" || s.type === filterType)
    .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalIndexed = sources.reduce((sum, s) => sum + s.itemsIndexed, 0);
  const syncedCount = sources.filter((s) => s.status === "synced").length;
  const syncingCount = sources.filter((s) => s.status === "syncing").length;
  const errorCount = sources.filter((s) => s.status === "error").length;
  // Most recent sync across all sources, for the "Last sync" tile.
  const lastSyncedAt = sources.reduce<string | null>((latest, s) => {
    if (!s.lastSyncedAt) return latest;
    if (!latest || new Date(s.lastSyncedAt).getTime() > new Date(latest).getTime()) return s.lastSyncedAt;
    return latest;
  }, null);

  const tabs: { id: "all" | "synced" | "syncing" | "error"; label: string; count: number }[] = [
    { id: "all", label: "All", count: sources.length },
    { id: "synced", label: "Synced", count: syncedCount },
    { id: "syncing", label: "Syncing", count: syncingCount },
    { id: "error", label: "Error", count: errorCount },
  ];

  const kpis: { label: string; value: ReactNode; icon: ReactNode; hint: string; hintTone?: "success" | "warning" | "error"; accent?: boolean }[] = [
    {
      label: "Connected sources",
      value: sources.length,
      icon: <Database />,
      hint: syncingCount > 0 ? `${syncingCount} syncing` : "All systems operational",
      hintTone: syncingCount > 0 ? "warning" : "success",
      accent: true,
    },
    { label: "Documents indexed", value: formatCount(totalIndexed), icon: <FileText />, hint: "Across all sources" },
    {
      label: "Last sync",
      value: formatRelative(lastSyncedAt),
      icon: <Clock />,
      hint: `${syncedCount} of ${sources.length} synced`,
    },
    {
      label: "Needs attention",
      value: errorCount,
      icon: <AlertTriangle />,
      hint: errorCount > 0 ? "Sources with sync errors" : "No sync errors",
      hintTone: errorCount > 0 ? "error" : undefined,
    },
  ];

  const rowMode = viewMode === "list";

  const renderSource = (source: Source) => {
    const access = accessFor(source);
    const isSyncing = source.status === "syncing";
    return (
      <div
        key={source.id}
        className={`src-source ${rowMode ? "src-source--row" : "src-source--card"}`}
      >
        {/* Identity */}
        <div className="src-source__id">
          <SourceLogo type={source.type} />
          <div className="src-source__text">
            <div className="src-source__name" title={source.name}>{source.name}</div>
            <div className="src-source__type">
              {(source.config as { email?: string })?.email ??
                (source.config as { ownerEmail?: string })?.ownerEmail ??
                source.type.replace("_", " ")}
            </div>
          </div>
        </div>

        {/* More menu */}
        <div className="src-menu-wrap src-source__more">
          <button
            type="button"
            title="More options"
            aria-label="More options"
            className="ui-icon-btn ui-icon-btn--sm src-more-btn"
            onClick={(e) => {
              e.stopPropagation();
              setActiveDropdownSourceId(
                activeDropdownSourceId === source.id ? null : source.id
              );
            }}
          >
            <MoreHorizontal />
          </button>

          {activeDropdownSourceId === source.id && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="ui-popover src-menu"
              onClick={(e) => e.stopPropagation()}
            >
              {source.type === "google_drive" && (
                <button
                  type="button"
                  className="ui-menu-item"
                  onClick={() => {
                    setConfiguringSourceId(source.id);
                    setActiveDropdownSourceId(null);
                  }}
                >
                  <Folder />
                  Configure scope
                </button>
              )}
              <button
                type="button"
                className="ui-menu-item"
                onClick={() => {
                  setViewingHistorySourceId(source.id);
                  setActiveDropdownSourceId(null);
                }}
              >
                <History />
                View sync history
              </button>
              <button
                type="button"
                className="ui-menu-item"
                onClick={() => {
                  setManagingSource(source);
                  setActiveDropdownSourceId(null);
                }}
              >
                <FileText />
                Manage documents
              </button>
              {source.type === "google_drive" && (
                <button
                  type="button"
                  className="ui-menu-item"
                  onClick={() => {
                    handleDuplicate(source.id);
                    setActiveDropdownSourceId(null);
                  }}
                >
                  <Copy />
                  Add another folder
                </button>
              )}
              <div className="src-menu__divider" />
              <button
                type="button"
                className="ui-menu-item ui-menu-item--danger"
                onClick={() => {
                  setDisconnectingSource(source);
                  setActiveDropdownSourceId(null);
                }}
              >
                <X />
                Disconnect
              </button>
            </motion.div>
          )}
        </div>

        {source.errorMessage && (
          <div className="src-source__error">
            <AlertCircle />
            <span>{source.errorMessage}</span>
          </div>
        )}

        {/* Facts: status, items, last sync, access */}
        <div className="src-source__meta">
          <div className="src-source__cell src-source__status">
            <span className="src-source__label">Status</span>
            <SourceStatusBadge status={source.status} />
          </div>
          <div className="src-source__cell src-source__count">
            <span className="src-source__label">Indexed</span>
            <span className="src-source__value">{source.itemsIndexed.toLocaleString()}</span>
          </div>
          <div className="src-source__cell src-source__synced">
            <span className="src-source__label">Last synced</span>
            <span className="src-source__caption">
              {source.lastSyncedAt ? new Date(source.lastSyncedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never"}
            </span>
          </div>
          <div className="src-source__cell src-source__access">
            <span className="src-source__label">Access</span>
            <span className="ui-badge ui-badge--neutral" title={access.title}>{access.label}</span>
          </div>
        </div>

        {/* Sync now */}
        <div className="src-source__sync">
          <button
            type="button"
            title="Sync now"
            className="ui-btn ui-btn--secondary ui-btn--sm"
            disabled={isSyncing}
            onClick={() => handleSync(source.id)}
          >
            <RefreshCw className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Syncing..." : "Sync now"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="src-main">
      {/* Hidden file input for Manual Uploads */}
      <input
        type="file"
        id="manual-upload-input"
        style={{ display: 'none' }}
        onChange={handleManualUpload}
        accept=".txt,.md,.csv,.json,.pdf,.doc,.docx"
      />
      {/* ── In-page toast ───────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="src-toast"
            role="status"
          >
            {toastMessage.type === "success" ? <CheckCircle2 /> : <Info />}
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="ui-page-header">
        <div className="ui-page-header__text">
          <h1 className="type-title">Sources</h1>
          <p className="type-subtitle">Connect, manage, and monitor all your data sources.</p>
        </div>
        <div className="ui-page-header__actions">
          <button
            type="button"
            className="ui-icon-btn"
            onClick={fetchSources}
            disabled={loading}
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--secondary"
            onClick={() => document.getElementById("manual-upload-input")?.click()}
          >
            <Upload /> Upload file
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--primary"
            onClick={() => setShowModal(true)}
          >
            <Plus /> Add source
          </button>
        </div>
      </div>

      {/* ── KPI tiles ─────────────────────────────────────────────── */}
      <div className="src-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="ui-kpi src-kpi">
            <span className={`ui-icon-well${k.accent ? " ui-icon-well--accent" : ""}`}>{k.icon}</span>
            <div className="src-kpi__values">
              <span className="type-metric">{k.value}</span>
              <span className="type-caption" style={{ color: "var(--text-secondary)" }}>{k.label}</span>
              <span className={`src-kpi__hint${k.hintTone ? ` src-kpi__hint--${k.hintTone}` : ""}`}>
                {k.hintTone && <span className="ui-dot" aria-hidden="true" />}
                {k.hint}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ────────────────────────────────────────────── */}
      <div className="src-filter-bar">
        <div className="src-seg" role="group" aria-label="Filter by status">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`src-seg__item ${activeTab === t.id ? "is-active" : ""}`}
              aria-pressed={activeTab === t.id}
            >
              {t.label} <span className="src-seg__count">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="src-filter-bar__right">
          <div className="src-search">
            <Search />
            <input
              type="text"
              className="ui-input"
              placeholder="Search sources..."
              aria-label="Search sources"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="src-filter-container">
            <button
              type="button"
              className={`ui-btn ui-btn--secondary src-filter-btn ${filterType !== "all" ? "active-filter" : ""}`}
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              style={{ textTransform: "capitalize" }}
            >
              <Filter /> {filterType === "all" ? "Filter" : filterType.replace("_", " ")}
            </button>

            {showFilterDropdown && (
              <div className="ui-popover src-menu" style={{ minWidth: 160 }}>
                <button
                  type="button"
                  className={`ui-menu-item ${filterType === "all" ? "is-selected" : ""}`}
                  onClick={() => { setFilterType("all"); setShowFilterDropdown(false); }}
                >
                  All types
                  {filterType === "all" && <Check className="src-menu__check" />}
                </button>
                {Array.from(new Set(sources.map(s => s.type))).map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`ui-menu-item ${filterType === type ? "is-selected" : ""}`}
                    style={{ textTransform: "capitalize" }}
                    onClick={() => { setFilterType(type); setShowFilterDropdown(false); }}
                  >
                    {type.replace("_", " ")}
                    {filterType === type && <Check className="src-menu__check" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className="ui-icon-btn"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            title={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
            aria-label={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
          >
            {viewMode === "grid" ? <List size={16} /> : <LayoutGrid size={16} />}
          </button>
        </div>
      </div>

      {/* ── Source list ───────────────────────────────────────────── */}
      {!loading && sources.length === 0 && (
        <div className="src-empty-box">
          <EmptyState
            icon={<Link2 />}
            title="Connect your first source"
            description="Connect a tool or upload a file to start indexing your company data."
            action={
              <button type="button" className="ui-btn ui-btn--primary" onClick={() => setShowModal(true)}>
                <Plus /> Add source
              </button>
            }
          />
        </div>
      )}

      {loading && (
        <div className="src-skeleton-list" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="ui-skeleton src-skeleton-row" />
          ))}
        </div>
      )}

      {!loading && sources.length > 0 && filtered.length === 0 && (
        <div className="src-empty-box">
          <EmptyState compact icon={<Search />} title="No sources match these filters" description="Try another status, type or search term." />
        </div>
      )}

      {!loading && filtered.length > 0 && (
        rowMode ? (
          <div className="src-list">
            <div className="src-list-head" aria-hidden="true">
              <span className="type-label">Source</span>
              <span className="type-label">Status</span>
              <span className="type-label">Indexed</span>
              <span className="type-label">Last synced</span>
              <span className="type-label">Access</span>
              <span style={{ gridColumn: "6 / 8" }} />
            </div>
            {filtered.map(renderSource)}
          </div>
        ) : (
          <div className="src-grid">{filtered.map(renderSource)}</div>
        )
      )}

      {filtered.length > 0 && (
        <div className="src-list-footer">
          Showing {filtered.length} of {sources.length} source
          {sources.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* ── Connect Modal ─────────────────────────────────────────── */}
      {showModal && (
        <ConnectModal
          onClose={() => setShowModal(false)}
          existingDriveSource={sources.find((s: Source) => s.type === "google_drive")}
          connectedTypes={Array.from(new Set(sources.map((s) => s.type)))}
          onDuplicate={handleDuplicate}
        />
      )}

      {/* ── Source Configuration Modal ───────────────────────────── */}
      {configuringSourceId && (
        <ConfigureSourceModal
          sourceId={configuringSourceId}
          onClose={() => setConfiguringSourceId(null)}
          onConfigSaved={fetchSources}
        />
      )}

      {/* ── Disconnect Confirmation Modal ─────────────────────────── */}
      <AnimatePresence>
        {disconnectingSource && (
          <motion.div
            {...modalFade}
            className="src-modal-overlay"
            style={{ zIndex: 10000 }}
            onClick={() => setDisconnectingSource(null)}
          >
            <motion.div
              {...modalSlide}
              className="ui-popover src-modal"
              style={{ width: "min(480px, calc(100vw - 32px))" }}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="src-disconnect-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="src-modal__header">
                <div className="src-modal__heading">
                  <span className="src-danger-tile"><AlertCircle size={20} /></span>
                  <div className="src-modal__titles">
                    <h3 id="src-disconnect-title" className="type-heading">Disconnect data source?</h3>
                    <p className="type-body" style={{ color: "var(--text-secondary)" }}>
                      Are you sure you want to disconnect <strong className="src-strong">{disconnectingSource.name}</strong>?
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="ui-icon-btn ui-icon-btn--sm"
                  onClick={() => setDisconnectingSource(null)}
                  disabled={deleting}
                  aria-label="Close"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Consequence Box */}
              <div className="src-modal__body">
                <div className="src-consequences">
                  <div className="src-consequences__title">This action is permanent and will:</div>
                  <ul>
                    <li>Revoke access tokens and stop all background syncing.</li>
                    <li>Permanently erase all {disconnectingSource.itemsIndexed.toLocaleString()} indexed documents.</li>
                    <li>Wipe out all database text chunks and search vectors.</li>
                    <li>Remove it from workspace memory and chat history references.</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="src-modal__footer">
                <button
                  type="button"
                  className="ui-btn ui-btn--secondary"
                  onClick={() => setDisconnectingSource(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ui-btn ui-btn--destructive"
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
                >
                  {deleting ? (
                    <>
                      <Loader2 className="animate-spin" /> Disconnecting...
                    </>
                  ) : (
                    "Yes, disconnect"
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

      {/* ── Sync History Modal ── */}
      {viewingHistorySourceId && (
        <SyncHistoryModal
          sourceId={viewingHistorySourceId}
          onClose={() => setViewingHistorySourceId(null)}
        />
      )}
    </div>
  );
}

// ── Google Drive Folder Selector Modal ─────────────────────────────────────────

interface Folder {
  id: string;
  name: string;
  parents?: string[];
}

function ConfigureSourceModal({
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
  const [repos, setRepos] = useState<Repo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncOption, setSyncOption] = useState<"all" | "folder" | "repo">("all");
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [sourceName, setSourceName] = useState("Google Drive");
  const [sourceType, setSourceType] = useState("google_drive");
  const [activeConfigTab, setActiveConfigTab] = useState<"sync" | "schedule" | "permissions">("sync");
  const [permissions, setPermissions] = useState<"everyone" | "admins">("everyone");
  const [syncSchedule, setSyncSchedule] = useState<"hourly" | "daily" | "weekly" | "manual">("daily");

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
        if (config.permissions) {
          setPermissions(config.permissions);
        }
        if (config.syncSchedule) {
          setSyncSchedule(config.syncSchedule);
        }
        
        const type = sourceData.type || "google_drive";
        setSourceType(type);
        if (type === "google_drive") {
          setActiveConfigTab("sync");
          if (config.folderIds && config.folderIds.length > 0) {
            setSyncOption("folder");
            setSelectedFolderIds(config.folderIds);
          } else if (config.folderId) {
            setSyncOption("folder");
            setSelectedFolderIds([config.folderId]);
          }

          // 2. Fetch folder list from Drive
          const foldersRes = await fetch(`/api/sources/${sourceId}/folders`);
          if (foldersRes.ok) {
            const foldersData = await foldersRes.json();
            if (active) {
              const folderList = foldersData.folders || [];
              setFolders(folderList);
              setFilteredFolders(folderList);
            }
          }
        } else if (type === "github") {
          setActiveConfigTab("sync");
          if (config.selectedRepos && config.selectedRepos.length > 0) {
            setSyncOption("repo");
            setSelectedRepoIds(config.selectedRepos);
          }
          const reposRes = await fetch(`/api/sources/${sourceId}/github/repos`);
          if (reposRes.ok) {
            const reposData = await reposRes.json();
            if (active) {
              const repoList = reposData.data || [];
              setRepos(repoList);
              setFilteredRepos(repoList);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load source configuration data:", err);
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
      setFilteredRepos(repos);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredFolders(
        folders.filter((f) => f.name.toLowerCase().includes(query))
      );
      setFilteredRepos(
        repos.filter((r) => r.fullName.toLowerCase().includes(query))
      );
    }
  }, [searchQuery, folders, repos]);

  // Save the selected option and folder to config, then trigger manual sync
  const handleSave = async () => {
    setSaving(true);
    try {
      const selectedFolders =
        syncOption === "folder"
          ? folders.filter((f) => selectedFolderIds.includes(f.id))
          : [];

      const configRes = await fetch(`/api/sources/${sourceId}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(sourceType === "google_drive" && {
            folderIds: selectedFolders.map(f => f.id),
            folderNames: selectedFolders.map(f => f.name),
          }),
          ...(sourceType === "github" && {
            selectedRepos: syncOption === "repo" ? selectedRepoIds : [],
          }),
          syncSchedule,
          permissions,
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


  const saveDisabled = saving || (sourceType === "google_drive" && syncOption === "folder" && selectedFolderIds.length === 0);

  return (
    <AnimatePresence>
      <motion.div
        {...modalFade}
        className="src-modal-overlay"
        style={{ zIndex: 1000 }}
        onClick={onClose}
      >
        <motion.div
          {...modalSlide}
          className="ui-popover src-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="src-config-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="src-modal__header">
            <div className="src-modal__titles">
              <h2 id="src-config-title" className="type-heading">Configure source settings</h2>
              <p className="type-body" style={{ color: "var(--text-secondary)" }}>
                Manage settings for <strong className="src-strong">{sourceName}</strong>.
              </p>
            </div>
            <button type="button" className="ui-icon-btn ui-icon-btn--sm" onClick={onClose} aria-label="Close" title="Close">
              <X size={16} />
            </button>
          </div>

          {loading ? (
            <div className="src-modal-loading">
              <Loader2 size={24} className="animate-spin src-spinner" />
              <span className="type-caption">Fetching source configuration...</span>
            </div>
          ) : (
            <>
            <div className="src-modal__body">

              {(sourceType === "google_drive" || sourceType === "github") && (
                <div className="src-seg" role="group" aria-label="Settings section" style={{ alignSelf: "flex-start" }}>
                  <button
                    type="button"
                    className={`src-seg__item ${activeConfigTab === "sync" ? "is-active" : ""}`}
                    aria-pressed={activeConfigTab === "sync"}
                    onClick={() => setActiveConfigTab("sync")}
                  >
                    Scope
                  </button>
                  <button
                    type="button"
                    className={`src-seg__item ${activeConfigTab === "schedule" ? "is-active" : ""}`}
                    aria-pressed={activeConfigTab === "schedule"}
                    onClick={() => setActiveConfigTab("schedule")}
                  >
                    Schedule
                  </button>
                  <button
                    type="button"
                    className={`src-seg__item ${activeConfigTab === "permissions" ? "is-active" : ""}`}
                    aria-pressed={activeConfigTab === "permissions"}
                    onClick={() => setActiveConfigTab("permissions")}
                  >
                    Permissions
                  </button>
                </div>
              )}

              {activeConfigTab === "sync" && (sourceType === "google_drive" || sourceType === "github") && (
                <>
                <div className="src-option-list">
                {/* Option 1: Sync Everything */}
                <label className={`src-option ${syncOption === "all" ? "is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="syncOption"
                    value="all"
                    checked={syncOption === "all"}
                    onChange={() => setSyncOption("all")}
                  />
                  <div className="src-option__text">
                    <div className="type-body" style={{ fontWeight: 600 }}>Ingest all {sourceType === "github" ? "repositories" : "files and items"}</div>
                    <div className="type-caption">
                      {sourceType === "github" ? "Sync all repositories you have access to." : "Sync all supported documents across the entire Google Drive space."}
                    </div>
                  </div>
                </label>

                {/* Option 2: Sync Specific Folder/Repo */}
                <label className={`src-option ${(syncOption === "folder" || syncOption === "repo") ? "is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="syncOption"
                    value={sourceType === "github" ? "repo" : "folder"}
                    checked={syncOption === "folder" || syncOption === "repo"}
                    onChange={() => setSyncOption(sourceType === "github" ? "repo" : "folder")}
                  />
                  <div className="src-option__text">
                    <div className="type-body" style={{ fontWeight: 600 }}>Sync specific {sourceType === "github" ? "repositories" : "folders"}</div>
                    <div className="type-caption">
                      {sourceType === "github" ? "Restrict sync scope strictly to specific repositories." : "Restrict sync scope strictly to specific folders and their nested subfolders."}
                    </div>
                  </div>
                </label>
              </div>

              {/* Folder/Repo Selector Explorer Section */}
              {(syncOption === "folder" || syncOption === "repo") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 0 }}
                >
                  {/* Search bar */}
                  <div className="src-search src-search--sm" style={{ width: "100%" }}>
                    <Search />
                    <input
                      type="text"
                      className="ui-input"
                      placeholder={`Search ${sourceType === "github" ? "repositories" : "folders"}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Folder List Scroll Pane */}
                  <div className="src-picker">
                    {(sourceType === "github" ? filteredRepos : filteredFolders).length === 0 ? (
                      <div className="src-picker__empty type-caption">
                        No items found matching &quot;{searchQuery}&quot;
                      </div>
                    ) : (
                      (sourceType === "github" ? filteredRepos : filteredFolders).map((fItem) => {
                        const f = fItem as unknown as Repo & Folder;
                        const isSelected = sourceType === "github" ? selectedRepoIds.includes(f.fullName) : selectedFolderIds.includes(f.id);
                        return (
                          <div
                            key={sourceType === "github" ? f.fullName : f.id}
                            onClick={() => {
                              if (sourceType === "github") {
                                setSelectedRepoIds(prev =>
                                  prev.includes(f.fullName) ? prev.filter((id: string) => id !== f.fullName) : [...prev, f.fullName]
                                );
                              } else {
                                setSelectedFolderIds(prev =>
                                  prev.includes(f.id) ? prev.filter((id: string) => id !== f.id) : [...prev, f.id]
                                );
                              }
                            }}
                            className={`src-picker__row ${isSelected ? "is-selected" : ""}`}
                          >
                            <div className="src-picker__name">
                              <Folder size={16} />
                              <span>{sourceType === "github" ? f.fullName : f.name}</span>
                            </div>
                            <div className={`src-check ${isSelected ? "is-on" : ""}`}>
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
              </>
              )}

              {activeConfigTab === "schedule" && (
                <div className="src-option-list">
                  <div className="type-label" style={{ marginBottom: 2 }}>Sync schedule</div>

                  {[
                    { id: "hourly", label: "Hourly", desc: "Sync updates every hour for real-time relevance." },
                    { id: "daily", label: "Daily (midnight)", desc: "Sync once per day during off-hours." },
                    { id: "weekly", label: "Weekly", desc: "Sync once a week (Sundays)." },
                    { id: "manual", label: "Manual only", desc: "Never sync automatically. Only sync when triggered manually." }
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={`src-option ${syncSchedule === option.id ? "is-selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="syncSchedule"
                        value={option.id}
                        checked={syncSchedule === option.id}
                        onChange={() => setSyncSchedule(option.id as "hourly" | "daily" | "weekly" | "manual")}
                      />
                      <div className="src-option__text">
                        <div className="type-body" style={{ fontWeight: 600 }}>{option.label}</div>
                        <div className="type-caption">
                          {option.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {activeConfigTab === "permissions" && (
                <div className="src-option-list">
                  <div className="type-label" style={{ marginBottom: 2 }}>Access control</div>
                  <label className={`src-option ${permissions === "everyone" ? "is-selected" : ""}`}>
                    <input
                      type="radio"
                      name="permissions"
                      value="everyone"
                      checked={permissions === "everyone"}
                      onChange={() => setPermissions("everyone")}
                    />
                    <div className="src-option__text">
                      <div className="type-body" style={{ fontWeight: 600 }}>Everyone in workspace</div>
                      <div className="type-caption">
                        All members of this workspace can query this source.
                      </div>
                    </div>
                  </label>

                  <label className={`src-option ${permissions === "admins" ? "is-selected" : ""}`}>
                    <input
                      type="radio"
                      name="permissions"
                      value="admins"
                      checked={permissions === "admins"}
                      onChange={() => setPermissions("admins")}
                    />
                    <div className="src-option__text">
                      <div className="type-body" style={{ fontWeight: 600 }}>Admins only</div>
                      <div className="type-caption">
                        Only workspace administrators can query this source.
                      </div>
                    </div>
                  </label>
                </div>
              )}
              </div>

              {/* Action Buttons */}
              <div className="src-modal__footer">
                <button
                  type="button"
                  className="ui-btn ui-btn--secondary"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ui-btn ui-btn--primary"
                  onClick={handleSave}
                  disabled={saveDisabled}
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save & ingest"
                  )}
                </button>
              </div>
            </>
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
        setDocs(data.data?.documents || []);
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
        const json = await res.json();
        const data = json.data || json;
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
      {...modalFade}
      className="src-modal-overlay"
      style={{ zIndex: 10000 }}
      onClick={onClose}
    >
      <motion.div
        {...modalSlide}
        className="ui-popover src-modal src-modal--xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="src-docs-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="src-modal__header">
          <div className="src-modal__titles">
            <div className="src-modal__title-row">
              <h2 id="src-docs-title" className="type-heading">
                Manage source documents
              </h2>
              <span className="ui-badge ui-badge--neutral">{source.name}</span>
            </div>
            <p className="type-caption">
              View, add manual contents, or purge documents currently indexed under this connector.
            </p>
          </div>
          <button type="button" className="ui-icon-btn ui-icon-btn--sm" onClick={onClose} aria-label="Close" title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="src-docs">
          {/* Left Column: Documents List */}
          <div className="src-docs__list">
            {/* Table Header and Search */}
            <div className="src-docs__toolbar">
              <div className="src-search">
                <Search />
                <input
                  type="text"
                  className="ui-input"
                  placeholder="Search indexed files by title..."
                  aria-label="Search indexed files by title"
                  value={searchDocQuery}
                  onChange={(e) => setSearchDocQuery(e.target.value)}
                />
              </div>
              <button
                type="button"
                className={`ui-btn ${showAddForm ? "ui-btn--secondary" : "ui-btn--primary"}`}
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? (
                  <>View document list</>
                ) : (
                  <>
                    <Plus /> Add document
                  </>
                )}
              </button>
            </div>

            {/* Main view container */}
            <div className="src-docs__scroll">
              {loadingDocs ? (
                // Loading State
                <div className="src-skeleton-list">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="ui-skeleton" style={{ height: 52, borderRadius: 8 }} />
                  ))}
                </div>
              ) : filteredDocs.length === 0 ? (
                // Empty State
                <EmptyState
                  compact
                  icon={<FileText />}
                  title="No documents found"
                  description={
                    searchDocQuery
                      ? "We couldn't find any documents matching your search term."
                      : "There are no files indexed under this source. Add a manual document to get started."
                  }
                />
              ) : (
                // Documents List
                <div className="ui-table-wrap">
                  <table className="ui-table src-doc-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Indexed date</th>
                      <th style={{ textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((doc) => {
                      const isDeleting = deletingDocId === doc.id;
                      return (
                        <tr
                          key={doc.id}
                          style={{ opacity: isDeleting ? 0.5 : 1 }}
                        >
                          <td>
                            <div className="src-doc-title" title={doc.title}>
                              {doc.title}
                            </div>
                          </td>
                          <td>
                            <span className="ui-badge ui-badge--neutral">
                              {doc.fileType === "manual_upload"
                                ? "Manual"
                                : doc.fileType
                                ? doc.fileType.toUpperCase()
                                : "FILE"}
                            </span>
                          </td>
                          <td className="type-caption" style={{ whiteSpace: "nowrap" }}>
                            {doc.indexedAt
                              ? new Date(doc.indexedAt).toLocaleDateString()
                              : new Date(doc.updatedAt).toLocaleDateString()}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              className="src-danger-icon-btn"
                              onClick={() => handleDeleteDoc(doc.id, doc.title)}
                              disabled={isDeleting}
                              title="Delete document"
                              aria-label="Delete document"
                            >
                              {isDeleting ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Statistics or Form Panel */}
          <div className="src-docs__side">
            {showAddForm ? (
              // Manual Document Form
              <form onSubmit={handleAddDocSubmit} className="src-form">
                <div className="src-section-head">
                  <h3 className="type-heading src-section-head__title">
                    <Plus size={16} />
                    Add manual document
                  </h3>
                  <p className="type-caption">
                    Paste plain text content to index it manually under this source container.
                  </p>
                </div>

                <div className="src-field">
                  <label className="type-label" htmlFor="src-doc-title">Document title</label>
                  <input
                    id="src-doc-title"
                    type="text"
                    className="ui-input"
                    required
                    placeholder="e.g. Q3 Strategic Budget Ingestion"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    disabled={submittingDoc}
                  />
                </div>

                <div className="src-field">
                  <label className="type-label" htmlFor="src-doc-type">File type label</label>
                  <select
                    id="src-doc-type"
                    className="ui-input"
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    disabled={submittingDoc}
                  >
                    <option value="manual_upload">Manual Upload</option>
                    <option value="pdf">PDF Document</option>
                    <option value="txt">Text File (TXT)</option>
                    <option value="md">Markdown Ingestion</option>
                  </select>
                </div>

                <div className="src-field" style={{ flex: 1 }}>
                  <label className="type-label" htmlFor="src-doc-content">Raw content</label>
                  <textarea
                    id="src-doc-content"
                    className="ui-input"
                    required
                    rows={8}
                    placeholder="Paste plain text content here. We will automatically chunk and embed it..."
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    disabled={submittingDoc}
                    style={{ resize: "none" }}
                  />
                </div>

                {submittingDoc ? (
                  // Embedding progress
                  <div className="src-progress">
                    <div className="src-progress__row">
                      <Loader2 size={16} className="animate-spin src-spinner" />
                      <div className="type-body" style={{ fontWeight: 600 }}>
                        {submitStep === 1
                          ? "Analyzing & chunking text..."
                          : submitStep === 2
                          ? "Generating vector embeddings..."
                          : "Indexing document chunks..."}
                      </div>
                    </div>
                    <div className="src-progress__track">
                      <motion.div
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="src-progress__bar"
                      />
                    </div>
                  </div>
                ) : (
                  <button type="submit" className="ui-btn ui-btn--primary ui-btn--block">
                    Embed & index document
                  </button>
                )}
              </form>
            ) : (
              // Source General Statistics
              <div className="src-form">
                <div className="src-section-head">
                  <h3 className="type-heading src-section-head__title">
                    <Database size={16} />
                    Connector overview
                  </h3>
                  <p className="type-caption">
                    Status overview and index stats for this data source integration.
                  </p>
                </div>

                {/* Metrics list */}
                <div className="src-kv-list">
                  <div className="src-kv">
                    <span className="type-caption">Index count</span>
                    <span className="type-body" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {docs.length} documents
                    </span>
                  </div>
                  <div className="src-kv">
                    <span className="type-caption">Connector type</span>
                    <span className="ui-badge ui-badge--neutral">
                      {source.type === "google_drive"
                        ? "Storage (Drive)"
                        : source.type === "gmail"
                        ? "Email (Gmail)"
                        : "Workspace (Notion)"}
                    </span>
                  </div>
                  <div className="src-kv">
                    <span className="type-caption">Sync status</span>
                    <SourceStatusBadge status={source.status} />
                  </div>
                </div>

                {/* Info Note */}
                <div className="src-note">
                  <Info />
                  <p>
                    <strong className="src-strong">Dynamic RAG search context:</strong> Manually added documents are split into semantic word blocks, embedded via OpenAI, and made instantly searchable inside the Ask Corely conversational Q&amp;A lane.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
