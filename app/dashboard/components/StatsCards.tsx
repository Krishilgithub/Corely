"use client";

import { Brain, Zap, PieChart, ShieldAlert, ChevronRight, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface StatCard {
  icon: LucideIcon;
  value: number;
  suffix?: string;
  label: string;
  trend: string;
  delay: number;
  href?: string;
}

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const steps = 30;
    const increment = target / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCurrent(Math.min(Math.round(increment * step), target));
      if (step >= steps) clearInterval(timer);
    }, 900 / steps);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <>
      {current}
      {suffix}
    </>
  );
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function StatsCards({ data }: { data?: any }) {
  const [statsData, setStatsData] = useState<StatCard[]>([]);

  useEffect(() => {
    if (data) {
      setStatsData([
        { icon: Brain, value: data.documentsIndexed, label: "Total Indexed Documents", trend: "↑ Increasing", delay: 0.05, href: "/dashboard/memory" },
        { icon: Zap, value: data.recentChats, label: "Recent Interactions", trend: "↑ Activity", delay: 0.1, href: "/dashboard/ask-corely" },
        { icon: PieChart, value: data.coverage, suffix: "%", label: "Knowledge Coverage", trend: "↑ Growing", delay: 0.15, href: "/dashboard/insights" },
        { icon: ShieldAlert, value: data.sourcesConnected, label: "Connected Sources", trend: "Active Syncs", delay: 0.2, href: "/dashboard/sources" },
      ]);
    }
  }, [data]);

  if (!data || statsData.length === 0) {
    // Neutral placeholder tiles while the numbers load.
    return (
      <div className="db-stats-grid" role="status" aria-busy="true" aria-label="Loading stats...">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="ui-skeleton db-stat-skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="db-stats-grid">
      {statsData.map((stat, i) => (
        <Link href={stat.href || "#"} key={stat.label} className="ui-kpi db-stat-card">
          <div className="db-stat-top">
            {/* The first tile (indexed documents) is the main stat, so it gets the orange well. */}
            <span className={i === 0 ? "ui-icon-well ui-icon-well--accent" : "ui-icon-well"} aria-hidden="true">
              <stat.icon strokeWidth={2} />
            </span>
            <ChevronRight size={16} className="db-stat-chevron" aria-hidden="true" />
          </div>
          <div className="db-stat-bottom">
            <div className="db-stat-value-row">
              <span className="type-metric">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </span>
              {/* The trend text is a fixed label, not a measured change, so it stays neutral. */}
              <span className="type-caption">{stat.trend}</span>
            </div>
            <span className="db-stat-label">{stat.label}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
