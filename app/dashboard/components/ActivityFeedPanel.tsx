"use client";

import { motion } from "framer-motion";
import { Activity, MoreHorizontal, X, GitPullRequest, FileText, UserPlus, Database, Search } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "sync",
    title: "Google Drive synced",
    desc: "450 new documents indexed from /Engineering/Specs",
    time: "2m ago",
    icon: Database,
    color: "#10b981",
    bgColor: "#dcfce7",
  },
  {
    id: 2,
    type: "member",
    title: "Sarah Jenkins joined",
    desc: "Added to Workspace 'Product Team'",
    time: "1h ago",
    icon: UserPlus,
    color: "#3b82f6",
    bgColor: "#dbeafe",
  },
  {
    id: 3,
    type: "github",
    title: "New pull request merged",
    desc: "corely/frontend-v2 #492 by @johndoe",
    time: "3h ago",
    icon: GitPullRequest,
    color: "#8b5cf6",
    bgColor: "#f3e8ff",
  },
  {
    id: 4,
    type: "query",
    title: "Trending Query",
    desc: "Multiple users asking about 'Q3 Roadmap'",
    time: "5h ago",
    icon: Search,
    color: "#ff6b00",
    bgColor: "#ffedd5",
  },
  {
    id: 5,
    type: "document",
    title: "High-value document detected",
    desc: "'Q3 OKRs & Strategy.pdf' added to Notion",
    time: "1d ago",
    icon: FileText,
    color: "#f59e0b",
    bgColor: "#fef3c7",
  }
];

export default function ActivityFeedPanel() {
  return (
    <motion.div
      className="db-panel"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25, duration: 0.45, ease: "easeOut" }}
      style={{ display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <div className="db-panel-header">
        <span className="db-panel-title">
          <Activity size={13} style={{ color: "#ff6b00" }} />
          Activity Feed
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="db-panel-icon-btn" aria-label="More options">
            <MoreHorizontal size={14} />
          </button>
          <button className="db-panel-icon-btn" aria-label="Close panel">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Feed Body */}
      <div className="db-panel-body" style={{ padding: "0" }}>
        <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {activities.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              style={{ display: "flex", gap: 14, alignItems: "flex-start", position: "relative" }}
            >
              {/* Connection line if not last */}
              {i < activities.length - 1 && (
                <div style={{ position: "absolute", left: 15.5, top: 32, bottom: -24, width: 1.5, background: "#f4f4f5" }} />
              )}
              
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: activity.bgColor,
                  color: activity.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  zIndex: 1,
                  boxShadow: "0 0 0 4px #fff"
                }}
              >
                <activity.icon size={14} strokeWidth={2.5} />
              </div>
              
              <div style={{ flex: 1, minWidth: 0, marginTop: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--db-text)" }}>{activity.title}</div>
                  <div style={{ fontSize: 11.5, color: "#a1a1aa", flexShrink: 0, marginLeft: 8, fontWeight: 500 }}>{activity.time}</div>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--db-text-muted)", lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {activity.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(0,0,0,0.04)", background: "var(--db-bg)", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, textAlign: "center" }}>
        <button style={{ background: "transparent", border: "none", color: "#ff6b00", fontSize: 12.5, fontWeight: 700, cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
          View Full Activity Log
        </button>
      </div>
    </motion.div>
  );
}
