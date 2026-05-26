"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Paperclip,
  Globe,
  BookOpen,
  ArrowUp,
  TrendingUp,
  AlertTriangle,
  Smile,
  Target,
  Check,
  LineChart,
  Users,
  Megaphone,
  Copy,
  Share,
  BookmarkPlus,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

export default function AskMain() {
  return (
    <div style={{ flex: 1 }}>
      {/* Header */}
      <motion.div
        className="ac-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="ac-title">
          <Sparkles size={24} style={{ color: "#ff6b00" }} fill="#ff6b00" />
          Ask Corely
        </h1>
        <p className="ac-subtitle">Your AI partner for company intelligence.</p>
      </motion.div>

      {/* Input Box */}
      <motion.div
        className="ac-input-wrapper"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <textarea
          className="ac-input-field"
          placeholder="Ask anything about your company..."
          rows={1}
        />
        <div className="ac-input-actions">
          <div className="ac-input-tools">
            <button className="ac-tool-btn" aria-label="Attach file">
              <Paperclip size={18} />
            </button>
            <button className="ac-tool-btn" aria-label="Web search">
              <Globe size={18} />
            </button>
            <button className="ac-tool-btn" aria-label="Knowledge base">
              <BookOpen size={18} />
            </button>
          </div>
          <button className="ac-submit-btn" aria-label="Submit prompt">
            <ArrowUp size={18} strokeWidth={3} />
          </button>
        </div>
      </motion.div>

      {/* Prompts Grid */}
      <motion.div
        className="ac-prompts-grid"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="ac-prompt-card">
          <TrendingUp size={16} style={{ color: "#ff6b00" }} className="ac-prompt-icon" />
          <span className="ac-prompt-text">What changed across product teams this week?</span>
        </div>
        <div className="ac-prompt-card">
          <AlertTriangle size={16} style={{ color: "#ff6b00" }} className="ac-prompt-icon" />
          <span className="ac-prompt-text">Summarize key blockers</span>
        </div>
        <div className="ac-prompt-card">
          <Smile size={16} style={{ color: "#ff6b00" }} className="ac-prompt-icon" />
          <span className="ac-prompt-text">Show customer sentiment trends</span>
        </div>
        <div className="ac-prompt-card">
          <Target size={16} style={{ color: "#ff6b00" }} className="ac-prompt-icon" />
          <span className="ac-prompt-text">What decisions need attention today?</span>
        </div>
      </motion.div>

      {/* Response Card */}
      <motion.div
        className="ac-response-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="ac-response-header">
          <div className="ac-response-title">
            <Sparkles size={16} style={{ color: "#ff6b00" }} fill="#ff6b00" />
            Corely Response
          </div>
          <div className="ac-response-time">Today, 9:41 AM</div>
        </div>

        <div className="ac-response-body">
          <div className="ac-response-query">What changed across product teams this week?</div>
          <div className="ac-response-context">
            Here&apos;s what stood out across your product organization this week:
          </div>

          <div className="ac-response-items">
            <div className="ac-r-item">
              <div className="ac-r-icon" style={{ background: "#dcfce7" }}>
                <Check size={18} style={{ color: "#16a34a" }} strokeWidth={3} />
              </div>
              <div className="ac-r-content">
                <div className="ac-r-title">Project Phoenix made significant progress</div>
                <div className="ac-r-desc">
                  Engineering completed 87% of planned tasks ahead of schedule. The mobile team shipped the new onboarding flow.
                </div>
                <div className="ac-r-source-wrap">
                  <span className="ac-r-source-label">Source:</span>
                  <span className="ac-r-source-badge">Jira</span>
                  <span className="ac-r-source-badge">Slack</span>
                </div>
              </div>
            </div>

            <div className="ac-r-item">
              <div className="ac-r-icon" style={{ background: "#f3e8ff" }}>
                <LineChart size={18} style={{ color: "#9333ea" }} strokeWidth={2.5} />
              </div>
              <div className="ac-r-content">
                <div className="ac-r-title">Design system adoption increased</div>
                <div className="ac-r-desc">
                  32 new components were published and adoption across teams is up 24%.
                </div>
                <div className="ac-r-source-wrap">
                  <span className="ac-r-source-label">Source:</span>
                  <span className="ac-r-source-badge">Figma</span>
                </div>
              </div>
            </div>

            <div className="ac-r-item">
              <div className="ac-r-icon" style={{ background: "#fef3c7" }}>
                <Users size={18} style={{ color: "#d97706" }} strokeWidth={2.5} />
              </div>
              <div className="ac-r-content">
                <div className="ac-r-title">Customer feedback theme shift</div>
                <div className="ac-r-desc">
                  Users are increasingly requesting advanced analytics and reporting capabilities.
                </div>
                <div className="ac-r-source-wrap">
                  <span className="ac-r-source-label">Source:</span>
                  <span className="ac-r-source-badge">Intercom</span>
                  <span className="ac-r-source-badge">Support tickets</span>
                </div>
              </div>
            </div>

            <div className="ac-r-item">
              <div className="ac-r-icon" style={{ background: "#e0f2fe" }}>
                <Megaphone size={18} style={{ color: "#0ea5e9" }} strokeWidth={2.5} />
              </div>
              <div className="ac-r-content">
                <div className="ac-r-title">Marketing and Sales alignment improved</div>
                <div className="ac-r-desc">
                  New positioning is resonating well — engagement increased 18% across key accounts.
                </div>
                <div className="ac-r-source-wrap">
                  <span className="ac-r-source-label">Source:</span>
                  <span className="ac-r-source-badge">HubSpot</span>
                  <span className="ac-r-source-badge">Salesforce</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ac-response-footer">
          <div className="ac-footer-actions">
            <button className="ac-action-btn">
              <Copy size={14} /> Copy
            </button>
            <button className="ac-action-btn">
              <Share size={14} /> Share
            </button>
            <button className="ac-action-btn">
              <BookmarkPlus size={14} /> Save to memory
            </button>
          </div>
          <div className="ac-feedback">
            Was this helpful?
            <button className="ac-action-btn" aria-label="Thumbs up">
              <ThumbsUp size={15} />
            </button>
            <button className="ac-action-btn" aria-label="Thumbs down">
              <ThumbsDown size={15} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
