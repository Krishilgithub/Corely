"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  MoreHorizontal,
  X,
  Search,
  Paperclip,
  SendHorizontal,
} from "lucide-react";
import { useState } from "react";

const prompts = [
  "What changed across product teams this week?",
  "Summarize key blockers",
  "Show customer sentiment trends",
];

export default function AskCorelyPanel() {
  const [input, setInput] = useState("");
  const [userMsg, setUserMsg] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setUserMsg(input);
    setInput("");
  };

  const handlePrompt = (p: string) => {
    setUserMsg(p);
  };

  return (
    <motion.div
      className="db-panel"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25, duration: 0.45, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="db-panel-header">
        <span className="db-panel-title">
          <Sparkles size={13} style={{ color: "#ff6b00" }} />
          Ask Corely
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="db-panel-icon-btn" aria-label="More options">
            <MoreHorizontal size={14} />
          </button>
          <button className="db-panel-icon-btn" aria-label="Close panel">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Chat Body */}
      <div className="db-panel-body">
        {/* AI greeting */}
        <motion.div
          className="db-chat-ai-row"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="db-chat-ai-icon">C</div>
          <div className="db-chat-bubble">
            Hi Krishil! I&apos;m Corely.
            <br />
            Your enterprise intelligence layer.
            <br />
            How can I help you today?
          </div>
        </motion.div>

        {/* User message */}
        {userMsg && (
          <motion.div
            className="db-chat-user-row"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="db-chat-user-bubble">{userMsg}</div>
          </motion.div>
        )}

        {/* Suggested prompts */}
        {!userMsg && (
          <motion.div
            className="db-chat-prompts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
          >
            {prompts.map((prompt) => (
              <button
                key={prompt}
                className="db-prompt-btn"
                onClick={() => handlePrompt(prompt)}
              >
                <Search size={11} style={{ color: "#a1a1aa", flexShrink: 0 }} />
                <span>{prompt}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Input Footer */}
      <div className="db-chat-footer">
        <Paperclip size={13} style={{ color: "#d4d4d4", flexShrink: 0 }} />
        <input
          className="db-chat-input"
          placeholder="Ask a follow-up..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          aria-label="Ask Corely a question"
        />
        <button className="db-chat-send-btn" onClick={handleSend} aria-label="Send message">
          <SendHorizontal size={13} />
        </button>
      </div>
    </motion.div>
  );
}
