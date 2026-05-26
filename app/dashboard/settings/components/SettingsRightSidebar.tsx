"use client";

import { motion } from "framer-motion";
import { Building2, CheckCircle2, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

export default function SettingsRightSidebar() {
  return (
    <div style={{ flexShrink: 0 }}>
      {/* Account Card */}
      <motion.div
        className="set-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="set-card-header">Account</div>
        <div className="set-account-info">
          <div className="set-account-avatar">
            <Building2 size={24} />
          </div>
          <div>
            <div className="set-account-name">Corely Enterprise</div>
            <div className="set-account-type">Enterprise Workspace</div>
          </div>
        </div>
        <button className="set-btn-outline">
          Edit Workspace Details
        </button>
      </motion.div>

      {/* Your Plan Card */}
      <motion.div
        className="set-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="set-card-header">Your Plan</div>
        <div className="set-plan-title">Enterprise Plan</div>
        <div className="set-plan-desc">Unlimited insights and advanced capabilities.</div>
        <button className="set-btn-outline">
          Manage Plan
        </button>
      </motion.div>

      {/* Security Overview Card */}
      <motion.div
        className="set-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="set-card-header">Security Overview</div>
        <div className="set-sec-list">
          <div className="set-sec-item">
            <div className="set-sec-left">
              <CheckCircle2 size={16} color="#16a34a" /> SSO
            </div>
            <div className="set-sec-right">Enabled</div>
          </div>
          <div className="set-sec-item">
            <div className="set-sec-left">
              <CheckCircle2 size={16} color="#16a34a" /> Data Encryption
            </div>
            <div className="set-sec-right">AES-256</div>
          </div>
          <div className="set-sec-item">
            <div className="set-sec-left">
              <CheckCircle2 size={16} color="#16a34a" /> Access Control
            </div>
            <div className="set-sec-right">Role-based</div>
          </div>
          <div className="set-sec-item">
            <div className="set-sec-left">
              <CheckCircle2 size={16} color="#16a34a" /> Audit Logs
            </div>
            <div className="set-sec-right">Enabled</div>
          </div>
        </div>
        <Link href="#" className="set-link-btn" style={{ marginTop: 24 }}>
          View all security settings <ArrowRight size={14} />
        </Link>
      </motion.div>

      {/* Need Help Card */}
      <motion.div
        className="set-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        style={{ background: "#fafafa" }}
      >
        <div className="set-card-header">Need Help?</div>
        <div className="set-help-desc">Get help with settings or contact our support team.</div>
        <Link href="#" className="set-btn-outline" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          Visit Help Center <ArrowUpRightIcon size={14} />
        </Link>
      </motion.div>
    </div>
  );
}

function ArrowUpRightIcon({ size = 24, strokeWidth = 2, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17l9.2-9.2M17 17V7H7" />
    </svg>
  );
}
