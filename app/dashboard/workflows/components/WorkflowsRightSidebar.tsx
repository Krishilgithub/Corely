"use client";

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
// Activity icons carry status, so they use the status colours.
const getActivityIcon = (status: ActivityItem["status"], size = 16) => {
  switch (status) {
    case "success":
      return <CheckCircle2 size={size} style={{ color: "var(--success)" }} />;
    case "running":
      return <PauseCircle size={size} style={{ color: "var(--warning)" }} />;
    case "failed":
      return <XCircle size={size} style={{ color: "var(--error)" }} />;
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

// bg / col are saved with the new workflow as data. The UI shows neutral tiles.
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
    <div className="wf-sidebar">

      {/* ── 1. Workflow Activity ── */}
      <div className="ui-card wf-sidebar-card">
        <div className="wf-side-header">
          <span className="type-heading">Workflow activity</span>
          <Link href="#" className="wf-side-link">
            View all
          </Link>
        </div>

        <div className="wf-activity-list">
          {activityLogs.length === 0 ? (
            <div className="wf-activity-empty">
              No execution activities logged yet.
            </div>
          ) : (
            activityLogs.map((log) => (
              <div key={log.id} className="wf-activity-item">
                <div className="wf-activity-icon">
                  {getActivityIcon(log.status, 16)}
                </div>
                <div className="wf-activity-content">
                  <div style={{ minWidth: 0 }}>
                    <div className="wf-activity-title">{log.workflowTitle}</div>
                    <div className="type-caption">
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
      </div>

      {/* ── 2. Workflow Templates ── */}
      <div className="ui-card wf-sidebar-card">
        <div className="wf-side-header">
          <span className="type-heading">Workflow templates</span>
          <Link href="#" className="wf-side-link">
            View all
          </Link>
        </div>
        <div className="type-caption wf-template-intro">
          Start from a template and save time.
        </div>

        <div className="wf-template-list">
          {TEMPLATES.map((tpl, i) => (
            <div key={i} className="wf-template-item">
              <div className="wf-template-left">
                <div className="wf-icon-box">
                  {getTemplateIcon(tpl.icon, 18)}
                </div>
                <div>
                  <div className="wf-template-title">{tpl.title}</div>
                  <div className="type-caption">{tpl.desc}</div>
                </div>
              </div>
              <button
                className="ui-btn ui-btn--secondary ui-btn--sm"
                onClick={() => onUseTemplate(tpl.title, tpl.desc, tpl.icon, tpl.bg, tpl.col)}
              >
                Use
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
