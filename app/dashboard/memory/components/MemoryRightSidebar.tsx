"use client";

import Link from "next/link";
import { Sparkles, CheckCircle2, MessageSquare, FileText, Users, Zap, Trash2 } from "lucide-react";
import { MemoryStats, SourceChartData, SnapshotItem } from "../types";
import "../memory.css";

interface MemoryRightSidebarProps {
  stats: MemoryStats;
  sourceChartData: SourceChartData[];
  snapshots: SnapshotItem[];
  handleCreateSnapshot: () => void;
  handleDeleteSnapshot: (id: string) => void;
}

export function MemoryRightSidebar({
  stats,
  sourceChartData,
  snapshots,
  handleCreateSnapshot,
  handleDeleteSnapshot
}: MemoryRightSidebarProps) {
  return (
    <div className="mem-right-column">
      
      {/* Panel 1: Memory Insights */}
      <div className="mem-sidebar-card">
        <div className="mem-sidebar-card-header">
          <span className="mem-sidebar-card-title">Memory Insights</span>
          <a href="#" className="mem-sidebar-view-all">View all</a>
        </div>

        <div className="mem-insights-banner">
          <div className="mem-insights-banner-header">
            <Sparkles size={14} fill="#ff6b00" />
            <span className="mem-insights-banner-title">Corely learns and remembers</span>
          </div>
          <p className="mem-insights-banner-desc">
            I&apos;ve identified {stats.totalInsight > 0 ? stats.totalInsight : 12} new connections across your data this week.
          </p>
          <Link href="/dashboard/insights" style={{ textDecoration: 'none' }}>
            <button className="mem-insights-btn">
              See insights →
            </button>
          </Link>
        </div>
      </div>

      {/* Panel 2: Memory by Category */}
      <div className="mem-sidebar-card">
        <div className="mem-sidebar-card-header">
          <span className="mem-sidebar-card-title">Memory by Category</span>
          <a href="#" className="mem-sidebar-view-all">View all</a>
        </div>

        <div className="mem-category-list">
          {/* Decisions */}
          <div className="mem-category-item">
            <div className="mem-category-row-top">
              <div className="mem-category-name-wrapper">
                <CheckCircle2 size={12} style={{ color: "#ff6b00" }} />
                <span>Decisions</span>
              </div>
              <span className="mem-category-value">{stats.totalDecisions.toLocaleString()}</span>
            </div>
            <div className="mem-category-bar-bg">
              <div className="mem-category-bar-fill" style={{ background: "#ff6b00", width: `${stats.totalMemories > 0 ? (stats.totalDecisions / stats.totalMemories) * 100 : 0}%` }} />
            </div>
          </div>

          {/* Discussions */}
          <div className="mem-category-item">
            <div className="mem-category-row-top">
              <div className="mem-category-name-wrapper">
                <MessageSquare size={12} style={{ color: "#8b5cf6" }} />
                <span>Discussions</span>
              </div>
              <span className="mem-category-value">{stats.totalDiscussions.toLocaleString()}</span>
            </div>
            <div className="mem-category-bar-bg">
              <div className="mem-category-bar-fill" style={{ background: "#8b5cf6", width: `${stats.totalMemories > 0 ? (stats.totalDiscussions / stats.totalMemories) * 100 : 0}%` }} />
            </div>
          </div>

          {/* Documents */}
          <div className="mem-category-item">
            <div className="mem-category-row-top">
              <div className="mem-category-name-wrapper">
                <FileText size={12} style={{ color: "#3b82f6" }} />
                <span>Documents</span>
              </div>
              <span className="mem-category-value">{stats.totalDocuments.toLocaleString()}</span>
            </div>
            <div className="mem-category-bar-bg">
              <div className="mem-category-bar-fill" style={{ background: "#3b82f6", width: `${stats.totalMemories > 0 ? (stats.totalDocuments / stats.totalMemories) * 100 : 0}%` }} />
            </div>
          </div>

          {/* People / Knowledge */}
          <div className="mem-category-item">
            <div className="mem-category-row-top">
              <div className="mem-category-name-wrapper">
                <Users size={12} style={{ color: "#10b981" }} />
                <span>Knowledge Sets</span>
              </div>
              <span className="mem-category-value">{stats.totalKnowledge.toLocaleString()}</span>
            </div>
            <div className="mem-category-bar-bg">
              <div className="mem-category-bar-fill" style={{ background: "#10b981", width: `${stats.totalMemories > 0 ? (stats.totalKnowledge / stats.totalMemories) * 100 : 0}%` }} />
            </div>
          </div>

          {/* Projects / Insights */}
          <div className="mem-category-item">
            <div className="mem-category-row-top">
              <div className="mem-category-name-wrapper">
                <Zap size={12} style={{ color: "#f59e0b" }} />
                <span>Insights</span>
              </div>
              <span className="mem-category-value">{stats.totalInsight.toLocaleString()}</span>
            </div>
            <div className="mem-category-bar-bg">
              <div className="mem-category-bar-fill" style={{ background: "#f59e0b", width: `${stats.totalMemories > 0 ? (stats.totalInsight / stats.totalMemories) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Panel 2.5: Memory Sources Donut */}
      <div className="mem-sidebar-card">
        <div className="mem-sidebar-card-header">
          <span className="mem-sidebar-card-title">Memory Sources</span>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0" }}>
          <div style={{ position: "relative", width: 140, height: 140 }}>
            <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="var(--db-border)"
                strokeWidth="11"
              />
              {sourceChartData.map((s, i) => (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={s.color}
                  strokeWidth="11"
                  strokeDasharray={s.dash}
                  strokeDashoffset={s.offset}
                  style={{ transition: "all 0.5s ease" }}
                />
              ))}
            </svg>
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#18181b", lineHeight: 1 }}>{stats.totalMemories}</div>
              <div style={{ fontSize: 11, color: "var(--db-text-muted)", fontWeight: 500, marginTop: 4 }}>Sources</div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px", justifyContent: "center", marginTop: 24, width: "100%" }}>
            {sourceChartData.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                <span style={{ fontWeight: 600, color: "#18181b" }}>{s.count}</span>
                <span style={{ color: "var(--db-text-muted)", textTransform: "capitalize" }}>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel 3: Recent Snapshots */}
      <div className="mem-sidebar-card">
        <div className="mem-sidebar-card-header">
          <span className="mem-sidebar-card-title">Recent Snapshots</span>
          <a href="#" className="mem-sidebar-view-all">View all</a>
        </div>

        <div className="mem-snapshot-list">
          {snapshots.map((snap) => (
            <div key={snap.id} className="mem-snapshot-item" style={{ position: "relative" }}>
              <div className="mem-snapshot-item-left">
                <div className="mem-snapshot-icon-wrapper">
                  <FileText size={16} />
                </div>
                <div className="mem-snapshot-meta">
                  <span className="mem-snapshot-title">{snap.title}</span>
                  <span className="mem-snapshot-date">{snap.date}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {snap.isLatest && <span className="mem-snapshot-badge">Latest</span>}
                <button
                  className="mem-snapshot-delete-btn"
                  onClick={() => handleDeleteSnapshot(snap.id)}
                  title="Delete snapshot"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="mem-snapshot-create-btn" onClick={handleCreateSnapshot}>
          Create Snapshot
        </button>
      </div>

    </div>
  );
}
