"use client";

import {
  Sparkles,
  MoreHorizontal,
  X,
  Search,
  Paperclip,
  SendHorizontal,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CorelyLogo from "@/components/icons/corely-logo";

const prompts = [
  "What changed across product teams this week?",
  "Summarize key blockers",
  "Show customer sentiment trends",
];

export default function AskCorelyPanel() {
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleSend = (query?: string) => {
    const q = query || input;
    if (!q.trim()) return;
    router.push(`/dashboard/ask-corely?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="db-panel">
      {/* Header */}
      <div className="db-panel-header">
        <span className="db-panel-title type-heading">
          <Sparkles />
          Ask Corely
        </span>
        <div className="db-panel-actions">
          <button className="db-panel-icon-btn" aria-label="More options">
            <MoreHorizontal size={16} />
          </button>
          <button className="db-panel-icon-btn" aria-label="Close panel">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Chat Body */}
      <div className="db-panel-body">
        {/* AI greeting */}
        <div className="db-chat-ai-row">
          <div className="db-chat-ai-icon">
            <CorelyLogo size={16} />
          </div>
          <div className="db-chat-bubble">
            Hi, I&apos;m Corely.
            <br />
            Your enterprise intelligence layer.
            <br />
            How can I help you today?
          </div>
        </div>

        {/* Suggested prompts */}
        <div className="db-chat-prompts">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              className="db-prompt-btn"
              onClick={() => handleSend(prompt)}
            >
              <Search />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Footer */}
      <div className="db-chat-footer">
        <Paperclip />
        <input
          className="db-chat-input"
          placeholder="Ask a question to start..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          aria-label="Ask Corely a question"
        />
        <button className="db-chat-send-btn" onClick={() => handleSend()} aria-label="Send message">
          <SendHorizontal />
        </button>
      </div>
    </div>
  );
}
