"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../lib/auth-context";
import { motion } from "framer-motion";
import {
  Users,
  Folder,
  Calendar,
  Database,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";



interface ChatSessionInfo {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface AskRightSidebarProps {
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  refreshTrigger: number;
  setSharedPrompt: (prompt: string | null) => void;
}

export default function AskRightSidebar({
  activeSessionId,
  setActiveSessionId,
  refreshTrigger,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setSharedPrompt,
}: AskRightSidebarProps) {
  const { workspaceId } = useAuth();
  const [sessions, setSessions] = useState<ChatSessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ people: number; sources: number; sessions: number; memories: number } | null>(null);
  const [sessionSearch, setSessionSearch] = useState("");

  // Filter sessions by search query
  const filteredSessions = useMemo(() => {
    if (!sessionSearch.trim()) return sessions;
    return sessions.filter((s) =>
      s.title.toLowerCase().includes(sessionSearch.toLowerCase())
    );
  }, [sessions, sessionSearch]);

  useEffect(() => {
    if (!workspaceId) return;
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/context-stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, [workspaceId, refreshTrigger]);

  // ── Fetch session history list ──────────────────────────────────────────────
  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        if (!workspaceId) return;
        const response = await fetch(`/api/chats?workspaceId=${workspaceId}`);
        if (!response.ok) {
          throw new Error("Failed to load chat sessions");
        }
        const responseData = await response.json();
        setSessions(responseData.data?.sessions || []);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchSessions();
  }, [refreshTrigger, workspaceId]);

  // ── Delete a conversation session ────────────────────────────────────────────
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      const response = await fetch(`/api/chats/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }

      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  return (
    <div style={{ flexShrink: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 14, overflowY: "hidden", paddingRight: 4 }}>
      {/* New Chat Button */}
      <motion.button
        onClick={() => setActiveSessionId(null)}
        className="ac-new-chat-btn"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "10px",
          background: "#ff6b00",
          color: "#fff",
          border: "none",
          fontWeight: "600",
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow: "0 4px 12px rgba(255, 107, 0, 0.15)",
          transition: "all 0.2s ease",
        }}
      >
        <Sparkles size={15} fill="#fff" />
        New Conversation
      </motion.button>

      {/* Context Card */}
      <motion.div
        className="ac-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="ac-card-header">
          <div className="ac-card-title">
            Context <span style={{ color: "#71717a", fontWeight: 500 }}>(Auto-detected)</span>
          </div>
          <Link href="/dashboard/sources" className="ac-card-view-all">View all</Link>
        </div>

        <div className="ac-card-row">
          <div className="ac-row-left">
            <Users size={15} style={{ color: "#71717a" }} /> People
          </div>
          <div className="ac-row-right">{stats?.people ?? "-"}</div>
        </div>
        <div className="ac-card-row">
          <div className="ac-row-left">
            <Folder size={15} style={{ color: "#71717a" }} /> Chat Sessions
          </div>
          <div className="ac-row-right">{stats?.sessions ?? "-"}</div>
        </div>
        <div className="ac-card-row">
          <div className="ac-row-left">
            <Database size={15} style={{ color: "#71717a" }} /> Memories
          </div>
          <div className="ac-row-right">{stats?.memories ?? "-"}</div>
        </div>
        <div className="ac-card-row">
          <div className="ac-row-left">
            <Calendar size={15} style={{ color: "#71717a" }} /> Time Range
          </div>
          <div className="ac-row-right">This Week</div>
        </div>
        <div className="ac-card-row">
          <div className="ac-row-left">
            <Database size={15} style={{ color: "#71717a" }} /> Data Sources
          </div>
          <div className="ac-row-right" style={{ color: "#111", fontWeight: 600 }}>
            {stats?.sources ?? "-"} Connected
          </div>
        </div>
      </motion.div>



      {/* Recent Conversations */}
      <motion.div
        className="ac-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        <div className="ac-card-header" style={{ flexShrink: 0 }}>
          <div className="ac-card-title">Recent Conversations</div>
        </div>
        {/* Conversation search */}
        <div style={{ padding: "0 0 8px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#f9f9f9", border: "1px solid #f0f0f0", borderRadius: 8 }}>
            <Search size={13} style={{ color: "#a1a1aa", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", width: "100%" }}
            />
          </div>
        </div>
        <div 
          className="ac-convo-list" 
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", paddingRight: "4px" }}
        >
          {loading && sessions.length === 0 && (
            <div style={{ color: "#a1a1aa", fontSize: "12px", textAlign: "center", padding: "12px 0" }}>
              Loading conversations...
            </div>
          )}
          {!loading && sessions.length === 0 && (
            <div style={{ color: "#a1a1aa", fontSize: "12px", textAlign: "center", padding: "12px 0" }}>
              No recent conversations.
            </div>
          )}
          {!loading && sessions.length > 0 && filteredSessions.length === 0 && (
            <div style={{ color: "#a1a1aa", fontSize: "12px", textAlign: "center", padding: "12px 0" }}>
              No conversations match your search.
            </div>
          )}
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`ac-convo-item ${activeSessionId === session.id ? "active" : ""}`}
              onClick={() => setActiveSessionId(session.id)}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
                <span className="ac-convo-title" style={{ display: "block" }}>
                  {session.title}
                </span>
                <span className="ac-convo-time">
                  {new Date(session.updatedAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDeleteSession(session.id);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  color: "#a1a1aa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(239, 68, 68, 0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
                title="Delete Conversation"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA Card */}
      <motion.div
        className="ac-cta-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <div className="ac-cta-title">
          <Sparkles size={16} style={{ color: "#ff6b00" }} fill="#ff6b00" />
          Get the most out of Corely
        </div>
        <div className="ac-cta-desc">
          Connect more sources to improve answer accuracy.
        </div>
        <Link href="/dashboard/sources" className="ac-cta-btn">
          Manage Sources
        </Link>
      </motion.div>
    </div>
  );
}
