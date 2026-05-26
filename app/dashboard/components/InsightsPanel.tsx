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
} from "lucide-react";

const insights = [
  {
    icon: TrendingDown,
    iconBg: "#fef2f2",
    iconColor: "#ef4444",
    priority: "HIGH",
    title: "Customer churn risk increased",
    desc: "Churn risk has increased by 18% in the last 7 days driven by 3 key accounts.",
    source: "Salesforce",
    time: "2 min ago",
  },
  {
    icon: Code2,
    iconBg: "#f0f9ff",
    iconColor: "#0ea5e9",
    priority: "HIGH",
    title: "Engineering bottleneck detected",
    desc: "API team is a blocking dependency for 12 projects.",
    source: "Jira",
    time: "15 min ago",
  },
  {
    icon: DollarSign,
    iconBg: "#fffbeb",
    iconColor: "#d97706",
    priority: "MEDIUM",
    title: "Revenue anomaly identified",
    desc: "Mid-market segment revenue dropped by 7% this week.",
    source: "Looker",
    time: "34 min ago",
  },
  {
    icon: Users,
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
    priority: "LOW",
    title: "Cross-team dependency alert",
    desc: "Design handoff delay affecting product launch timeline.",
    source: "Notion",
    time: "1 hr ago",
  },
];

export default function InsightsPanel() {
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
        <a
          href="#"
          style={{
            fontSize: "12.5px",
            fontWeight: 600,
            color: "#ff6b00",
            textDecoration: "none",
          }}
        >
          View all
        </a>
      </div>

      {/* Insights List */}
      <div className="db-panel-body">
        {insights.map((ins, i) => (
          <motion.div
            key={i}
            className="db-insight-card"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 + i * 0.07, duration: 0.3 }}
          >
            <div
              className="db-insight-icon"
              style={{ backgroundColor: ins.iconBg }}
            >
              <ins.icon size={15} color={ins.iconColor} strokeWidth={2.2} />
            </div>
            <div className="db-insight-body">
              <span
                className={`db-priority db-priority-${ins.priority === "HIGH" ? "high" : ins.priority === "MEDIUM" ? "medium" : "low"}`}
              >
                {ins.priority}
              </span>
              <div className="db-insight-title">{ins.title}</div>
              <div className="db-insight-desc">{ins.desc}</div>
              <div className="db-insight-meta">
                <span>{ins.source}</span>
                <span>•</span>
                <span>{ins.time}</span>
              </div>
            </div>
            <ChevronRight
              size={13}
              style={{ color: "#d4d4d4", flexShrink: 0, alignSelf: "flex-start", marginTop: 2 }}
            />
          </motion.div>
        ))}
      </div>

      {/* System Status */}
      <div className="db-system-status">
        <div className="db-status-title">System Status</div>
        <div className="db-status-row">
          <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
          <span style={{ color: "#22c55e", fontSize: "13px" }}>All systems operational</span>
        </div>
        <div className="db-status-row">
          <RefreshCw size={12} style={{ color: "#a1a1aa" }} />
          <span style={{ color: "#71717a", fontSize: "12px" }}>Data synced 2 min ago</span>
        </div>
      </div>
    </motion.div>
  );
}
