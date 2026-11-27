"use client";

import { Brain, Sparkles, CalendarPlus, ShieldAlert } from "lucide-react";
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
      />
      {/* Card 2 */}
      <KpiTile
        icon={<Sparkles />}
        value={stats.totalDecisions.toLocaleString()}
        label="Decisions captured"
      />
      {/* Card 3 */}
      {/* Real count from createdAt, not a setting guess */}
      <KpiTile
        icon={<CalendarPlus />}
        value={stats.addedThisMonth.toLocaleString()}
        label="Added this month"
      />
      {/* Card 4 */}
      <KpiTile
        icon={<ShieldAlert />}
        value={stats.totalActiveKnowledgeSets.toLocaleString()}
        label="Active knowledge sets"
      />
    </div>
  );
}
