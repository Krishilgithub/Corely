"use client";

import { motion } from "framer-motion";
import {
  GitBranch,
  Upload,
  Plus,
  PlayCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Mail,
  Video,
  Cloud,
  Headphones,
  DollarSign,
  Users,
  LineChart,
  FileText,
  Zap,
} from "lucide-react";

const tableData = [
  { 
    icon: Mail, iconBg: "#eff6ff", iconCol: "#3b82f6", 
    title: "Daily Executive Digest", desc: "Sends AI-powered daily summary to executives",
    triggerIcon: Clock, triggerType: "Schedule", triggerDesc: "Daily at 8:00 AM",
    lastRun: "May 12, 2025", lastRunTime: "8:01 AM",
    executions: "312", status: "Active", owner: "JD", ownerBg: "#c2410c"
  },
  { 
    icon: Video, iconBg: "#f3e8ff", iconCol: "#9333ea", 
    title: "Meeting Summary Automation", desc: "Generate summaries and action items",
    triggerIcon: Zap, triggerType: "Event", triggerDesc: "Meeting Ended",
    lastRun: "May 12, 2025", lastRunTime: "7:43 AM",
    executions: "245", status: "Active", owner: "KS", ownerBg: "#0ea5e9"
  },
  { 
    icon: Cloud, iconBg: "#dcfce7", iconCol: "#16a34a", 
    title: "CRM Update Assistant", desc: "Auto-enrich and update CRM records",
    triggerIcon: Zap, triggerType: "Event", triggerDesc: "New Email",
    lastRun: "May 12, 2025", lastRunTime: "7:21 AM",
    executions: "389", status: "Active", owner: "AM", ownerBg: "#db2777"
  },
  { 
    icon: Headphones, iconBg: "#ffedd5", iconCol: "#ea580c", 
    title: "Support Ticket Triage", desc: "Categorize and route support tickets",
    triggerIcon: Zap, triggerType: "Event", triggerDesc: "New Ticket",
    lastRun: "May 12, 2025", lastRunTime: "6:58 AM",
    executions: "178", status: "Active", owner: "TR", ownerBg: "#4f46e5"
  },
  { 
    icon: DollarSign, iconBg: "#fee2e2", iconCol: "#ef4444", 
    title: "Sales Opportunity Alerts", desc: "Notify team about high-value opportunities",
    triggerIcon: LayoutGrid, triggerType: "Condition", triggerDesc: "Deal > $50K",
    lastRun: "May 12, 2025", lastRunTime: "6:34 AM",
    executions: "96", status: "Active", owner: "JD", ownerBg: "#c2410c"
  },
  { 
    icon: Users, iconBg: "#f3e8ff", iconCol: "#9333ea", 
    title: "HR Onboarding Flow", desc: "Automate new hire onboarding process",
    triggerIcon: Zap, triggerType: "Event", triggerDesc: "New Employee",
    lastRun: "May 11, 2025", lastRunTime: "5:12 PM",
    executions: "24", status: "Active", owner: "KS", ownerBg: "#0ea5e9"
  },
  { 
    icon: LineChart, iconBg: "#ffedd5", iconCol: "#ea580c", 
    title: "Product Feedback Analysis", desc: "Analyze and summarize product feedback",
    triggerIcon: Clock, triggerType: "Schedule", triggerDesc: "Daily at 10:00 AM",
    lastRun: "May 11, 2025", lastRunTime: "10:01 AM",
    executions: "156", status: "Draft", owner: "AM", ownerBg: "#db2777"
  },
  { 
    icon: FileText, iconBg: "#fee2e2", iconCol: "#ef4444", 
    title: "Expense Report Review", desc: "Review and approve expense reports",
    triggerIcon: Zap, triggerType: "Event", triggerDesc: "Report Submitted",
    lastRun: "—", lastRunTime: "",
    executions: "0", status: "Draft", owner: "TR", ownerBg: "#4f46e5"
  },
];

export default function WorkflowsMain() {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Header */}
      <motion.div
        className="wf-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <div className="wf-title-wrap">
            <GitBranch size={28} style={{ color: "#ff6b00" }} />
            <h1 className="wf-title">Workflows</h1>
          </div>
          <p className="wf-subtitle">Automate repetitive work and orchestrate intelligent actions across your organization.</p>
        </div>
        <div className="src-header-actions">
          <button className="src-btn-secondary">
            <Upload size={14} /> Import Workflow
          </button>
          <button className="src-btn-primary">
            <Plus size={16} strokeWidth={2.5} /> New Workflow
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        className="wf-kpi-grid"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="wf-kpi-card">
          <div className="wf-kpi-icon-wrap" style={{ borderColor: "#ffedd5" }}>
            <div className="wf-kpi-icon-inner" style={{ background: "#fffaf5" }}>
              <GitBranch size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="wf-kpi-val">24</div>
            <div className="wf-kpi-label">Active Workflows</div>
            <div className="wf-kpi-trend src-trend-good">
              <ArrowUpRightIcon size={12} strokeWidth={3} /> 4 vs last month
            </div>
          </div>
        </div>
        <div className="wf-kpi-card">
          <div className="wf-kpi-icon-wrap" style={{ borderColor: "#ffedd5" }}>
            <div className="wf-kpi-icon-inner" style={{ background: "#fffaf5" }}>
              <PlayCircle size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="wf-kpi-val">7</div>
            <div className="wf-kpi-label">Running Now</div>
            <div className="wf-kpi-trend src-trend-good">
              <ArrowUpRightIcon size={12} strokeWidth={3} /> Live executions
            </div>
          </div>
        </div>
        <div className="wf-kpi-card">
          <div className="wf-kpi-icon-wrap" style={{ borderColor: "#ffedd5" }}>
            <div className="wf-kpi-icon-inner" style={{ background: "#fffaf5" }}>
              <CheckCircle2 size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="wf-kpi-val">1,842</div>
            <div className="wf-kpi-label">Executions (This Month)</div>
            <div className="wf-kpi-trend src-trend-good">
              <ArrowUpRightIcon size={12} strokeWidth={3} /> +23% vs last month
            </div>
          </div>
        </div>
        <div className="wf-kpi-card">
          <div className="wf-kpi-icon-wrap" style={{ borderColor: "#ffedd5" }}>
            <div className="wf-kpi-icon-inner" style={{ background: "#fffaf5" }}>
              <Clock size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="wf-kpi-val">128</div>
            <div className="wf-kpi-label">Hours Saved</div>
            <div className="wf-kpi-trend src-trend-good">
              <ArrowUpRightIcon size={12} strokeWidth={3} /> +18% vs last month
            </div>
          </div>
        </div>
      </motion.div>

      {/* Table Section */}
      <motion.div
        className="wf-table-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="wf-table-header">
          <div className="wf-tabs">
            <div className="wf-tab active">All Workflows</div>
            <div className="wf-tab">Active</div>
            <div className="wf-tab">Draft</div>
            <div className="wf-tab">Scheduled</div>
            <div className="wf-tab">Inactive</div>
          </div>
          <div className="wf-table-actions">
            <div className="src-search">
              <Search size={14} style={{ color: "#71717a" }} />
              <input type="text" className="src-search-input" placeholder="Search workflows..." />
            </div>
            <button className="src-filter-btn">
              <Filter size={14} /> Filter
            </button>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="src-list-btn">
                <LayoutGrid size={14} />
              </button>
              <button className="src-list-btn" style={{ background: "#fff3ee", borderColor: "#ffedd5", color: "#ff6b00" }}>
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        <table className="wf-table">
          <thead>
            <tr>
              <th className="wf-th">Workflow</th>
              <th className="wf-th">Trigger</th>
              <th className="wf-th">Last Run</th>
              <th className="wf-th">Executions</th>
              <th className="wf-th">Status</th>
              <th className="wf-th" style={{ textAlign: "center" }}>Owner</th>
              <th className="wf-th" />
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={i} className="wf-tr">
                <td className="wf-td">
                  <div className="wf-cell-flex">
                    <div className="wf-icon-box" style={{ background: row.iconBg }}>
                      <row.icon size={16} style={{ color: row.iconCol }} />
                    </div>
                    <div>
                      <div className="wf-cell-title">{row.title}</div>
                      <div className="wf-cell-desc">{row.desc}</div>
                    </div>
                  </div>
                </td>
                <td className="wf-td">
                  <div className="wf-trigger-icon">
                    <row.triggerIcon size={14} /> {row.triggerType}
                  </div>
                  <div className="wf-cell-desc">{row.triggerDesc}</div>
                </td>
                <td className="wf-td">
                  <div className="src-sync-time">{row.lastRun}</div>
                  <div className="src-sync-date">{row.lastRunTime}</div>
                </td>
                <td className="wf-td" style={{ fontSize: 12.5, fontWeight: 600, color: "#111111" }}>
                  {row.executions}
                </td>
                <td className="wf-td">
                  <div className={`wf-status-badge ${row.status === "Active" ? "wf-status-active" : "wf-status-draft"}`}>
                    <div className="wf-status-dot" /> {row.status}
                  </div>
                </td>
                <td className="wf-td" align="center">
                  <div className="wf-avatar" style={{ background: row.ownerBg }}>
                    {row.owner}
                  </div>
                </td>
                <td className="wf-td" align="right">
                  <div className="src-action-cell">
                    <MoreHorizontal size={16} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Bottom Banner */}
      <motion.div
        className="wf-banner"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div>
          <div className="wf-banner-title">Build Smarter Workflows with Corely</div>
          <div className="wf-banner-desc">Use triggers, conditions, and actions to automate any process.</div>
          <a href="#" className="wf-banner-link">
            Learn more <ArrowUpRightIcon size={14} strokeWidth={3} />
          </a>
        </div>
        <div className="wf-banner-flow">
          <div className="wf-flow-step">
            <div className="wf-flow-icon">
              <Zap size={18} style={{ color: "#ff6b00" }} fill="#ff6b00" />
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="wf-flow-title">1. Trigger</div>
              <div className="wf-flow-desc">Choose an event</div>
            </div>
          </div>
          <div className="wf-flow-arrow">--&gt;</div>
          <div className="wf-flow-step">
            <div className="wf-flow-icon">
              <LayoutGrid size={18} style={{ color: "#9333ea" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="wf-flow-title">2. Condition</div>
              <div className="wf-flow-desc">Set rules</div>
            </div>
          </div>
          <div className="wf-flow-arrow">--&gt;</div>
          <div className="wf-flow-step">
            <div className="wf-flow-icon">
              <PlayCircle size={18} style={{ color: "#3b82f6" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="wf-flow-title">3. Action</div>
              <div className="wf-flow-desc">Define what happens</div>
            </div>
          </div>
          <div className="wf-flow-arrow">--&gt;</div>
          <div className="wf-flow-step">
            <div className="wf-flow-icon">
              <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="wf-flow-title">4. Outcome</div>
              <div className="wf-flow-desc">Get results</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Inline custom icon for arrow up right
function ArrowUpRightIcon({ size = 24, strokeWidth = 2, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17l9.2-9.2M17 17V7H7" />
    </svg>
  );
}
