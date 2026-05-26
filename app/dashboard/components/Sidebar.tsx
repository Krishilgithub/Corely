"use client";

import { motion } from "framer-motion";
import {
  Home,
  MessageSquare,
  Brain,
  BarChart2,
  Zap,
  Link2,
  Users,
  GitBranch,
  Shield,
  Settings,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", active: true },
  { icon: MessageSquare, label: "Ask Corely", active: false },
  { icon: Brain, label: "Memory", active: false },
  { icon: BarChart2, label: "Insights", active: false },
  { icon: Zap, label: "Actions", active: false },
  { icon: Link2, label: "Sources", active: false },
  { icon: Users, label: "Teams", active: false },
  { icon: GitBranch, label: "Workflows", active: false },
  { icon: Shield, label: "Security", active: false },
  { icon: Settings, label: "Settings", active: false },
];

export default function Sidebar() {
  return (
    <aside className="db-sidebar">
      <div className="db-sidebar-inner">
        {/* Top: Logo + Nav */}
        <div>
          <a href="/" className="db-logo-link">
            <div className="db-logo-icon">C</div>
            <span className="db-logo-text">Corely</span>
          </a>

          <nav className="db-nav" aria-label="Dashboard navigation">
            {navItems.map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i, duration: 0.25, ease: "easeOut" }}
                className={`db-nav-item${item.active ? " active" : ""}`}
                aria-current={item.active ? "page" : undefined}
              >
                <item.icon size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
                {item.label}
              </motion.button>
            ))}
          </nav>
        </div>

        {/* Bottom: Plan card + User */}
        <div>
          <motion.div
            className="db-plan-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.35 }}
          >
            <div className="db-plan-tag">Enterprise Plan</div>
            <div className="db-plan-name">Unlimited insights</div>
            <div className="db-plan-row">
              <span>Usage this month</span>
              <span className="db-plan-usage-pct">78%</span>
            </div>
            <div className="db-plan-bar-bg">
              <motion.div
                className="db-plan-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: "78%" }}
                transition={{ delay: 0.7, duration: 1.2, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          <motion.div
            className="db-user-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <div className="db-user-info">
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #ff6b00, #ff9240)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 900,
                  color: "#fff",
                }}
              >
                K
              </div>
              <div>
                <div className="db-user-name">Krishil Shah</div>
                <div className="db-user-role">Admin</div>
              </div>
            </div>
            <ChevronDown size={13} style={{ color: "#a1a1aa", flexShrink: 0 }} />
          </motion.div>
        </div>
      </div>
    </aside>
  );
}
