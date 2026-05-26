"use client";

import { motion } from "framer-motion";
import {
  Users,
  Folder,
  Calendar,
  Database,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function AskRightSidebar() {
  return (
    <div style={{ flexShrink: 0 }}>
      {/* Context Card */}
      <motion.div
        className="ac-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="ac-card-header">
          <div className="ac-card-title">
            Context <span style={{ color: "#71717a", fontWeight: 500 }}>(Auto-detected)</span>
          </div>
          <Link href="#" className="ac-card-view-all">View all</Link>
        </div>

        <div className="ac-card-row">
          <div className="ac-row-left">
            <Users size={15} style={{ color: "#71717a" }} /> People
          </div>
          <div className="ac-row-right">12</div>
        </div>
        <div className="ac-card-row">
          <div className="ac-row-left">
            <Folder size={15} style={{ color: "#71717a" }} /> Projects
          </div>
          <div className="ac-row-right">7</div>
        </div>
        <div className="ac-card-row">
          <div className="ac-row-left">
            <Users size={15} style={{ color: "#71717a" }} /> Teams
          </div>
          <div className="ac-row-right">6</div>
        </div>
        <div className="ac-card-row">
          <div className="ac-row-left">
            <Calendar size={15} style={{ color: "#71717a" }} /> Time Range
          </div>
          <div className="ac-row-right">This Week</div>
        </div>
        <div className="ac-card-row">
          <div className="ac-row-left">
            <Database size={15} style={{ color: "#71717a" }} /> Data Sources
          </div>
          <div className="ac-row-right">9 Connected</div>
        </div>
      </motion.div>

      {/* Suggested Prompts */}
      <motion.div
        className="ac-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="ac-card-header">
          <div className="ac-card-title">Suggested Prompts</div>
        </div>
        <div className="ac-prompt-list">
          <Link href="#" className="ac-prompt-link">
            <span>What are the top priorities for this quarter?</span>
            <ArrowUpRight size={14} style={{ color: "#ff6b00", flexShrink: 0 }} />
          </Link>
          <Link href="#" className="ac-prompt-link">
            <span>Summarize engineering velocity trends</span>
            <ArrowUpRight size={14} style={{ color: "#ff6b00", flexShrink: 0 }} />
          </Link>
          <Link href="#" className="ac-prompt-link">
            <span>Show risks that need executive attention</span>
            <ArrowUpRight size={14} style={{ color: "#ff6b00", flexShrink: 0 }} />
          </Link>
          <Link href="#" className="ac-prompt-link">
            <span>How is our revenue pipeline trending?</span>
            <ArrowUpRight size={14} style={{ color: "#ff6b00", flexShrink: 0 }} />
          </Link>
        </div>
      </motion.div>

      {/* Recent Conversations */}
      <motion.div
        className="ac-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="ac-card-header">
          <div className="ac-card-title">Recent Conversations</div>
          <Link href="#" className="ac-card-view-all">View all</Link>
        </div>
        <div className="ac-convo-list">
          <Link href="#" className="ac-convo-item active">
            <span className="ac-convo-title">What changed across product teams...</span>
            <span className="ac-convo-time">9:41 AM</span>
          </Link>
          <Link href="#" className="ac-convo-item">
            <span className="ac-convo-title">Summarize key blockers</span>
            <span className="ac-convo-time">Yesterday</span>
          </Link>
          <Link href="#" className="ac-convo-item">
            <span className="ac-convo-title">Customer sentiment trends</span>
            <span className="ac-convo-time">Yesterday</span>
          </Link>
          <Link href="#" className="ac-convo-item">
            <span className="ac-convo-title">What decisions need attention?</span>
            <span className="ac-convo-time">May 10</span>
          </Link>
          <Link href="#" className="ac-convo-item">
            <span className="ac-convo-title">Engineering bottlenecks</span>
            <span className="ac-convo-time">May 9</span>
          </Link>
        </div>
      </motion.div>

      {/* CTA Card */}
      <motion.div
        className="ac-cta-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <div className="ac-cta-title">
          <Sparkles size={16} style={{ color: "#ff6b00" }} fill="#ff6b00" />
          Get the most out of Corely
        </div>
        <div className="ac-cta-desc">
          Connect more sources to improve answer accuracy.
        </div>
        <Link href="#" className="ac-cta-btn">
          Manage Sources
        </Link>
      </motion.div>
    </div>
  );
}
