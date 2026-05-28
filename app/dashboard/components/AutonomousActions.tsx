"use client";

import { motion } from "framer-motion";
import { Cloud, GitBranch, Mail, Cpu, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import * as React from "react";

const iconMap: Record<string, LucideIcon> = {
  Cloud,
  GitBranch,
  Mail,
  Cpu,
};

const iconConfigMap: Record<string, { bg: string; color: string }> = {
  Cloud: { bg: "#e0f2fe", color: "#0ea5e9" },
  GitBranch: { bg: "#fff3ee", color: "#ff6b00" },
  Mail: { bg: "#fef2f2", color: "#ef4444" },
  Cpu: { bg: "#f0fdf4", color: "#16a34a" },
};

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface Action {
  id: string;
  iconType: string;
  createdAt: string;
  description: string;
  source: string;
}

export default function AutonomousActions() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setActions(data.actions || []);
        }
      } catch (error) {
        console.error("Failed to fetch actions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActions();
  }, []);

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
        {loading ? (
          <div style={{ padding: "20px", fontSize: "13px", color: "#71717a" }}>Loading actions...</div>
        ) : actions.length === 0 ? (
          <div style={{ padding: "20px", fontSize: "13px", color: "#71717a" }}>No actions found.</div>
        ) : (
          actions.map((action, i) => {
            const Icon = iconMap[action.iconType] || Cloud;
            const config = iconConfigMap[action.iconType] || { bg: "#e0f2fe", color: "#0ea5e9" };

            return (
              <motion.div
                key={action.id || i}
                className="db-action-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.07, duration: 0.3 }}
              >
                <div
                  className="db-action-icon"
                  style={{ backgroundColor: config.bg }}
                >
                  <Icon size={18} color={config.color} strokeWidth={2} />
                </div>
                <div>
                  <div className="db-action-time">{formatTime(action.createdAt)}</div>
                  <div className="db-action-desc">{action.description}</div>
                  <div className="db-action-footer">
                    <span>{action.source}</span>
                    <span style={{ color: "#d4d4d4" }}>•</span>
                    <span className="db-action-completed">Completed</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
