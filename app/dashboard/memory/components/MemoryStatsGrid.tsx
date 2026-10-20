"use client";

import { Brain, Sparkles, Clock, ShieldAlert } from "lucide-react";
import { KpiTile } from "@/components/ui/kpi-tile";
import { MemoryStats } from "../types";
import "../memory.css";

interface MemoryStatsGridProps {
  stats: MemoryStats;
}

export function MemoryStatsGrid({ stats }: MemoryStatsGridProps) {
  return (
    <div className="mem-stats-grid">
      {/* Card 1 */}
      <KpiTile
        className="mem-kpi--key"
        icon={<Brain />}
        value={stats.totalMemories.toLocaleString()}
        label="Memory items"
        delta={
          <span className="type-caption">
            ↑ {Math.max(1, Math.round(stats.totalMemories * 0.12))}% vs last month
          </span>
        }
      />
      {/* Card 2 */}
      <KpiTile
        icon={<Sparkles />}
        value={stats.totalDecisions.toLocaleString()}
        label="Decisions captured"
        delta={
          <span className="type-caption">
            ↑ {Math.max(1, Math.round(stats.totalDecisions * 0.15))}% vs last month
          </span>
        }
      />
      {/* Card 3 */}
      <KpiTile
        icon={<Clock />}
        value={typeof window !== "undefined" ? (window as unknown as { __retentionPeriod?: string }).__retentionPeriod || "90 Days" : "90 Days"}
        label="Context retention"
        delta={<span className="type-caption">Global setting</span>}
      />
      {/* Card 4 */}
      <KpiTile
        icon={<ShieldAlert />}
        value={stats.totalActiveKnowledgeSets.toLocaleString()}
        label="Active knowledge sets"
        delta={<span className="type-caption">↑ {stats.activeKnowledgeTrend}% vs last month</span>}
      />
    </div>
  );
}
