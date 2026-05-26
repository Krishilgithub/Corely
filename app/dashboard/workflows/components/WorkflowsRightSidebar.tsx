"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  Filter,
} from "lucide-react";

export default function WorkflowsRightSidebar() {
  return (
    <div style={{ flexShrink: 0 }}>
      {/* Workflow Activity */}
      <motion.div
        className="wf-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="set-card-header" style={{ display: "flex", justifyContent: "space-between" }}>
          Workflow Activity
          <Link href="#" className="src-card-view-all">View all</Link>
        </div>
        
        <div className="wf-activity-list">
          <div className="wf-activity-item">
            <div className="wf-activity-icon" style={{ color: "#16a34a" }}>
              <PlayCircle size={16} />
            </div>
            <div className="wf-activity-content">
              <div>
                <div className="wf-activity-title">Daily Executive Digest</div>
                <div className="wf-activity-desc">Executed successfully</div>
              </div>
              <div className="wf-activity-time">2 min ago</div>
            </div>
          </div>
          <div className="wf-activity-item">
            <div className="wf-activity-icon" style={{ color: "#16a34a" }}>
              <PlayCircle size={16} />
            </div>
            <div className="wf-activity-content">
              <div>
                <div className="wf-activity-title">CRM Update Assistant</div>
                <div className="wf-activity-desc">Executed successfully</div>
              </div>
              <div className="wf-activity-time">7 min ago</div>
            </div>
          </div>
          <div className="wf-activity-item">
            <div className="wf-activity-icon" style={{ color: "#d97706" }}>
              <PauseCircle size={16} />
            </div>
            <div className="wf-activity-content">
              <div>
                <div className="wf-activity-title">Meeting Summary Automation</div>
                <div className="wf-activity-desc">Running</div>
              </div>
              <div className="wf-activity-time">12 min ago</div>
            </div>
          </div>
          <div className="wf-activity-item">
            <div className="wf-activity-icon" style={{ color: "#ef4444" }}>
              <XCircle size={16} />
            </div>
            <div className="wf-activity-content">
              <div>
                <div className="wf-activity-title">Support Ticket Triage</div>
                <div className="wf-activity-desc">Failed</div>
              </div>
              <div className="wf-activity-time">18 min ago</div>
            </div>
          </div>
          <div className="wf-activity-item">
            <div className="wf-activity-icon" style={{ color: "#16a34a" }}>
              <CheckCircle2 size={16} />
            </div>
            <div className="wf-activity-content">
              <div>
                <div className="wf-activity-title">Sales Opportunity Alerts</div>
                <div className="wf-activity-desc">Executed successfully</div>
              </div>
              <div className="wf-activity-time">32 min ago</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Workflow Templates */}
      <motion.div
        className="wf-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="set-card-header" style={{ display: "flex", justifyContent: "space-between" }}>
          Workflow Templates
          <Link href="#" className="src-card-view-all">View all</Link>
        </div>
        <div style={{ fontSize: 12.5, color: "#71717a", marginBottom: 20 }}>
          Start from a template and save time.
        </div>

        <div className="wf-template-list">
          <div className="wf-template-item">
            <div className="wf-template-left">
              <div className="wf-template-icon" style={{ background: "#eff6ff", color: "#3b82f6" }}>
                <Calendar size={18} />
              </div>
              <div>
                <div className="wf-template-title">Weekly Team Update</div>
                <div className="wf-template-desc">Summarize progress and send to Slack</div>
              </div>
            </div>
            <button className="wf-btn-use">Use</button>
          </div>
          
          <div className="wf-template-item">
            <div className="wf-template-left">
              <div className="wf-template-icon" style={{ background: "#ecfdf5", color: "#10b981" }}>
                <Users size={18} />
              </div>
              <div>
                <div className="wf-template-title">Customer Onboarding</div>
                <div className="wf-template-desc">Automate onboarding for new customers</div>
              </div>
            </div>
            <button className="wf-btn-use">Use</button>
          </div>

          <div className="wf-template-item">
            <div className="wf-template-left">
              <div className="wf-template-icon" style={{ background: "#fff7ed", color: "#f97316" }}>
                <FileText size={18} />
              </div>
              <div>
                <div className="wf-template-title">Invoice Processing</div>
                <div className="wf-template-desc">Extract, validate and record invoices</div>
              </div>
            </div>
            <button className="wf-btn-use">Use</button>
          </div>

          <div className="wf-template-item">
            <div className="wf-template-left">
              <div className="wf-template-icon" style={{ background: "#f5f3ff", color: "#8b5cf6" }}>
                <CheckCircle size={18} />
              </div>
              <div>
                <div className="wf-template-title">Content Approval Flow</div>
                <div className="wf-template-desc">Review and approve content submissions</div>
              </div>
            </div>
            <button className="wf-btn-use">Use</button>
          </div>

          <div className="wf-template-item">
            <div className="wf-template-left">
              <div className="wf-template-icon" style={{ background: "#f0fdf4", color: "#22c55e" }}>
                <Filter size={18} />
              </div>
              <div>
                <div className="wf-template-title">Lead Qualification</div>
                <div className="wf-template-desc">Score and route new leads automatically</div>
              </div>
            </div>
            <button className="wf-btn-use">Use</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
