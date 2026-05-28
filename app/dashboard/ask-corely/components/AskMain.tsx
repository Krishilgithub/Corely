"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../../lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
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
  Share2,
  BookmarkPlus,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  FileText,
  ExternalLink,
  CheckCircle2,
  Download,
  X,
  Check,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SourceInfo {
  title: string;
  url: string | null;
  type: string;
  confidenceScore?: number;
  confidenceLabel?: "Fresh" | "Stale" | "Aged";
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

// ─── Preset Prompts ───────────────────────────────────────────────────────────

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

// ─── Thinking State ───────────────────────────────────────────────────────────

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
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
        <div style={{ height: 12, width: "90%", borderRadius: 4, background: "linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%)", backgroundSize: "200% 100%", animation: "pulse-shimmer 1.5s infinite linear" }} />
        <div style={{ height: 12, width: "75%", borderRadius: 4, background: "linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%)", backgroundSize: "200% 100%", animation: "pulse-shimmer 1.5s infinite linear" }} />
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface AskMainProps {
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  onNewMessage: () => void;
  sharedPrompt: string | null;
  setSharedPrompt: (prompt: string | null) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

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

  // ── Tool toggles ────────────────────────────────────────────────────────────
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [knowledgeOnlyEnabled, setKnowledgeOnlyEnabled] = useState(false);

  // ── File attachment ──────────────────────────────────────────────────────────
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Per-message copy state ─────────────────────────────────────────────────
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const skipNextFetchRef = useRef(false);

  // ─── Toast helper ────────────────────────────────────────────────────────────
  const toast = useCallback((msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  }, []);

  // ─── Load message history ─────────────────────────────────────────────────
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    const fetchSessionMessages = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/chats/${activeSessionId}`);
        if (!response.ok) throw new Error("Failed to load conversation history");

        const data = (await response.json()) as {
          messages?: Array<{
            id: string;
            sender: string;
            text: string;
            sources: unknown;
            feedback: string | null;
            createdAt: string;
          }>;
        };

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
              timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            });
          } else if (msg.sender === "user") {
            transformed.push({
              id: msg.id,
              sender: "user",
              text: msg.text,
              timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

  // ─── Auto scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Auto resize textarea ───────────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [query]);

  // ─── File Attachment ─────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      // Truncate to 8000 chars to avoid token overflow
      setAttachedFile({ name: file.name, content: content.slice(0, 8000) });
    };
    reader.readAsText(file);
    // Reset input so same file can be reselected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = () => setAttachedFile(null);

  // ─── Copy with success flash ─────────────────────────────────────────────────
  const handleCopy = (text: string, messageId: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  };

  // ─── Share ────────────────────────────────────────────────────────────────────
  const handleShare = () => {
    if (typeof window !== "undefined") {
      void navigator.clipboard.writeText(window.location.href);
      toast("Conversation link copied to clipboard!");
    }
  };

  // ─── Export conversation as Markdown ──────────────────────────────────────────
  const handleExport = () => {
    if (messages.length === 0) {
      toast("No conversation to export.");
      return;
    }

    const lines: string[] = [
      `# Corely Conversation Export`,
      `_Exported: ${new Date().toLocaleString()}_`,
      "",
    ];

    messages.forEach((msg) => {
      if (msg.sender === "user") {
        lines.push(`## 🧑 You (${msg.timestamp})`);
        lines.push(msg.text);
        lines.push("");
      } else {
        lines.push(`## ✨ Corely (${msg.timestamp})`);
        lines.push(msg.text);
        if (msg.sources && msg.sources.length > 0) {
          lines.push("");
          lines.push("**Sources:**");
          msg.sources.forEach((src) => {
            lines.push(`- [${src.title}](${src.url || "#"}) — ${src.confidenceLabel ?? ""} (${src.confidenceScore ?? ""}%)`);
          });
        }
        lines.push("");
      }
    });

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `corely-conversation-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Conversation exported as Markdown!");
  };

  // ─── Save to Memory ──────────────────────────────────────────────────────────
  const handleSaveToMemory = async (msg: ChatMessage) => {
    try {
      const title = msg.query
        ? `AI Answer: ${msg.query.slice(0, 60)}${msg.query.length > 60 ? "..." : ""}`
        : "Corely AI Response";

      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: msg.text.slice(0, 2000),
          category: "insight",
          badges: ["Corely AI", "Chat Export"],
          sourceName: "Corely AI",
        }),
      });

      if (!res.ok) throw new Error("Failed to save to memory");
      toast("✅ Saved to workspace memory!");
    } catch (err) {
      console.error("Save to memory failed:", err);
      toast("Failed to save to memory. Try again.");
    }
  };

  // ─── Feedback ─────────────────────────────────────────────────────────────────
  const handleFeedback = async (messageId: string, feedbackType: "positive" | "negative") => {
    if (!activeSessionId) return;

    // Optimistic update
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

      const res = await fetch(
        `/api/chats/${activeSessionId}/messages/${messageId}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback: newFeedback }),
        }
      );

      if (!res.ok) throw new Error("Failed to record feedback");

      if (newFeedback === "positive") toast("👍 Thanks for the positive feedback!");
      else if (newFeedback === "negative") toast("👎 Thanks — we'll keep improving!");
    } catch (err) {
      console.error("Error recording feedback:", err);
      toast("Could not save feedback. Try again.");
    }
  };

  // ─── Enter key ────────────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  // ─── Submit Query ────────────────────────────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent, promptOverride?: string) => {
    if (e) e.preventDefault();
    const promptText = (promptOverride || query).trim();
    if (!promptText || loading) return;

    if (!promptOverride) setQuery("");
    setLoading(true);

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Build the final question (with optional file context)
    let finalQuestion = promptText;
    if (attachedFile) {
      finalQuestion = `[Attached file: ${attachedFile.name}]\n\n${attachedFile.content}\n\n---\n\nUser question: ${promptText}`;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: promptText, // Show clean text in UI
      timestamp,
    };

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
    setAttachedFile(null); // Clear file after sending

    try {
      let currentSessionId = activeSessionId;

      if (!currentSessionId) {
        const createRes = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
            title: promptText.slice(0, 40) + (promptText.length > 40 ? "..." : ""),
          }),
        });

        if (!createRes.ok) throw new Error("Failed to initialize conversation session.");

        const newSessionRes = (await createRes.json()) as { data: { id: string } };
        currentSessionId = newSessionRes.data.id;
        skipNextFetchRef.current = true;
        setActiveSessionId(currentSessionId);
        onNewMessage();
      }

      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: finalQuestion,
          workspaceId,
          sessionId: currentSessionId,
          webSearch: webSearchEnabled,
          knowledgeOnly: knowledgeOnlyEnabled,
        }),
      });

      if (!response.ok) throw new Error(await response.text());
      if (!response.body) throw new Error("No response stream received from the brain.");

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
                prev.map((msg) => (msg.id === corelyMsgId ? { ...msg, isStreaming: false } : msg))
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
                      msg.id === corelyMsgId
                        ? { ...msg, text: msg.text + (parsed.text ?? "") }
                        : msg
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
            ? { ...msg, text: `⚠️ Corely was unable to answer your query. Reason: ${errMsg}`, isStreaming: false }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Preset prompt auto-trigger ───────────────────────────────────────────────
  useEffect(() => {
    if (sharedPrompt) {
      void handleSubmit(undefined, sharedPrompt);
      setSharedPrompt(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedPrompt, setSharedPrompt]);

  // ─── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", minHeight: "0", position: "relative", overflow: "hidden" }}>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.csv,.json,.pdf,.doc,.docx"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {/* Toast */}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 className="ac-title">
              <Sparkles size={24} style={{ color: "#ff6b00" }} fill="#ff6b00" />
              Ask Corely
            </h1>
            <p className="ac-subtitle">Your AI partner for company intelligence.</p>
          </div>
          {/* Export conversation button */}
          {messages.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleExport}
              title="Export conversation as Markdown"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid #e4e4e7",
                background: "#fff",
                color: "#71717a",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#ff6b00";
                (e.currentTarget as HTMLButtonElement).style.color = "#ff6b00";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#e4e4e7";
                (e.currentTarget as HTMLButtonElement).style.color = "#71717a";
              }}
            >
              <Download size={13} />
              Export
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Chat Thread & Scroll Lane */}
      <div style={{ flex: 1, position: "relative", minHeight: 0, marginBottom: 16 }}>
        <div
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflowY: "auto", paddingRight: "6px", scrollbarWidth: "thin" }}
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              if (msg.sender === "user") {
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
                    <div className="ac-response-context" style={{ lineHeight: "1.6", margin: 0 }}>
                      {msg.text ? (
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-100 prose-pre:text-zinc-900 prose-a:text-orange-600">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <ThinkingState sources={msg.sources} />
                      )}
                    </div>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="ac-r-source-wrap" style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span className="ac-r-source-label">Sources &amp; Temporal Confidence:</span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {msg.sources.map((src, i) => {
                            let badgeColor = "#71717a";
                            let badgeBg = "#f4f4f5";
                            if (src.confidenceLabel === "Fresh") { badgeColor = "#16a34a"; badgeBg = "#dcfce7"; }
                            else if (src.confidenceLabel === "Aged") { badgeColor = "#ca8a04"; badgeBg = "#fef08a"; }
                            else if (src.confidenceLabel === "Stale") { badgeColor = "#dc2626"; badgeBg = "#fee2e2"; }

                            return (
                              <a
                                key={i}
                                href={src.url || "#"}
                                target={src.url ? "_blank" : "_self"}
                                rel="noopener noreferrer"
                                className="ac-r-source-badge"
                                style={{
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "4px 8px",
                                  background: "#fff",
                                  border: "1px solid #e4e4e7",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  color: "#111",
                                  transition: "all 0.2s",
                                }}
                              >
                                <FileText size={11} style={{ marginRight: 2 }} />
                                <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {src.title}
                                </span>
                                {src.confidenceLabel && (
                                  <span style={{
                                    marginLeft: "6px",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    color: badgeColor,
                                    backgroundColor: badgeBg,
                                    letterSpacing: "0.5px",
                                    textTransform: "uppercase",
                                  }}>
                                    {src.confidenceLabel} ({src.confidenceScore}%)
                                  </span>
                                )}
                                <ExternalLink size={10} style={{ marginLeft: 2, opacity: 0.7 }} />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Response Actions */}
                  {!msg.isStreaming && msg.text && (
                    <div className="ac-response-footer">
                      <div className="ac-footer-actions">
                        {/* Copy with success flash */}
                        <button
                          className="ac-action-btn"
                          onClick={() => handleCopy(msg.text, msg.id)}
                          style={{ color: copiedMessageId === msg.id ? "#16a34a" : undefined, transition: "color 0.2s" }}
                        >
                          {copiedMessageId === msg.id ? (
                            <><Check size={13} /> Copied!</>
                          ) : (
                            <><Copy size={13} /> Copy</>
                          )}
                        </button>

                        {/* Share */}
                        <button className="ac-action-btn" onClick={handleShare}>
                          <Share2 size={13} /> Share
                        </button>

                        {/* Save to memory — real API */}
                        <button className="ac-action-btn" onClick={() => void handleSaveToMemory(msg)}>
                          <BookmarkPlus size={13} /> Save to memory
                        </button>

                        {/* Export this message */}
                        <button className="ac-action-btn" onClick={handleExport}>
                          <Download size={13} /> Export
                        </button>
                      </div>

                      <div className="ac-feedback">
                        Was this helpful?
                        <button
                          className="ac-action-btn"
                          aria-label="Thumbs up"
                          onClick={() => void handleFeedback(msg.id, "positive")}
                          style={{ color: msg.feedback === "positive" ? "#ff6b00" : undefined }}
                        >
                          <ThumbsUp size={14} fill={msg.feedback === "positive" ? "#ff6b00" : "none"} />
                        </button>
                        <button
                          className="ac-action-btn"
                          aria-label="Thumbs down"
                          onClick={() => void handleFeedback(msg.id, "negative")}
                          style={{ color: msg.feedback === "negative" ? "#ea3838" : undefined }}
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

          {/* Empty state with preset prompts */}
          {messages.length === 0 && !loading && (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingBottom: "10vh" }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                style={{ textAlign: "center", marginBottom: 32, width: "100%", maxWidth: 520 }}
              >
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fff3ee", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Sparkles size={24} color="#ff6b00" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 6 }}>
                  Ask anything about your company
                </h3>
                <p style={{ fontSize: 13.5, color: "#71717a", maxWidth: 360, lineHeight: 1.5, margin: "0 auto 28px" }}>
                  Corely&#39;s semantic brain indexes all your connected sources and responds with citation-backed intelligence.
                </p>

                {/* Preset prompt grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, textAlign: "left" }}>
                  {PRESET_PROMPTS.map((p) => (
                    <motion.button
                      key={p.text}
                      whileHover={{ y: -2, boxShadow: "0 4px 16px rgba(255,107,0,0.12)" }}
                      onClick={() => void handleSubmit(undefined, p.text)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: "1px solid #e4e4e7",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#374151",
                        lineHeight: 1.4,
                        transition: "all 0.2s",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ flexShrink: 0, marginTop: 1 }}>{p.icon}</span>
                      {p.text}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} style={{ flexShrink: 0 }}>
        <motion.div
          className="ac-input-wrapper"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ marginBottom: 0 }}
        >
          {/* Active tool chips */}
          <AnimatePresence>
            {(webSearchEnabled || knowledgeOnlyEnabled || attachedFile) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px 0", overflow: "hidden" }}
              >
                {webSearchEnabled && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 600 }}>
                    <Globe size={11} /> Web Search ON
                    <button type="button" onClick={() => setWebSearchEnabled(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", padding: 0, display: "flex", alignItems: "center" }}>
                      <X size={11} />
                    </button>
                  </span>
                )}
                {knowledgeOnlyEnabled && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 600 }}>
                    <BookOpen size={11} /> Knowledge Only
                    <button type="button" onClick={() => setKnowledgeOnlyEnabled(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#16a34a", padding: 0, display: "flex", alignItems: "center" }}>
                      <X size={11} />
                    </button>
                  </span>
                )}
                {attachedFile && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "#fff3ee", color: "#ff6b00", fontSize: 12, fontWeight: 600 }}>
                    <FileText size={11} /> {attachedFile.name}
                    <button type="button" onClick={handleRemoveFile} style={{ background: "none", border: "none", cursor: "pointer", color: "#ff6b00", padding: 0, display: "flex", alignItems: "center" }}>
                      <X size={11} />
                    </button>
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            ref={textareaRef}
            className="ac-input-field"
            placeholder="Ask anything about your company... (Shift+Enter for new line)"
            rows={1}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ resize: "none" }}
          />
          <div className="ac-input-actions">
            <div className="ac-input-tools">
              {/* File Attachment */}
              <button
                type="button"
                className="ac-tool-btn"
                aria-label="Attach file"
                title="Attach a text file as context"
                onClick={() => fileInputRef.current?.click()}
                style={{ color: attachedFile ? "#ff6b00" : undefined }}
              >
                <Paperclip size={18} />
              </button>

              {/* Web Search Toggle */}
              <button
                type="button"
                className="ac-tool-btn"
                aria-label="Toggle web search"
                title={webSearchEnabled ? "Web search ON — click to disable" : "Enable web search context"}
                onClick={() => setWebSearchEnabled((v) => !v)}
                style={{
                  color: webSearchEnabled ? "#2563eb" : undefined,
                  background: webSearchEnabled ? "#eff6ff" : undefined,
                  borderRadius: webSearchEnabled ? 8 : undefined,
                }}
              >
                <Globe size={18} />
              </button>

              {/* Knowledge Only Toggle */}
              <button
                type="button"
                className="ac-tool-btn"
                aria-label="Toggle knowledge base only"
                title={knowledgeOnlyEnabled ? "Knowledge-only mode ON — click to disable" : "Enable knowledge-base-only mode"}
                onClick={() => setKnowledgeOnlyEnabled((v) => !v)}
                style={{
                  color: knowledgeOnlyEnabled ? "#16a34a" : undefined,
                  background: knowledgeOnlyEnabled ? "#f0fdf4" : undefined,
                  borderRadius: knowledgeOnlyEnabled ? 8 : undefined,
                }}
              >
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
