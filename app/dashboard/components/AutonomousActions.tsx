"use client";

import { motion } from "framer-motion";
import { Cloud, GitBranch, Mail, Cpu } from "lucide-react";

const actions = [
  {
    time: "9:07 AM",
    desc: "Updated CRM records",
    source: "Salesforce",
    iconBg: "#e0f2fe",
    icon: <Cloud size={18} color="#0ea5e9" strokeWidth={2} />,
  },
  {
    time: "8:52 AM",
    desc: "Triggered follow-up workflow",
    source: "Corely Workflow",
    iconBg: "#fff3ee",
    icon: <GitBranch size={18} color="#ff6b00" strokeWidth={2} />,
  },
  {
    time: "8:45 AM",
    desc: "Created executive digest",
    source: "Email",
    iconBg: "#fef2f2",
    icon: <Mail size={18} color="#ef4444" strokeWidth={2} />,
  },
  {
    time: "8:31 AM",
    desc: "Ran risk analysis pipeline",
    source: "Corely AI",
    iconBg: "#f0fdf4",
    icon: <Cpu size={18} color="#16a34a" strokeWidth={2} />,
  },
];

export default function AutonomousActions() {
  return (
    <motion.div
      className="db-actions-section"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="db-actions-header">
        <span style={{ fontSize: "14px", fontWeight: 700, color: "#111111" }}>
          Autonomous Actions
        </span>
        <a
          href="#"
          style={{
            fontSize: "12.5px",
            fontWeight: 600,
            color: "#ff6b00",
            textDecoration: "none",
          }}
        >
          View all actions
        </a>
      </div>

      {/* Actions Grid */}
      <div className="db-actions-grid">
        {actions.map((action, i) => (
          <motion.div
            key={i}
            className="db-action-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.07, duration: 0.3 }}
          >
            <div
              className="db-action-icon"
              style={{ backgroundColor: action.iconBg }}
            >
              {action.icon}
            </div>
            <div>
              <div className="db-action-time">{action.time}</div>
              <div className="db-action-desc">{action.desc}</div>
              <div className="db-action-footer">
                <span>{action.source}</span>
                <span style={{ color: "#d4d4d4" }}>•</span>
                <span className="db-action-completed">Completed</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
