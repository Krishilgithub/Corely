"use client";

import { motion } from "framer-motion";
import {
  ChevronRight,
  TrendingDown,
  Code2,
  DollarSign,
  Users,
  CheckCircle2,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}
import * as React from "react";

const iconMap: Record<string, LucideIcon> = {
  TrendingDown,
  Code2,
  DollarSign,
  Users,
};

const iconConfigMap: Record<string, { bg: string; color: string }> = {
  TrendingDown: { bg: "#fef2f2", color: "#ef4444" },
  Code2: { bg: "#f0f9ff", color: "#0ea5e9" },
  DollarSign: { bg: "#fffbeb", color: "#d97706" },
  Users: { bg: "#f0fdf4", color: "#16a34a" },
};

interface Insight {
  id: string;
  iconType: string;
  priority: string;
  title: string;
  description: string;
  source: string;
  createdAt: string;
}

export default function InsightsPanel({ data, systemHealth }: { data?: Insight[], systemHealth?: string }) {
  const insights = data || [];
  const loading = !data;

  return (
    <motion.div
      className="db-panel"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35, duration: 0.45, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="db-panel-header">
        <span className="db-panel-title">Insights</span>
        <Link
          href="/dashboard/insights"
          style={{
            fontSize: "12.5px",
            fontWeight: 600,
            color: "#ff6b00",
            textDecoration: "none",
          }}
        >
          View all
        </Link>
      </div>

      {/* Insights List */}
      <div className="db-panel-body">
        {loading ? (
          <div style={{ padding: "20px", fontSize: "13px", color: "#71717a" }}>Loading insights...</div>
        ) : insights.length === 0 ? (
          <div style={{ padding: "20px", fontSize: "13px", color: "#71717a" }}>No insights found.</div>
        ) : (
          insights.map((ins, i) => {
            const Icon = iconMap[ins.iconType] || TrendingDown;
            const config = iconConfigMap[ins.iconType] || { bg: "#fef2f2", color: "#ef4444" };
            return (
              <motion.div
                key={ins.id || i}
                className="db-insight-card"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.07, duration: 0.3 }}
              >
                <div
                  className="db-insight-icon"
                  style={{ backgroundColor: config.bg }}
                >
                  <Icon size={15} color={config.color} strokeWidth={2.2} />
                </div>
                <div className="db-insight-body">
                  <span
                    className={`db-priority db-priority-${ins.priority === "HIGH" ? "high" : ins.priority === "MEDIUM" ? "medium" : "low"}`}
                  >
                    {ins.priority}
                  </span>
                  <div className="db-insight-title">{ins.title}</div>
                  <div className="db-insight-desc">{ins.description}</div>
                  <div className="db-insight-meta">
                    <span>{ins.source}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(ins.createdAt)}</span>
                  </div>
                </div>
                <ChevronRight
                  size={13}
                  style={{ color: "#d4d4d4", flexShrink: 0, alignSelf: "flex-start", marginTop: 2 }}
                />
              </motion.div>
            );
          })
        )}
      </div>

      {/* System Status */}
      <div className="db-system-status">
        <div className="db-status-title">System Status</div>
        <div className="db-status-row">
          <CheckCircle2 size={13} style={{ color: systemHealth === "Operational" ? "#16a34a" : "#ef4444" }} />
          <span style={{ color: systemHealth === "Operational" ? "#16a34a" : "#ef4444", fontSize: "13px" }}>
            {systemHealth === "Operational" ? "All systems operational" : "System degraded"}
          </span>
        </div>
        <div className="db-status-row">
          <RefreshCw size={12} style={{ color: "#a1a1aa" }} />
          <span style={{ color: "#71717a", fontSize: "12px" }}>Data synced just now</span>
        </div>
      </div>
    </motion.div>
  );
}
