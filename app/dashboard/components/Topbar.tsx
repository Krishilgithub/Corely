"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Sparkles, Bell, ChevronDown, Command, Search, X,
  Menu, CheckCircle2, Cpu, AlertTriangle, UserPlus, Database,
  FileText, GitBranch, Hash, MessageSquare, RefreshCw, ExternalLink, Loader2
} from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

const SOURCE_TYPE_ICONS: Record<string, React.ReactNode> = {
  github: <GitBranch size={13} />,
  slack: <Hash size={13} />,
  notion: <FileText size={13} />,
  google_drive: <FileText size={13} />,
  linear: <RefreshCw size={13} />,
  gmail: <MessageSquare size={13} />,
};

function getSourceIcon(type?: string) {
  if (!type) return <Database size={13} />;
  const normalized = type.toLowerCase().replace(/_/g, "");
  for (const [k, v] of Object.entries(SOURCE_TYPE_ICONS)) {
    if (normalized.includes(k)) return v;
  }
  return <FileText size={13} />;
}

const SUGGESTED = [
  "What was the decision on the Q3 roadmap?",
  "Find onboarding docs for new engineers",
  "What are the open bugs from last sprint?",
];

export default function Topbar() {
  const { user, workspace } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Keyboard Shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearch((prev) => !prev);
        setSearchQuery("");
        setSearchResults([]);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowNotifs(false);
        if (typeof document !== "undefined") {
          document.body.classList.remove("mobile-sidebar-open");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    const maxIdx = searchResults.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, maxIdx));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults[selectedIndex]?.metadata?.url) {
        window.open(searchResults[selectedIndex].metadata.url!, "_blank");
      } else if (searchQuery.trim()) {
        // Navigate to Ask Corely with the query
        setShowSearch(false);
        router.push(`/dashboard/ask-corely?q=${encodeURIComponent(searchQuery)}`);
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
    const props = { size: 14 };
    switch (type) {
      case "Sparkles": return <Sparkles {...props} />;
      case "CheckCircle2": return <CheckCircle2 {...props} />;
      case "AlertTriangle": return <AlertTriangle {...props} />;
      case "Cpu": return <Cpu {...props} />;
      case "UserPlus": return <UserPlus {...props} />;
      case "Database": return <Database {...props} />;
      default: return <Bell {...props} />;
    }
  };

  const getIconStyles = (type: string) => {
    switch (type) {
      case "Sparkles": return { bg: "#fef2f2", color: "#ef4444" };
      case "CheckCircle2": return { bg: "#f0fdf4", color: "#16a34a" };
      case "AlertTriangle": return { bg: "#fefce8", color: "#eab308" };
      case "Cpu": return { bg: "#eff6ff", color: "#3b82f6" };
      case "UserPlus": return { bg: "#f5f3ff", color: "#8b5cf6" };
      case "Database": return { bg: "#fff7ed", color: "#f97316" };
      default: return { bg: "#f4f4f5", color: "#71717a" };
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

  return (
    <motion.header
      className="db-topbar"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <button
          className="db-hamburger-btn"
          aria-label="Toggle menu"
          onClick={() => {
            if (typeof document !== "undefined") {
              document.body.classList.toggle("mobile-sidebar-open");
            }
          }}
        >
          <Menu size={20} />
        </button>

        {/* Workspace Switcher */}
        <button className="db-ws-btn" aria-label="Switch workspace">
          <Building2 size={13} style={{ color: "#71717a" }} />
          <span>{workspace?.name || "Workspace"}</span>
          <ChevronDown size={12} style={{ color: "#a1a1aa" }} />
        </button>
      </div>

      {/* AI Search */}
      <button
        className="db-search-bar"
        onClick={() => setShowSearch(true)}
        aria-label="Global search"
        style={{ border: "none", cursor: "pointer", background: "white", position: "relative", zIndex: 50, pointerEvents: "auto" }}
      >
        <div className="db-search-inner">
          <Sparkles size={14} style={{ color: "#ff6b00", flexShrink: 0 }} />
          <span className="db-search-text">Search or ask anything about your company...</span>
        </div>
        <div className="db-search-kbd">
          <Command size={10} />
          <span>K</span>
        </div>
      </button>

      {/* Right Actions */}
      <div className="db-topbar-right">
        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            className="db-notif-btn"
            aria-label="Notifications"
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="db-notif-badge" aria-label={`${unreadCount} notifications`}>{unreadCount}</span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute", top: "100%", right: 0, marginTop: 12,
                  background: "#fff", border: "1px solid #e4e4e7", borderRadius: 12,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)", zIndex: 50, width: 320,
                  display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: 400
                }}
              >
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #e4e4e7", fontWeight: 600, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  Notifications
                  {unreadCount > 0 && (
                    <span style={{ fontSize: 11, background: "#fef2f2", color: "#ef4444", padding: "2px 6px", borderRadius: 100 }}>{unreadCount} new</span>
                  )}
                </div>
                <div style={{ overflowY: "auto", flex: 1 }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: "center", color: "#a1a1aa", fontSize: 13 }}>
                      <Bell size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(notif => {
                      const style = getIconStyles(notif.iconType);
                      return (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id, notif.isRead)}
                          style={{
                            padding: "12px 16px", borderBottom: "1px solid #f4f4f5",
                            display: "flex", gap: 12,
                            background: notif.isRead ? "transparent" : "#fafafa",
                            cursor: "pointer", transition: "background 0.2s"
                          }}
                        >
                          <div style={{ background: style.bg, color: style.color, width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {renderNotifIcon(notif.iconType)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: notif.isRead ? 500 : 600, color: "#18181b" }}>{notif.title}</div>
                            <div style={{ fontSize: 12, color: "#71717a", marginTop: 2, lineHeight: 1.4 }}>{notif.message}</div>
                            <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 4 }}>
                              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                          {!notif.isRead && (
                            <div style={{ width: 6, height: 6, background: "#ff6b00", borderRadius: "50%", alignSelf: "center", marginLeft: "auto", flexShrink: 0 }} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                {notifications.length > 0 && unreadCount > 0 && (
                  <div style={{ padding: "8px 16px", background: "#fafafa", borderTop: "1px solid #e4e4e7", textAlign: "center" }}>
                    <span style={{ fontSize: 12, color: "#ff6b00", fontWeight: 600, cursor: "pointer" }} onClick={markAllAsRead}>
                      Mark all as read
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <div
          style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #ff6b00, #ff9240)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 900, color: "#fff",
            cursor: "pointer", border: "1.5px solid #ebebeb",
          }}
          aria-label="User profile"
        >
          {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
        </div>
      </div>

      {/* ── Global Search Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {mounted && showSearch && createPortal(
          <div
            className="global-search-overlay"
            onClick={handleClose}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
              zIndex: 99999, display: "flex", alignItems: "flex-start",
              justifyContent: "center", paddingTop: "10vh"
            }}
          >
            <motion.div
              className="global-search-modal"
              initial={{ scale: 0.96, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff", borderRadius: 16, width: "100%", maxWidth: 660,
                boxShadow: "0 30px 60px -12px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.06)",
                overflow: "hidden", display: "flex", flexDirection: "column"
              }}
            >
              {/* Search Input */}
              <div style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #f0f0f0" }}>
                {isSearching
                  ? <Loader2 size={20} color="#ff6b00" style={{ marginRight: 14, flexShrink: 0, animation: "spin 1s linear infinite" }} />
                  : <Search size={20} color="#a1a1aa" style={{ marginRight: 14, flexShrink: 0 }} />
                }
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search documents, decisions, discussions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  style={{
                    flex: 1, border: "none", outline: "none", fontSize: 16,
                    background: "transparent", color: "#18181b", fontWeight: 500
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); setSearchResults([]); inputRef.current?.focus(); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#a1a1aa" }}
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  style={{
                    background: "#f4f4f5", border: "1px solid #e4e4e7", cursor: "pointer",
                    padding: "3px 7px", display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#71717a", marginLeft: 8
                  }}
                >
                  ESC
                </button>
              </div>

              {/* Results Area */}
              <div style={{ maxHeight: 420, overflowY: "auto", background: "#fafafa" }}>
                {searchError && (
                  <div style={{ padding: "20px 24px", textAlign: "center", color: "#ef4444", fontSize: 14 }}>
                    {searchError}
                  </div>
                )}

                {!searchError && searchQuery.trim() && !isSearching && searchResults.length === 0 && (
                  <div style={{ padding: "32px 24px", textAlign: "center" }}>
                    <Search size={32} color="#d4d4d8" style={{ margin: "0 auto 12px" }} />
                    <p style={{ fontSize: 15, color: "#71717a", fontWeight: 500 }}>No results found for &ldquo;{searchQuery}&rdquo;</p>
                    <p style={{ fontSize: 13, color: "#a1a1aa", marginTop: 6 }}>Try connecting more sources or rephrasing your query</p>
                    <Link
                      href={`/dashboard/ask-corely?q=${encodeURIComponent(searchQuery)}`}
                      onClick={handleClose}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16,
                        padding: "8px 16px", background: "#ff6b00", color: "#fff",
                        borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none"
                      }}
                    >
                      <Sparkles size={13} /> Ask Corely AI instead
                    </Link>
                  </div>
                )}

                {!searchQuery.trim() && (
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 600, color: "#a1a1aa", marginBottom: 10, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Suggested Searches
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {SUGGESTED.map(q => (
                        <button
                          key={q}
                          onClick={() => setSearchQuery(q)}
                          style={{
                            textAlign: "left", padding: "10px 12px", background: "transparent",
                            border: "1px solid transparent", borderRadius: 8, color: "#3f3f46",
                            cursor: "pointer", transition: "all 0.12s", fontSize: 14,
                            display: "flex", alignItems: "center", gap: 10
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.background = "#fff";
                            e.currentTarget.style.borderColor = "#e4e4e7";
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = "transparent";
                          }}
                        >
                          <Search size={13} color="#a1a1aa" />
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div style={{ padding: "8px 0" }}>
                    <div style={{ fontWeight: 600, color: "#a1a1aa", marginBottom: 4, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 20px 8px" }}>
                      {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
                    </div>
                    {searchResults.map((result, idx) => {
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
                          style={{
                            padding: "12px 20px", cursor: "pointer",
                            background: isSelected ? "#fff7ed" : "transparent",
                            borderLeft: isSelected ? "3px solid #ff6b00" : "3px solid transparent",
                            transition: "all 0.1s",
                            display: "flex", flexDirection: "column", gap: 4,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                background: isSelected ? "#fff" : "#f4f4f5",
                                color: isSelected ? "#ff6b00" : "#71717a",
                                borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600
                              }}>
                                {getSourceIcon(sourceType)}
                                {sourceType.replace(/_/g, " ")}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#18181b" }}>
                                {meta.document_title || "Untitled Document"}
                              </span>
                            </div>
                            {meta.url && <ExternalLink size={12} color="#a1a1aa" style={{ flexShrink: 0 }} />}
                          </div>
                          <p style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5, margin: 0 }}>
                            {highlightSnippet(result.content, searchQuery)}
                          </p>
                          <div style={{ fontSize: 11, color: "#a1a1aa" }}>
                            Relevance: {Math.round(result.similarity * 100)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: "10px 20px", borderTop: "1px solid #f0f0f0",
                background: "#fff", display: "flex", alignItems: "center",
                justifyContent: "space-between", fontSize: 12, color: "#a1a1aa"
              }}>
                <div style={{ display: "flex", gap: 14 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <kbd style={{ background: "#f4f4f5", padding: "2px 6px", borderRadius: 4, border: "1px solid #e4e4e7", fontFamily: "inherit", color: "#71717a" }}>↵</kbd>
                    to open
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <kbd style={{ background: "#f4f4f5", padding: "2px 6px", borderRadius: 4, border: "1px solid #e4e4e7", fontFamily: "inherit", color: "#71717a" }}>↓</kbd>
                    <kbd style={{ background: "#f4f4f5", padding: "2px 6px", borderRadius: 4, border: "1px solid #e4e4e7", fontFamily: "inherit", color: "#71717a" }}>↑</kbd>
                    navigate
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={11} color="#ff6b00" />
                  Corely Knowledge Search
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </motion.header>
  );
}
