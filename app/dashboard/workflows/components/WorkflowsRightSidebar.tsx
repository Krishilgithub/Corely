"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  PauseCircle,
  Calendar,
  Users,
  FileText,
  Filter
} from "lucide-react";
import { ActivityItem } from "./WorkflowsLayout";
import { formatDistanceToNow } from "date-fns";

// ── Icons Helper ─────────────────────────────────────────────────────────────
const getActivityIcon = (status: ActivityItem["status"], size = 16) => {
  switch (status) {
    case "success":
      return <CheckCircle2 size={size} style={{ color: "#16a34a" }} />;
    case "running":
      return <PauseCircle size={size} style={{ color: "#d97706" }} />;
    case "failed":
      return <XCircle size={size} style={{ color: "#ef4444" }} />;
  }
};

const getTemplateIcon = (name: string, size = 18) => {
  switch (name) {
    case "Calendar": return <Calendar size={size} />;
    case "Users": return <Users size={size} />;
    case "FileText": return <FileText size={size} />;
    case "CheckCircle2": return <CheckCircle2 size={size} />;
    case "Filter": return <Filter size={size} />;
    default: return <Calendar size={size} />;
  }
};

interface WorkflowsRightSidebarProps {
  activityLogs: ActivityItem[];
  onUseTemplate: (title: string, desc: string, icon: string, bg: string, col: string) => void;
}

const TEMPLATES = [
  {
    title: "Weekly Team Update",
    desc: "Summarize progress and send to Slack",
    icon: "Calendar",
    bg: "#eff6ff",
    col: "#3b82f6"
  },
  {
    title: "Customer Onboarding",
    desc: "Automate onboarding for new customers",
    icon: "Users",
    bg: "#ecfdf5",
    col: "#10b981"
  },
  {
    title: "Invoice Processing",
    desc: "Extract, validate and record invoices",
    icon: "FileText",
    bg: "#fff7ed",
    col: "#f97316"
  },
  {
    title: "Content Approval Flow",
    desc: "Review and approve content submissions",
    icon: "CheckCircle2",
    bg: "#f5f3ff",
    col: "#8b5cf6"
  },
  {
    title: "Lead Qualification",
    desc: "Score and route new leads automatically",
    icon: "Filter",
    bg: "#f0fdf4",
    col: "#22c55e"
  }
];

export default function WorkflowsRightSidebar({
  activityLogs,
  onUseTemplate
}: WorkflowsRightSidebarProps) {
  return (
    <div style={{ flexShrink: 0, width: 340, display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* ── 1. Workflow Activity ── */}
      <motion.div
        className="wf-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="set-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", fontWeight: 800, fontSize: "14px", color: "#111" }}>
          <span>Workflow Activity</span>
          <Link href="#" className="src-card-view-all" style={{ fontSize: "11px", fontWeight: 700, color: "#ff6b00", textDecoration: "none" }}>
            View all
          </Link>
        </div>
        
        <div className="wf-activity-list" style={{ display: "flex", flexDirection: "column" }}>
          {activityLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", fontSize: "12px", color: "#71717a" }}>
              No execution activities logged yet.
            </div>
          ) : (
            activityLogs.map((log) => (
              <div key={log.id} className="wf-activity-item">
                <div className="wf-activity-icon">
                  {getActivityIcon(log.status, 16)}
                </div>
                <div className="wf-activity-content">
                  <div>
                    <div className="wf-activity-title">{log.workflowTitle}</div>
                    <div className="wf-activity-desc" style={{ textTransform: "capitalize" }}>
                      {log.status === "success" ? "Executed successfully" : log.status === "running" ? "Running" : "Failed"}
                    </div>
                  </div>
                  <div className="wf-activity-time">
                    {log.timestamp
                      ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })
                      : "Just now"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* ── 2. Workflow Templates ── */}
      <motion.div
        className="wf-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="set-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontWeight: 800, fontSize: "14px", color: "#11" }}>
          <span>Workflow Templates</span>
          <Link href="#" className="src-card-view-all" style={{ fontSize: "11px", fontWeight: 700, color: "#ff6b00", textDecoration: "none" }}>
            View all
          </Link>
        </div>
        <div style={{ fontSize: "12px", color: "#71717a", marginBottom: "20px", fontWeight: 500 }}>
          Start from a template and save time.
        </div>

        <div className="wf-template-list">
          {TEMPLATES.map((tpl, i) => (
            <div key={i} className="wf-template-item">
              <div className="wf-template-left">
                <div className="wf-template-icon" style={{ background: tpl.bg, color: tpl.col }}>
                  {getTemplateIcon(tpl.icon, 18)}
                </div>
                <div>
                  <div className="wf-template-title">{tpl.title}</div>
                  <div className="wf-template-desc">{tpl.desc}</div>
                </div>
              </div>
              <button
                className="wf-btn-use"
                onClick={() => onUseTemplate(tpl.title, tpl.desc, tpl.icon, tpl.bg, tpl.col)}
              >
                Use
              </button>
            </div>
          ))}
        </div>
      </motion.div>
      
    </div>
  );
}
