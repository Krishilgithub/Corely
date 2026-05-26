"use client";

import { motion } from "framer-motion";
import { Building2, Sparkles, Bell, ChevronDown, Command } from "lucide-react";

export default function Topbar() {
  return (
    <motion.header
      className="db-topbar"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Workspace Switcher */}
      <button className="db-ws-btn" aria-label="Switch workspace">
        <Building2 size={13} style={{ color: "#71717a" }} />
        <span>Corely Enterprise</span>
        <ChevronDown size={12} style={{ color: "#a1a1aa" }} />
      </button>

      {/* AI Search */}
      <div className="db-search-bar" role="search">
        <div className="db-search-inner">
          <Sparkles size={14} style={{ color: "#ff6b00", flexShrink: 0 }} />
          <span className="db-search-text">Ask anything about your company...</span>
        </div>
        <div className="db-search-kbd">
          <Command size={9} />
          <span>K</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="db-topbar-right">
        {/* Notifications */}
        <button className="db-notif-btn" aria-label="Notifications">
          <Bell size={15} />
          <span className="db-notif-badge" aria-label="3 notifications">3</span>
        </button>

        {/* AI Status Pill */}
        <div className="db-ai-pill">
          <div className="db-ai-pulse">
            <div className="db-ai-pulse-ring" />
            <div className="db-ai-pulse-dot" />
          </div>
          <div>
            <div className="db-ai-label">Corely AI</div>
            <div className="db-ai-status-text">Active</div>
          </div>
        </div>

        {/* Avatar */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ff6b00, #ff9240)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 900,
            color: "#fff",
            cursor: "pointer",
            border: "1.5px solid #ebebeb",
          }}
          aria-label="User profile"
        >
          K
        </div>
      </div>
    </motion.header>
  );
}
