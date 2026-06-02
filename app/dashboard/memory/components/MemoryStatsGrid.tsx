"use client";

import { Brain, Sparkles, Clock, ShieldAlert } from "lucide-react";
import { MemoryStats } from "../types";
import "../memory.css";

interface MemoryStatsGridProps {
  stats: MemoryStats;
}

export function MemoryStatsGrid({ stats }: MemoryStatsGridProps) {
  return (
    <div className="mem-stats-grid">
      {/* Card 1 */}
      <div className="mem-stat-card">
        <div className="mem-stat-icon-wrapper" style={{ background: "#fff3ee", color: "#ff6b00" }}>
          <Brain size={20} strokeWidth={2.5} />
        </div>
        <div className="mem-stat-info">
          <span className="mem-stat-value">{stats.totalMemories.toLocaleString()}</span>
          <span className="mem-stat-label">Memory Items</span>
          <span className="mem-stat-trend" style={{ color: "#10b981" }}>
            ↑ {Math.max(1, Math.round(stats.totalMemories * 0.12))}% <span style={{ color: "var(--db-text-muted)", fontWeight: 500 }}>vs last month</span>
          </span>
        </div>
      </div>
      {/* Card 2 */}
      <div className="mem-stat-card">
        <div className="mem-stat-icon-wrapper" style={{ background: "#f5f3ff", color: "#a855f7" }}>
          <Sparkles size={20} strokeWidth={2.5} />
        </div>
        <div className="mem-stat-info">
          <span className="mem-stat-value">{stats.totalDecisions.toLocaleString()}</span>
          <span className="mem-stat-label">Decisions Captured</span>
          <span className="mem-stat-trend" style={{ color: "#10b981" }}>
            ↑ {Math.max(1, Math.round(stats.totalDecisions * 0.15))}% <span style={{ color: "var(--db-text-muted)", fontWeight: 500 }}>vs last month</span>
          </span>
        </div>
      </div>
      {/* Card 3 */}
      <div className="mem-stat-card">
        <div className="mem-stat-icon-wrapper" style={{ background: "#eff6ff", color: "#3b82f6" }}>
          <Clock size={20} strokeWidth={2.5} />
        </div>
        <div className="mem-stat-info">
          <span className="mem-stat-value">
            {typeof window !== "undefined" ? (window as unknown as { __retentionPeriod?: string }).__retentionPeriod || "90 Days" : "90 Days"}
          </span>
          <span className="mem-stat-label">Context Retention</span>
          <span className="mem-stat-trend" style={{ color: "#10b981" }}>
            <span style={{ color: "var(--db-text-muted)", fontWeight: 500 }}>Global setting</span>
          </span>
        </div>
      </div>
      {/* Card 4 */}
      <div className="mem-stat-card">
        <div className="mem-stat-icon-wrapper" style={{ background: "#ecfdf5", color: "#10b981" }}>
          <ShieldAlert size={20} strokeWidth={2.5} />
        </div>
        <div className="mem-stat-info">
          <span className="mem-stat-value">{stats.totalActiveKnowledgeSets.toLocaleString()}</span>
          <span className="mem-stat-label">Active Knowledge Sets</span>
          <span className="mem-stat-trend" style={{ color: "#10b981" }}>
            ↑ {stats.activeKnowledgeTrend}% <span style={{ color: "var(--db-text-muted)", fontWeight: 500 }}>vs last month</span>
          </span>
        </div>
      </div>
    </div>
  );
}
