"use client";

import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  MessageSquare,
  FileText,
  Users,
  Zap,
  Trash2,
  ArrowRight,
  Plus,
} from "lucide-react";
import { MemoryStats, SourceChartData, SnapshotItem } from "../types";
import "../memory.css";

interface MemoryRightSidebarProps {
  stats: MemoryStats;
  sourceChartData: SourceChartData[];
  snapshots: SnapshotItem[];
  handleDeleteSnapshot: (id: string) => void;
}

// Width of a category bar as a share of all memory items.
const share = (count: number, total: number) => `${total > 0 ? (count / total) * 100 : 0}%`;

export function MemoryRightSidebar({
  stats,
  sourceChartData,
  snapshots,
  handleDeleteSnapshot
}: MemoryRightSidebarProps) {
  const categories = [
    { name: "Decisions", icon: <CheckCircle2 size={16} />, count: stats.totalDecisions },
    { name: "Discussions", icon: <MessageSquare size={16} />, count: stats.totalDiscussions },
    { name: "Documents", icon: <FileText size={16} />, count: stats.totalDocuments },
    { name: "Knowledge sets", icon: <Users size={16} />, count: stats.totalKnowledge },
    { name: "Insights", icon: <Zap size={16} />, count: stats.totalInsight },
  ];

  return (
    <div className="mem-right-column">

      {/* Panel 1: Memory Insights */}
      <div className="ui-card mem-sidebar-card">
        <div className="mem-sidebar-card-header">
          <h3 className="type-heading">Memory insights</h3>
        </div>

        <div className="mem-insights-banner">
          <div className="mem-insights-banner-header">
            <Sparkles size={16} />
            <span className="mem-insights-banner-title">Corely learns and remembers</span>
          </div>
          <p className="mem-insights-banner-desc">
            {/* Real count only: insight entries saved in memory */}
            {stats.totalInsight > 0
              ? `Your memory holds ${stats.totalInsight.toLocaleString()} insight ${stats.totalInsight === 1 ? "entry" : "entries"}.`
              : "Open Insights to see what Corely found in your synced data."}
          </p>
          <Link href="/dashboard/insights" style={{ textDecoration: "none" }}>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm">
              See insights <ArrowRight />
            </button>
          </Link>
        </div>
      </div>

      {/* Panel 2: Memory by Category */}
      <div className="ui-card mem-sidebar-card">
        <div className="mem-sidebar-card-header">
          <h3 className="type-heading">Memory by category</h3>
        </div>

        <div className="mem-category-list">
          {categories.map((cat) => (
            <div key={cat.name} className="mem-category-item">
              <div className="mem-category-row-top">
                <div className="mem-category-name-wrapper">
                  {cat.icon}
                  <span>{cat.name}</span>
                </div>
                <span className="mem-category-value">{cat.count.toLocaleString()}</span>
              </div>
              <div className="mem-category-bar-bg">
                <div className="mem-category-bar-fill" style={{ width: share(cat.count, stats.totalMemories) }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel 2.5: Memory Sources Donut */}
      <div className="ui-card mem-sidebar-card">
        <div className="mem-sidebar-card-header">
          <h3 className="type-heading">Memory sources</h3>
        </div>

        <div className="mem-donut-wrap">
          <div className="mem-donut">
            <svg viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="var(--surface-secondary)"
                strokeWidth="11"
              />
              {sourceChartData.map((s, i) => (
                <circle
                  key={i}
                  className="mem-donut-slice"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={s.color}
                  strokeWidth="11"
                  strokeDasharray={s.dash}
                  strokeDashoffset={s.offset}
                />
              ))}
            </svg>
            <div className="mem-donut-center">
              <span className="type-metric">{stats.totalMemories}</span>
              <span className="type-caption">Entries</span>
            </div>
          </div>

          {sourceChartData.length > 0 && (
            <div className="mem-legend">
              {sourceChartData.map((s, i) => (
                <div key={i} className="mem-legend-item">
                  <span className="mem-legend-dot" style={{ background: s.color }} />
                  <span className="mem-legend-count">{s.count}</span>
                  <span className="mem-legend-name">{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panel 3: Recent Snapshots */}
      <div className="ui-card mem-sidebar-card">
        <div className="mem-sidebar-card-header">
          <h3 className="type-heading">Recent snapshots</h3>
        </div>

        {snapshots.length > 0 ? (
          <div className="mem-snapshot-list">
            {snapshots.map((snap) => (
              <div key={snap.id} className="mem-snapshot-item">
                <div className="mem-snapshot-item-left">
                  <div className="mem-snapshot-icon-wrapper">
                    <FileText size={16} />
                  </div>
                  <div className="mem-snapshot-meta">
                    <span className="mem-snapshot-title">{snap.title}</span>
                    <span className="type-caption">{snap.date}</span>
                  </div>
                </div>
                <div className="mem-snapshot-actions">
                  {snap.isLatest && <span className="ui-badge ui-badge--neutral">Latest</span>}
                  <button
                    type="button"
                    className="ui-icon-btn ui-icon-btn--sm mem-snapshot-delete-btn"
                    onClick={() => handleDeleteSnapshot(snap.id)}
                    title="Delete snapshot"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="type-caption">No snapshots yet.</p>
        )}

        {/* A snapshot only stores a title today, so creating one is switched off until it saves real content. */}
        <button
          type="button"
          className="ui-btn ui-btn--secondary ui-btn--block"
          disabled
          title="Coming soon"
        >
          <Plus />
          Create snapshot (Coming soon)
        </button>
      </div>

    </div>
  );
}
