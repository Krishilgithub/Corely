"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../lib/auth-context";
import {
  Users,
  Folder,
  Calendar,
  Database,
  Search,
  Sparkles,
  Trash2,
  Download,
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";



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
    // The "New conversation" button now sits in the page header (AskMain).
    <aside className="ac-side" data-lenis-prevent>
      {/* Context Card */}
      <section className="ui-card">
        <div className="ui-card-header">
          <div className="ac-card-heading">
            <h2 className="type-heading">Context</h2>
            <span className="type-caption">Auto-detected</span>
          </div>
          <Link href="/dashboard/sources" className="ac-card-view-all">View all</Link>
        </div>

        <div className="ac-card-rows">
          <div className="ac-card-row">
            <div className="ac-row-left">
              <Users size={16} /> People
            </div>
            <span className="ui-badge">{stats?.people ?? "-"}</span>
          </div>
          <div className="ac-card-row">
            <div className="ac-row-left">
              <Folder size={16} /> Chat sessions
            </div>
            <span className="ui-badge">{stats?.sessions ?? "-"}</span>
          </div>
          <div className="ac-card-row">
            <div className="ac-row-left">
              <Database size={16} /> Memories
            </div>
            <span className="ui-badge">{stats?.memories ?? "-"}</span>
          </div>
          <div className="ac-card-row">
            <div className="ac-row-left">
              <Calendar size={16} /> Time range
            </div>
            <span className="ui-badge">This week</span>
          </div>
          <div className="ac-card-row">
            <div className="ac-row-left">
              <Database size={16} /> Data sources
            </div>
            <StatusBadge tone={stats && stats.sources > 0 ? "success" : "neutral"} dot={!!stats && stats.sources > 0}>
              {stats?.sources ?? "-"} connected
            </StatusBadge>
          </div>
        </div>
      </section>

      {/* Recent Conversations */}
      <section className="ui-card ac-convo-card">
        <div className="ui-card-header">
          <h2 className="type-heading">Recent conversations</h2>
          {sessions.length > 0 && <span className="ui-badge">{sessions.length}</span>}
        </div>

        {/* Conversation search */}
        <div className="ac-convo-search">
          <Search size={16} className="ac-convo-search-icon" />
          <input
            type="text"
            className="ui-input"
            aria-label="Search conversations"
            placeholder="Search conversations..."
            value={sessionSearch}
            onChange={(e) => setSessionSearch(e.target.value)}
          />
        </div>

        <div
          className="ac-convo-list"
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
        >
          {loading && sessions.length === 0 && (
            <p className="type-caption ac-convo-empty">Loading conversations...</p>
          )}
          {!loading && sessions.length === 0 && (
            <p className="type-caption ac-convo-empty">No recent conversations.</p>
          )}
          {!loading && sessions.length > 0 && filteredSessions.length === 0 && (
            <p className="type-caption ac-convo-empty">No conversations match your search.</p>
          )}
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`ac-convo-item ${activeSessionId === session.id ? "active" : ""}`}
              onClick={() => setActiveSessionId(session.id)}
            >
              <div className="ac-convo-text">
                <span className="ac-convo-title">{session.title}</span>
                <span className="ac-convo-time">
                  {new Date(session.updatedAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="ac-convo-actions">
                {/* Export button */}
                <button
                  type="button"
                  className="ui-icon-btn ui-icon-btn--sm ac-row-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    const a = document.createElement("a");
                    a.href = `/api/chats/${session.id}/export`;
                    a.download = `corely-${session.title.slice(0, 20)}.md`;
                    a.click();
                  }}
                  title="Export as Markdown"
                  aria-label="Export as Markdown"
                >
                  <Download size={14} />
                </button>
                {/* Delete button */}
                <button
                  type="button"
                  className="ui-icon-btn ui-icon-btn--sm ac-row-btn ac-row-btn--danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDeleteSession(session.id);
                  }}
                  title="Delete conversation"
                  aria-label="Delete conversation"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Card */}
      <section className="ui-card ac-cta-card">
        <div className="ac-cta-title">
          <span className="ac-cta-icon" aria-hidden="true">
            <Sparkles size={16} />
          </span>
          <h2 className="type-heading">Get the most out of Corely</h2>
        </div>
        <p className="ac-cta-desc">Connect more sources to improve answer accuracy.</p>
        <Link href="/dashboard/sources" className="ui-btn ui-btn--secondary ui-btn--sm ac-cta-btn">
          Manage sources
        </Link>
      </section>
    </aside>
  );
}
