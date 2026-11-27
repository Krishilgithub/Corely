"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Sparkles, Bell, ChevronDown, Search, X,
  Menu, Sun, Moon, CheckCircle2, Cpu, AlertTriangle, UserPlus, Database,
  ExternalLink, Loader2, Settings, HelpCircle, LogOut, User
} from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { useTheme } from "@/components/ThemeProvider";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HelpModal from "./HelpModal";
import { SourceLogo } from "@/components/ui/source-logo";
import { switchThemeWithTransition } from "@/lib/theme-transition";

interface AppNotification {
  id: string;
  title: string;
  message: string;
  iconType: string;
  isRead: boolean;
  createdAt: string;
}

interface SearchResult {
  id: string;
  content: string;
  document_id: string;
  similarity: number;
  metadata: {
    document_title?: string;
    url?: string;
    source_type?: string;
    file_type?: string;
  };
}

const SUGGESTED_SEARCHES = [
  "What was the decision on the Q3 roadmap?",
  "Find onboarding docs for new engineers",
  "What are the open bugs from last sprint?",
];

const QUICK_ACTIONS = [
  { id: "action-ask", label: "Ask Corely AI", icon: <Sparkles size={14} />, href: "/dashboard/ask-corely" },
  { id: "action-sources", label: "Connect Data Source", icon: <Database size={14} />, href: "/dashboard/sources" },
  { id: "action-invite", label: "Invite Team Members", icon: <UserPlus size={14} />, href: "/dashboard/settings/members" },
  { id: "action-settings", label: "Workspace Settings", icon: <Settings size={14} />, href: "/dashboard/settings" },
];

const sectionLabelStyle: React.CSSProperties = {
  padding: "12px 20px 6px",
};

const rowStyle = (selected: boolean): React.CSSProperties => ({
  padding: "10px 20px",
  cursor: "pointer",
  background: selected ? "var(--surface-hover)" : "transparent",
  transition: "background-color 150ms ease-out",
  display: "flex",
  alignItems: "center",
  gap: 12,
});

const chipStyle = (selected: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  height: 24,
  minWidth: 24,
  padding: "0 6px",
  borderRadius: 6,
  border: "1px solid var(--hairline)",
  background: selected ? "var(--surface)" : "var(--surface-secondary)",
  color: selected ? "var(--icon-primary)" : "var(--icon-secondary)",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "capitalize",
  flexShrink: 0,
});

export default function Topbar() {
  const { user, workspace } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifFilter, setNotifFilter] = useState<"all" | "unread">("all");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initial fetch to check sync status
    const checkSyncStatus = async () => {
      try {
        const res = await fetch("/api/sources");
        if (res.ok) {
          const data = await res.json();
          const syncing = data.data?.sources?.some((s: { status: string }) => s.status === "syncing" || s.status === "pending");
          setIsSyncing(!!syncing);
        }
      } catch (e) {
        console.error("Failed to fetch sync status", e);
      }
    };
    checkSyncStatus();

    // Poll every 10s if syncing
    const interval = setInterval(() => {
      checkSyncStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // ── Keyboard Shortcuts ───────────────────────────────────────────────────
  // Cmd+K shortcut moved to global CommandPalette component
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowNotifs(false);
        setShowUserMenu(false);
        if (typeof document !== "undefined") {
          document.body.classList.remove("mobile-sidebar-open");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close popovers on an outside click.
  useEffect(() => {
    if (!showNotifs && !showUserMenu) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (showNotifs && notifRef.current && !notifRef.current.contains(t)) setShowNotifs(false);
      if (showUserMenu && userRef.current && !userRef.current.contains(t)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showNotifs, showUserMenu]);

  // Focus input when search modal opens
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showSearch]);

  // ── Real Search with Debounce ────────────────────────────────────────────
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), limit: 6 }),
      });

      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data.data?.results || []);
      setSelectedIndex(0);
    } catch {
      setSearchError("Search failed. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchTimerRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 350);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, performSearch]);

  // ── Arrow key navigation ─────────────────────────────────────────────────
  const getActionResults = (q: string) => {
    if (!q.trim()) return QUICK_ACTIONS;
    const lowerQ = q.toLowerCase();
    return QUICK_ACTIONS.filter(a => a.label.toLowerCase().includes(lowerQ));
  };

  const currentActionResults = getActionResults(searchQuery);
  const totalItems = currentActionResults.length + searchResults.length;

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    const maxIdx = totalItems - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, maxIdx));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex < currentActionResults.length) {
        const action = currentActionResults[selectedIndex];
        setShowSearch(false);
        router.push(action.href);
      } else {
        const resIdx = selectedIndex - currentActionResults.length;
        if (searchResults[resIdx]?.metadata?.url) {
          window.open(searchResults[resIdx].metadata.url!, "_blank");
        } else if (searchQuery.trim()) {
          setShowSearch(false);
          router.push(`/dashboard/ask-corely?q=${encodeURIComponent(searchQuery)}`);
        }
      }
    }
  };

  // ── Notifications ────────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: AppNotification) => !n.isRead).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setShowNotifs(false);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const markAsRead = async (id: string, currentIsRead: boolean) => {
    if (currentIsRead) return;
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const renderNotifIcon = (type: string) => {
    switch (type) {
      case "Sparkles": return <Sparkles />;
      case "CheckCircle2": return <CheckCircle2 />;
      case "AlertTriangle": return <AlertTriangle />;
      case "Cpu": return <Cpu />;
      case "UserPlus": return <UserPlus />;
      case "Database": return <Database />;
      default: return <Bell />;
    }
  };

  const handleClose = () => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
  };

  const highlightSnippet = (content: string, query: string) => {
    const maxLen = 110;
    const lower = content.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase().split(" ")[0]);
    const start = Math.max(0, idx - 20);
    const snippet = content.slice(start, start + maxLen);
    return (start > 0 ? "..." : "") + snippet + (snippet.length >= maxLen ? "..." : "");
  };

  const visibleNotifications = notifFilter === "unread" ? notifications.filter(n => !n.isRead) : notifications;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <header className="db-topbar">
      <div className="db-topbar-left">
        <button
          className="db-hamburger-btn"
          aria-label="Toggle menu"
          onClick={() => {
            if (typeof document !== "undefined") {
              document.body.classList.toggle("mobile-sidebar-open");
            }
          }}
        >
          <Menu size={18} />
        </button>

        {/* Workspace name. Each user has one workspace, so this is a label, not a switcher. */}
        <div
          className="db-ws-btn"
          title={workspace?.name || "Workspace"}
          style={{ cursor: "default", background: "var(--surface)", borderColor: "var(--hairline)" }}
        >
          <Building2 size={16} aria-hidden="true" />
          <span>{workspace?.name || "Workspace"}</span>
        </div>

        {/* Search */}
        <button
          className="db-search-bar"
          onClick={() => setShowSearch(true)}
          aria-label="Global search"
        >
          <span className="db-search-inner">
            <Search size={16} />
            <span className="db-search-text">Search your knowledge...</span>
          </span>
        </button>
      </div>

      {/* Right Actions */}
      <div className="db-topbar-right">
        {isSyncing && (
          <span className="db-sync-pill">
            <Loader2 className="animate-spin" /> Syncing
          </span>
        )}

        {/* Help Button */}
        <button
          className="ui-icon-btn"
          onClick={() => setShowHelp(true)}
          aria-label="Help and shortcuts"
        >
          <HelpCircle size={18} />
        </button>

        {/* Light / dark mode */}
        <button
          type="button"
          className="ui-icon-btn"
          onClick={e => {
            const next = isDark ? "light" : "dark";
            switchThemeWithTransition(next, () => setTheme(next), { x: e.clientX, y: e.clientY });
          }}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="db-popover-anchor" ref={notifRef}>
          <button
            className="ui-icon-btn db-notif-btn"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            aria-expanded={showNotifs}
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="db-notif-dot" aria-hidden="true" />}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                className="db-popover ui-popover"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{ width: 360, display: "flex", flexDirection: "column" }}
              >
                <div className="db-popover-head">
                  <span className="type-heading">Notifications</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["all", "unread"] as const).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setNotifFilter(f)}
                        className={`ui-badge ${notifFilter === f ? "ui-badge--solid" : "ui-badge--neutral"}`}
                        style={{ cursor: "pointer", textTransform: "capitalize" }}
                      >
                        {f}{f === "unread" && unreadCount > 0 ? ` ${unreadCount}` : ""}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ overflowY: "auto", maxHeight: 300 }}>
                  {visibleNotifications.length === 0 ? (
                    <div className="ui-empty" style={{ padding: "40px 24px", gap: 8 }}>
                      <Bell size={20} style={{ color: "var(--icon-disabled)" }} />
                      <span className="type-caption">
                        {notifFilter === "unread" ? "No unread notifications" : "No notifications yet"}
                      </span>
                    </div>
                  ) : (
                    visibleNotifications.map(notif => (
                      <div
                        key={notif.id}
                        className="db-notif-row"
                        data-unread={notif.isRead ? "false" : "true"}
                        onClick={() => markAsRead(notif.id, notif.isRead)}
                      >
                        <span className="db-notif-icon">{renderNotifIcon(notif.iconType)}</span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="type-body" style={{ fontWeight: notif.isRead ? 500 : 700 }}>{notif.title}</div>
                          <div className="type-caption" style={{ color: "var(--text-secondary)", marginTop: 2, fontWeight: 400 }}>{notif.message}</div>
                          <div className="type-caption" style={{ marginTop: 4 }}>
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                        {!notif.isRead && (
                          <span style={{ width: 6, height: 6, background: "var(--accent-fill)", borderRadius: 9999, alignSelf: "center", flexShrink: 0 }} />
                        )}
                      </div>
                    ))
                  )}
                </div>
                {unreadCount > 0 && (
                  <div style={{ padding: 8, borderTop: "1px solid var(--hairline)" }}>
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm ui-btn--block" onClick={markAllAsRead}>
                      Mark all as read
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile chip */}
        <div className="db-popover-anchor" ref={userRef}>
          <button
            type="button"
            className="db-profile-chip"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="Account menu"
            aria-expanded={showUserMenu}
          >
            <span className="db-user-avatar">{initial}</span>
            <ChevronDown size={14} />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                className="db-popover ui-popover"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{ width: 240 }}
              >
                <div style={{ padding: 16, borderBottom: "1px solid var(--hairline)" }}>
                  <div className="type-body" style={{ fontWeight: 600 }}>{user?.name || "User"}</div>
                  <div className="type-caption" style={{ marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
                  {user?.roleName && (
                    <span className="ui-badge ui-badge--neutral" style={{ marginTop: 10 }}>{user.roleName}</span>
                  )}
                </div>
                <div style={{ padding: 6 }}>
                  <Link href="/dashboard/profile" onClick={() => setShowUserMenu(false)} className="ui-menu-item">
                    <User /> Profile
                  </Link>
                  <Link href="/dashboard/settings" onClick={() => setShowUserMenu(false)} className="ui-menu-item">
                    <Settings /> Settings
                  </Link>
                </div>
                <div style={{ padding: 6, borderTop: "1px solid var(--hairline)" }}>
                  <button
                    type="button"
                    className="ui-menu-item ui-menu-item--danger"
                    onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" });
                      router.push("/login");
                      router.refresh();
                    }}
                  >
                    <LogOut /> Log out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Global Search Modal ───────────────────────────────────────────────── */}
      {mounted && showSearch && createPortal(
        <div
          className="global-search-overlay"
          onClick={handleClose}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "var(--overlay)", backdropFilter: "blur(4px)",
            zIndex: 99999, display: "flex", alignItems: "flex-start",
            justifyContent: "center", padding: "10vh 16px 0"
          }}
        >
          <motion.div
            className="global-search-modal ui-popover"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column" }}
          >
            {/* Search Input */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--hairline)" }}>
              {isSearching
                ? <Loader2 size={18} className="animate-spin" style={{ color: "var(--icon-secondary)", flexShrink: 0 }} />
                : <Search size={18} style={{ color: "var(--icon-secondary)", flexShrink: 0 }} />
              }
              <input
                ref={inputRef}
                type="text"
                placeholder="Search documents, decisions, discussions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                style={{
                  flex: 1, border: "none", outline: "none", fontSize: 16, lineHeight: "24px",
                  background: "transparent", color: "var(--text-primary)", fontWeight: 500, fontFamily: "inherit", boxShadow: "none"
                }}
              />
              {searchQuery && (
                <button
                  className="ui-icon-btn ui-icon-btn--sm"
                  style={{ border: "none", boxShadow: "none", background: "transparent" }}
                  onClick={() => { setSearchQuery(""); setSearchResults([]); inputRef.current?.focus(); }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
              <button type="button" className="ui-kbd" onClick={handleClose} style={{ cursor: "pointer" }}>
                ESC
              </button>
            </div>

            {/* Results Area */}
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {searchError && (
                <div className="type-body" style={{ padding: "20px 24px", textAlign: "center", color: "var(--error)" }}>
                  {searchError}
                </div>
              )}

              {!searchError && searchQuery.trim() && !isSearching && searchResults.length === 0 && currentActionResults.length === 0 && (
                <div className="ui-empty" style={{ padding: "40px 24px" }}>
                  <span className="ui-icon-well ui-icon-well--sm"><Search /></span>
                  <p className="type-heading">No results for &ldquo;{searchQuery}&rdquo;</p>
                  <p className="type-subtitle ui-empty__text">Try connecting more sources or rephrasing your question.</p>
                  <Link
                    href={`/dashboard/ask-corely?q=${encodeURIComponent(searchQuery)}`}
                    onClick={handleClose}
                    className="ui-btn ui-btn--primary"
                    style={{ marginTop: 4 }}
                  >
                    <Sparkles /> Ask Corely instead
                  </Link>
                </div>
              )}

              {!searchQuery.trim() && (
                <div style={{ paddingBottom: 8 }}>
                  <div className="type-label" style={sectionLabelStyle}>Suggested searches</div>
                  {SUGGESTED_SEARCHES.map(q => (
                    <div
                      key={q}
                      onClick={() => setSearchQuery(q)}
                      style={rowStyle(false)}
                      onMouseOver={e => { e.currentTarget.style.background = "var(--surface-hover)"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <Search size={14} style={{ color: "var(--icon-secondary)" }} />
                      <span className="type-body">{q}</span>
                    </div>
                  ))}
                </div>
              )}

              {(currentActionResults.length > 0 || searchResults.length > 0) && (
                <div style={{ paddingBottom: 8 }}>
                  {currentActionResults.length > 0 && (
                    <>
                      <div className="type-label" style={sectionLabelStyle}>Quick actions</div>
                      {currentActionResults.map((action, idx) => {
                        const isSelected = idx === selectedIndex;
                        return (
                          <div
                            key={action.id}
                            onClick={() => {
                              handleClose();
                              router.push(action.href);
                            }}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            style={rowStyle(isSelected)}
                          >
                            <span style={chipStyle(isSelected)}>{action.icon}</span>
                            <span className="type-body" style={{ fontWeight: 500 }}>{action.label}</span>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {searchResults.length > 0 && (
                    <>
                      <div className="type-label" style={sectionLabelStyle}>Knowledge results ({searchResults.length})</div>
                      {searchResults.map((result, resIdx) => {
                        const idx = currentActionResults.length + resIdx;
                        const meta = result.metadata || {};
                        const isSelected = idx === selectedIndex;
                        const sourceType = meta.file_type || meta.source_type || "document";
                        return (
                          <div
                            key={result.id}
                            onClick={() => {
                              if (meta.url) {
                                window.open(meta.url, "_blank");
                              } else {
                                router.push(`/dashboard/ask-corely?q=${encodeURIComponent(searchQuery)}`);
                                handleClose();
                              }
                            }}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            style={{ ...rowStyle(isSelected), flexDirection: "column", alignItems: "stretch", gap: 4, padding: "12px 20px" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                <span style={chipStyle(isSelected)}>
                                  <SourceLogo type={meta.source_type || meta.file_type} size={14} tile={false} />
                                  {sourceType.replace(/_/g, " ")}
                                </span>
                                <span className="type-body" style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {meta.document_title || "Untitled Document"}
                                </span>
                              </div>
                              {meta.url && <ExternalLink size={12} style={{ color: "var(--icon-secondary)", flexShrink: 0 }} />}
                            </div>
                            <p className="type-caption" style={{ color: "var(--text-secondary)", fontWeight: 400, lineHeight: "18px" }}>
                              {highlightSnippet(result.content, searchQuery)}
                            </p>
                            <div className="type-caption">
                              Relevance {Math.round(result.similarity * 100)}%
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="type-caption" style={{
              padding: "10px 20px", borderTop: "1px solid var(--hairline)",
              background: "var(--surface-secondary)", display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 12
            }}>
              <div style={{ display: "flex", gap: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <kbd className="ui-kbd">↵</kbd> to open
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <kbd className="ui-kbd">↓</kbd><kbd className="ui-kbd">↑</kbd> to move
                </span>
              </div>
              <span>Corely knowledge search</span>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </header>
  );
}
