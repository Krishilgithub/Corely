"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
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
  Copy,
  Share,
  BookmarkPlus,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  FileText,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";



interface SourceInfo {
  title: string;
  url: string | null;
  type: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "corely";
  query?: string;
  text: string;
  sources?: SourceInfo[];
  isStreaming?: boolean;
  timestamp: string;
  feedback?: "positive" | "negative" | null;
}

const PRESET_PROMPTS = [
  {
    icon: <TrendingUp size={15} style={{ color: "#ff6b00" }} />,
    text: "What changed across product teams this week?",
  },
  {
    icon: <AlertTriangle size={15} style={{ color: "#ff6b00" }} />,
    text: "Summarize key blockers",
  },
  {
    icon: <Smile size={15} style={{ color: "#ff6b00" }} />,
    text: "Show customer sentiment trends",
  },
  {
    icon: <Target size={15} style={{ color: "#ff6b00" }} />,
    text: "What decisions need attention today?",
  },
];

function ThinkingState({ sources }: { sources?: SourceInfo[] }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 1800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const hasSources = sources && sources.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", padding: "4px 0" }}>
      {/* Steps List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Step 1 */}
        <motion.div 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "13px", color: step >= 1 ? "#16a34a" : "#71717a", fontWeight: 600 }}
        >
          {step >= 1 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "#dcfce7" }}>
              <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 800 }}>✓</span>
            </div>
          ) : (
            <Loader2 size={14} className="animate-spin" style={{ color: "#ff6b00" }} />
          )}
          <span>Analyzing query scope...</span>
        </motion.div>

        {/* Step 2 */}
        <motion.div 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: step >= 1 ? 1 : 0.5, x: 0 }}
          style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "13px", color: hasSources ? "#16a34a" : step >= 1 ? "#ff6b00" : "#71717a", fontWeight: 600 }}
        >
          {hasSources ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "#dcfce7" }}>
              <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 800 }}>✓</span>
            </div>
          ) : step >= 1 ? (
            <Loader2 size={14} className="animate-spin" style={{ color: "#ff6b00" }} />
          ) : (
            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #e4e4e7" }} />
          )}
          <span>
            {hasSources 
              ? `Retrieved ${sources.length} document references` 
              : "Scanning workspace semantic vectors..."}
          </span>
        </motion.div>

        {/* Step 3 */}
        <motion.div 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: hasSources ? 1 : 0.5, x: 0 }}
          style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "13px", color: hasSources ? "#ff6b00" : "#71717a", fontWeight: 600 }}
        >
          {hasSources ? (
            <Loader2 size={14} className="animate-spin" style={{ color: "#ff6b00" }} />
          ) : (
            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #e4e4e7" }} />
          )}
          <span>Synthesizing intelligence response...</span>
        </motion.div>
      </div>

      {/* Shimmer skeletons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
        <div
          style={{
            height: 12,
            width: "90%",
            borderRadius: 4,
            background: "linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%)",
            backgroundSize: "200% 100%",
            animation: "pulse-shimmer 1.5s infinite linear",
          }}
        />
        <div
          style={{
            height: 12,
            width: "75%",
            borderRadius: 4,
            background: "linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%)",
            backgroundSize: "200% 100%",
            animation: "pulse-shimmer 1.5s infinite linear",
          }}
        />
      </div>

      <style>{`
        @keyframes pulse-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

interface AskMainProps {
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  onNewMessage: () => void;
  sharedPrompt: string | null;
  setSharedPrompt: (prompt: string | null) => void;
}

export default function AskMain({
  activeSessionId,
  setActiveSessionId,
  onNewMessage,
  sharedPrompt,
  setSharedPrompt,
}: AskMainProps) {
  const { workspaceId } = useAuth();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ── Load message history on activeSessionId change ──────────────────
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    const fetchSessionMessages = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/chats/${activeSessionId}`);
        if (!response.ok) {
          throw new Error("Failed to load conversation history");
        }
        const data = (await response.json()) as { messages?: Array<{
          id: string;
          sender: string;
          text: string;
          sources: unknown;
          feedback: string | null;
          createdAt: string;
        }> };
        
        const dbMessages = data.messages || [];
        const transformed: ChatMessage[] = [];
        for (let i = 0; i < dbMessages.length; i++) {
          const msg = dbMessages[i];
          if (msg.sender === "corely") {
            const prevMsg = i > 0 ? dbMessages[i - 1] : null;
            transformed.push({
              id: msg.id,
              sender: "corely",
              query: prevMsg && prevMsg.sender === "user" ? prevMsg.text : undefined,
              text: msg.text,
              sources: msg.sources ? (msg.sources as SourceInfo[]) : [],
              feedback: msg.feedback as "positive" | "negative" | null,
              timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            });
          }
        }
        setMessages(transformed);
      } catch (err) {
        console.error("Error loading chat messages:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchSessionMessages();
  }, [activeSessionId]);

  // ── Auto scroll to bottom on new messages ───────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auto resize textarea ────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [query]);

  // ── Copy text utility ───────────────────────────────────────────
  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setShowToast("Copied to clipboard!");
    setTimeout(() => setShowToast(null), 3000);
  };

  // ── Pre-fill preset prompt ──────────────────────────────────────
  const handlePresetClick = (text: string) => {
    void handleSubmit(undefined, text);
  };

  // ── Thumbs up/down feedback ──────────────────────────────────────
  const handleFeedback = async (messageId: string, feedbackType: "positive" | "negative") => {
    if (!activeSessionId) return;

    // Optimistically update UI
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const nextFeedback = msg.feedback === feedbackType ? null : feedbackType;
          return { ...msg, feedback: nextFeedback };
        }
        return msg;
      })
    );

    try {
      const targetMsg = messages.find((m) => m.id === messageId);
      const newFeedback = targetMsg?.feedback === feedbackType ? null : feedbackType;

      const res = await fetch(`/api/chats/${activeSessionId}/messages/${messageId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: newFeedback }),
      });

      if (!res.ok) {
        throw new Error("Failed to record feedback");
      }
    } catch (err) {
      console.error("Error recording feedback:", err);
      setShowToast("Could not save feedback. Try again.");
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  // ── Submit Query ────────────────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent, promptOverride?: string) => {
    if (e) e.preventDefault();
    const promptText = (promptOverride || query).trim();
    if (!promptText || loading) return;

    if (!promptOverride) {
      setQuery("");
    }
    setLoading(true);

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: promptText,
      timestamp,
    };

    // 2. Add empty Corely message as placeholder for streaming
    const corelyMsgId = `corely-${Date.now()}`;
    const corelyMsg: ChatMessage = {
      id: corelyMsgId,
      sender: "corely",
      query: promptText,
      text: "",
      sources: [],
      isStreaming: true,
      timestamp,
    };

    setMessages((prev) => [...prev, userMsg, corelyMsg]);

    try {
      let currentSessionId = activeSessionId;

      // Create new session if none is active
      if (!currentSessionId) {
        const createRes = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
            title: promptText.slice(0, 40) + (promptText.length > 40 ? "..." : ""),
          }),
        });

        if (!createRes.ok) {
          throw new Error("Failed to initialize conversation session.");
        }

        const newSessionRes = (await createRes.json()) as { data: { id: string } };
        currentSessionId = newSessionRes.data.id;
        setActiveSessionId(currentSessionId);
        onNewMessage();
      }

      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: promptText,
          workspaceId,
          sessionId: currentSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      if (!response.body) {
        throw new Error("No response stream received from the brain.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === corelyMsgId ? { ...msg, isStreaming: false } : msg
                )
              );
              onNewMessage();
            } else {
              try {
                const parsed = JSON.parse(dataStr) as {
                  type: "sources" | "text";
                  sources?: SourceInfo[];
                  text?: string;
                };
                if (parsed.type === "sources") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === corelyMsgId ? { ...msg, sources: parsed.sources } : msg
                    )
                  );
                } else if (parsed.type === "text") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === corelyMsgId ? { ...msg, text: msg.text + (parsed.text ?? "") } : msg
                    )
                  );
                }
              } catch (parseErr) {
                console.warn("Failed to parse event stream chunk:", parseErr);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("RAG Query failed:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === corelyMsgId
            ? {
                ...msg,
                text: `⚠️ Corely was unable to answer your query. Reason: ${errMsg}`,
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Suggested prompt automatic trigger ─────────────────────────
  useEffect(() => {
    if (sharedPrompt) {
      void handleSubmit(undefined, sharedPrompt);
      setSharedPrompt(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedPrompt, setSharedPrompt]);

  // ── Share conversation link ────────────────────────────────────
  const handleShare = () => {
    if (typeof window !== "undefined") {
      void navigator.clipboard.writeText(window.location.href);
      setShowToast("Conversation link copied to clipboard!");
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  // ── Save message block to Workspace Memory ─────────────────────
  const handleSaveToMemory = (text: string) => {
    try {
      const existing = localStorage.getItem("corely-memories");
      const list = existing ? JSON.parse(existing) : [];
      list.push({
        id: `mem-${Date.now()}`,
        text,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem("corely-memories", JSON.stringify(list));
      setShowToast("Saved to workspace memory!");
      setTimeout(() => setShowToast(null), 3000);
    } catch (e) {
      console.error("Failed to save memory item:", e);
      setShowToast("Failed to save to memory.");
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  // ── Handle enter key inside textarea ────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", minHeight: "0", position: "relative", overflow: "hidden" }}>
      {/* Toast Alert */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed",
              top: 24,
              right: 24,
              zIndex: 9999,
              background: "#111",
              color: "#fff",
              padding: "12px 20px",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }}
          >
            <CheckCircle2 size={16} color="#4ade80" />
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        className="ac-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ flexShrink: 0, marginBottom: 16 }}
      >
        <h1 className="ac-title">
          <Sparkles size={24} style={{ color: "#ff6b00" }} fill="#ff6b00" />
          Ask Corely
        </h1>
        <p className="ac-subtitle">Your AI partner for company intelligence.</p>
      </motion.div>

      {/* Chat Thread & Scroll Lane */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: "0", marginBottom: 16, paddingRight: "6px", scrollbarWidth: "thin" }}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            if (msg.sender === "user") {
              // Standard User chat bubble styled with dynamic orange gradients
              return (
                <div key={msg.id} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      maxWidth: "75%",
                      background: "linear-gradient(135deg, #ff6b00, #ff8533)",
                      color: "#fff",
                      padding: "12px 18px",
                      borderRadius: "16px 16px 4px 16px",
                      boxShadow: "0 4px 12px rgba(255, 107, 0, 0.15)",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 500, lineHeight: 1.5, wordBreak: "break-word" }}>
                      {msg.text}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "rgba(255, 255, 255, 0.8)", textAlign: "right", marginTop: 6, fontWeight: 500 }}>
                      {msg.timestamp}
                    </div>
                  </motion.div>
                </div>
              );
            }

            // Corely Response Card
            return (
              <motion.div
                key={msg.id}
                className="ac-response-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                style={{ marginBottom: 20 }}
              >
                {/* Response Header */}
                <div className="ac-response-header">
                  <div className="ac-response-title">
                    <Sparkles size={15} style={{ color: "#ff6b00" }} fill="#ff6b00" />
                    Corely Response
                  </div>
                  <div className="ac-response-time">{msg.timestamp}</div>
                </div>

                {/* Response Body */}
                <div className="ac-response-body">
                  <div className="ac-response-context" style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", margin: 0 }}>
                    {msg.text ? (
                      msg.text
                    ) : (
                      <ThinkingState sources={msg.sources} />
                    )}
                  </div>

                  {/* Dynamic citations / sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="ac-r-source-wrap" style={{ marginTop: 18 }}>
                      <span className="ac-r-source-label">Sources:</span>
                      {msg.sources.map((src, i) => (
                        src.url ? (
                          <a
                            key={i}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ac-r-source-badge"
                            style={{
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <FileText size={11} style={{ marginRight: 2 }} />
                            {src.title}
                            <ExternalLink size={10} style={{ marginLeft: 2, opacity: 0.7 }} />
                          </a>
                        ) : (
                          <span key={i} className="ac-r-source-badge">
                            <FileText size={11} style={{ marginRight: 2 }} />
                            {src.title}
                          </span>
                        )
                      ))}
                    </div>
                  )}
                </div>

                {/* Response Actions */}
                {!msg.isStreaming && msg.text && (
                  <div className="ac-response-footer">
                    <div className="ac-footer-actions">
                      <button className="ac-action-btn" onClick={() => handleCopy(msg.text)}>
                        <Copy size={13} /> Copy
                      </button>
                      <button className="ac-action-btn" onClick={handleShare}>
                        <Share size={13} /> Share
                      </button>
                      <button className="ac-action-btn" onClick={() => handleSaveToMemory(msg.text)}>
                        <BookmarkPlus size={13} /> Save to memory
                      </button>
                    </div>
                    <div className="ac-feedback">
                      Was this helpful?
                      <button
                        className="ac-action-btn"
                        aria-label="Thumbs up"
                        onClick={() => void handleFeedback(msg.id, "positive")}
                        style={{
                          color: msg.feedback === "positive" ? "#ff6b00" : undefined,
                        }}
                      >
                        <ThumbsUp size={14} fill={msg.feedback === "positive" ? "#ff6b00" : "none"} />
                      </button>
                      <button
                        className="ac-action-btn"
                        aria-label="Thumbs down"
                        onClick={() => void handleFeedback(msg.id, "negative")}
                        style={{
                          color: msg.feedback === "negative" ? "#ea3838" : undefined,
                        }}
                      >
                        <ThumbsDown size={14} fill={msg.feedback === "negative" ? "#ea3838" : "none"} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty state + Preset grid rendered internally inside scroll lane */}
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "20px 0" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                padding: "48px 24px",
                border: "1.5px dashed #e4e4e7",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                background: "#fafafa",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#fff3ee",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Sparkles size={24} color="#ff6b00" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 6 }}>
                Ask anything about your company
              </h3>
              <p style={{ fontSize: 13.5, color: "#71717a", maxWidth: 360, lineHeight: 1.5 }}>
                Corely semantic brain indexes all your Google Drive and cloud files, then responds instantly using context-aware RAG.
              </p>
            </motion.div>

            {/* Preset Prompts Grid */}
            <motion.div
              className="ac-prompts-grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{ margin: 0 }}
            >
              {PRESET_PROMPTS.map((prompt, i) => (
                <div
                  key={i}
                  className="ac-prompt-card"
                  onClick={() => handlePresetClick(prompt.text)}
                  style={{ cursor: "pointer" }}
                >
                  {prompt.icon}
                  <span className="ac-prompt-text">{prompt.text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box - Anchored at the bottom */}
      <form onSubmit={handleSubmit} style={{ flexShrink: 0 }}>
        <motion.div
          className="ac-input-wrapper"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ marginBottom: 0 }}
        >
          <textarea
            ref={textareaRef}
            className="ac-input-field"
            placeholder="Ask anything about your company..."
            rows={1}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ resize: "none" }}
          />
          <div className="ac-input-actions">
            <div className="ac-input-tools">
              <button type="button" className="ac-tool-btn" aria-label="Attach file">
                <Paperclip size={18} />
              </button>
              <button type="button" className="ac-tool-btn" aria-label="Web search">
                <Globe size={18} />
              </button>
              <button type="button" className="ac-tool-btn" aria-label="Knowledge base">
                <BookOpen size={18} />
              </button>
            </div>
            <button
              type="submit"
              className="ac-submit-btn"
              aria-label="Submit prompt"
              disabled={!query.trim() || loading}
              style={{
                background: (!query.trim() || loading) ? "#f4f4f5" : "#ff6b00",
                color: (!query.trim() || loading) ? "#a1a1aa" : "#fff",
                cursor: (!query.trim() || loading) ? "not-allowed" : "pointer",
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} strokeWidth={3} />}
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}

