"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../../lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Paperclip,
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
  Plus,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import CorelyLogo from "@/components/icons/corely-logo";
import { SourceLogo } from "@/components/ui/source-logo";

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
  /** True once the server has sent the "sources" event (the search step is over). */
  sourcesReceived?: boolean;
  timestamp: string;
  feedback?: "positive" | "negative" | null;
}

// ─── Preset Prompts ───────────────────────────────────────────────────────────

const PRESET_PROMPTS = [
  {
    icon: <TrendingUp size={16} />,
    text: "What changed across product teams this week?",
  },
  {
    icon: <AlertTriangle size={16} />,
    text: "Summarize key blockers",
  },
  {
    icon: <Smile size={16} />,
    text: "Show customer sentiment trends",
  },
  {
    icon: <Target size={16} />,
    text: "How did we decide on the new API design?",
  },
];

// Plain-text files the composer can read in the browser.
const TEXT_FILE_EXTENSIONS = ["txt", "md", "csv", "json"];
const MAX_ATTACHMENT_CHARS = 8000;

// Client-side ids start with this until the server sends the saved message id.
const TEMP_ID_PREFIX = "temp-";

// ─── Display helpers (visual only) ────────────────────────────────────────────

// Badge tone for a source's freshness label: Fresh → green, Aged → amber, Stale → red.
function toneForConfidence(label?: SourceInfo["confidenceLabel"]): StatusTone {
  if (label === "Fresh") return "success";
  if (label === "Aged") return "warning";
  if (label === "Stale") return "error";
  return "neutral";
}

// Turns a source type such as "notion_page" into "Notion page".
function formatSourceType(type?: string): string {
  const words = (type || "document").replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// ─── Thinking State ───────────────────────────────────────────────────────────

type StepState = "done" | "active" | "pending";

function StepIcon({ state }: { state: StepState }) {
  return (
    <span className="ac-step-icon" aria-hidden="true">
      {state === "done" ? (
        <Check size={12} strokeWidth={3} />
      ) : state === "active" ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <span className="ac-step-dot" />
      )}
    </span>
  );
}

// Steps follow real stream events: "searching" until the sources event
// arrives, then "writing" until the first words of the answer arrive.
function ThinkingState({ sources, sourcesReceived }: { sources?: SourceInfo[]; sourcesReceived?: boolean }) {
  const count = sources?.length ?? 0;
  const searchStep: StepState = sourcesReceived ? "done" : "active";
  const writeStep: StepState = sourcesReceived ? "active" : "pending";
  const searchDoneLabel = count > 0 ? `Found ${count} source${count === 1 ? "" : "s"}` : "Searched your knowledge";

  return (
    <div className="ac-thinking">
      <div className="ac-steps">
        <motion.div
          className={`ac-step is-${searchStep}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <StepIcon state={searchStep} />
          {searchStep === "active"
            ? <TextShimmer>Searching your knowledge…</TextShimmer>
            : <span>{searchDoneLabel}</span>}
        </motion.div>

        <motion.div
          className={`ac-step is-${writeStep}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: sourcesReceived ? 1 : 0.5 }}
          transition={{ duration: 0.15 }}
        >
          <StepIcon state={writeStep} />
          {writeStep === "active" ? <TextShimmer>Writing the answer…</TextShimmer> : <span>Writing the answer…</span>}
        </motion.div>
      </div>

      <div className="ac-thinking-lines" aria-hidden="true">
        <div className="ui-skeleton" style={{ width: "90%" }} />
        <div className="ui-skeleton" style={{ width: "75%" }} />
      </div>
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
  /** Whether the right context panel is showing (the chat widens when it is hidden). */
  contextOpen?: boolean;
  onToggleContext?: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AskMain({
  activeSessionId,
  setActiveSessionId,
  onNewMessage,
  sharedPrompt,
  setSharedPrompt,
  contextOpen = true,
  onToggleContext,
}: AskMainProps) {
  const { workspaceId } = useAuth();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

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
        if (response.status === 404) {
          // For example a shared link to a conversation from another workspace.
          toast("That conversation could not be found.");
          setActiveSessionId(null);
          return;
        }
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
  }, [activeSessionId, setActiveSessionId, toast]);

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

    // readAsText only works for plain-text files. PDF and Word files go through Sources.
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!TEXT_FILE_EXTENSIONS.includes(ext)) {
      toast("Only .txt, .md, .csv or .json files can be attached. Upload PDF or Word files in Sources.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      // Truncate to avoid token overflow, and say so
      setAttachedFile({ name: file.name, content: content.slice(0, MAX_ATTACHMENT_CHARS) });
      if (content.length > MAX_ATTACHMENT_CHARS) {
        toast(`Only the first ${MAX_ATTACHMENT_CHARS.toLocaleString()} characters of ${file.name} will be used.`);
      }
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
  // The link opens this conversation for anyone signed in to the same workspace.
  const handleShare = () => {
    if (typeof window === "undefined") return;
    if (!activeSessionId) {
      toast("Nothing to share yet.");
      return;
    }
    const link = `${window.location.origin}/dashboard/ask-corely?session=${encodeURIComponent(activeSessionId)}`;
    navigator.clipboard.writeText(link).then(
      () => toast("Link copied. People in your workspace can open this conversation."),
      () => toast("Could not copy the link."),
    );
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
    toast("Conversation exported as Markdown.");
  };

  // ─── Export one answer (question, answer and sources) as Markdown ────────────
  const handleExportMessage = (msg: ChatMessage) => {
    const lines: string[] = [
      `# Corely answer`,
      `_Exported: ${new Date().toLocaleString()}_`,
      "",
    ];
    if (msg.query) {
      lines.push("## Question", msg.query, "");
    }
    lines.push(`## Answer (${msg.timestamp})`, msg.text, "");
    if (msg.sources && msg.sources.length > 0) {
      lines.push("## Sources");
      msg.sources.forEach((src, i) => {
        const freshness = src.confidenceLabel ? ` — ${src.confidenceLabel} (${src.confidenceScore ?? ""}%)` : "";
        lines.push(`${i + 1}. ${src.url ? `[${src.title}](${src.url})` : src.title}${freshness}`);
      });
      lines.push("");
    }

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `corely-answer-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Answer exported as Markdown.");
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
      toast("Saved to workspace memory.");
    } catch (err) {
      console.error("Save to memory failed:", err);
      toast("Failed to save to memory. Try again.");
    }
  };

  // ─── Feedback ─────────────────────────────────────────────────────────────────
  const handleFeedback = async (messageId: string, feedbackType: "positive" | "negative") => {
    if (!activeSessionId || messageId.startsWith(TEMP_ID_PREFIX)) return;

    const targetMsg = messages.find((m) => m.id === messageId);
    const previousFeedback = targetMsg?.feedback ?? null;
    const newFeedback = previousFeedback === feedbackType ? null : feedbackType;

    // Optimistic update
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, feedback: newFeedback } : msg))
    );

    try {
      const res = await fetch(
        `/api/chats/${activeSessionId}/messages/${messageId}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback: newFeedback }),
        }
      );

      if (!res.ok) throw new Error("Failed to record feedback");

      if (newFeedback === "positive") toast("Thanks for the positive feedback.");
      else if (newFeedback === "negative") toast("Thanks. We'll keep improving.");
    } catch (err) {
      console.error("Error recording feedback:", err);
      // Put the thumbs back the way they were, since nothing was saved.
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, feedback: previousFeedback } : msg))
      );
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
      id: `${TEMP_ID_PREFIX}user-${Date.now()}`,
      sender: "user",
      text: promptText, // Show clean text in UI
      timestamp,
    };

    // Swapped for the saved message id when the server sends "message_id".
    let corelyMsgId = `${TEMP_ID_PREFIX}corely-${Date.now()}`;
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
              const doneId = corelyMsgId;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === doneId
                    ? { ...msg, isStreaming: false, text: msg.text || "No answer was returned. Try asking again." }
                    : msg
                )
              );
              onNewMessage();
            } else {
              try {
                const parsed = JSON.parse(dataStr) as {
                  type: "sources" | "text" | "no_knowledge" | "error" | "message_id";
                  sources?: SourceInfo[];
                  text?: string;
                  message?: string;
                  id?: string;
                };
                const targetId = corelyMsgId;
                if (parsed.type === "sources") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === targetId ? { ...msg, sources: parsed.sources, sourcesReceived: true } : msg
                    )
                  );
                } else if (parsed.type === "message_id" && parsed.id) {
                  // Use the saved id so feedback reaches the real message.
                  const savedId = parsed.id;
                  setMessages((prev) =>
                    prev.map((msg) => (msg.id === targetId ? { ...msg, id: savedId } : msg))
                  );
                  corelyMsgId = savedId;
                } else if (parsed.type === "no_knowledge") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === targetId ? { ...msg, text: parsed.text ?? "" } : msg
                    )
                  );
                } else if (parsed.type === "error") {
                  const reason = parsed.message ?? "Corely could not answer.";
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === targetId ? { ...msg, text: msg.text ? `${msg.text}\n\n_${reason}_` : reason } : msg
                    )
                  );
                } else if (parsed.type === "text") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === targetId
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
      const failedId = corelyMsgId;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === failedId
            ? { ...msg, text: `Corely was unable to answer your query. Reason: ${errMsg}`, isStreaming: false }
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
    // "ac-main" uses display: contents, so the header, thread and composer
    // below sit straight in the page grid set up in ask-corely.css.
    <div className="ac-main">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.csv,.json"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="ac-toast"
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
          >
            <CheckCircle2 size={16} />
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <PageHeader
        className="ac-header"
        title="Ask Corely"
        subtitle="Your AI partner for company intelligence."
        actions={
          <>
            {/* Export conversation button */}
            {messages.length > 0 && (
              <button
                type="button"
                className="ui-btn ui-btn--secondary"
                onClick={handleExport}
                title="Export conversation as Markdown"
              >
                <Download size={16} />
                Export
              </button>
            )}
            {/* Show or hide the context panel so the chat can use the full width */}
            {onToggleContext && (
              <button
                type="button"
                className="ui-icon-btn ac-context-toggle"
                onClick={onToggleContext}
                aria-pressed={!contextOpen}
                aria-label={contextOpen ? "Hide context panel" : "Show context panel"}
                title={contextOpen ? "Hide context panel" : "Show context panel"}
              >
                {contextOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
              </button>
            )}
            {/* New conversation: clears the active session, same as before */}
            <button
              type="button"
              className="ui-btn ui-btn--primary"
              onClick={() => setActiveSessionId(null)}
            >
              <Plus size={16} />
              New conversation
            </button>
          </>
        }
      />

      {/* Chat Thread & Scroll Lane */}
      <div className="ac-thread">
        <div
          className="ac-thread-scroll"
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="ac-thread-inner">
            {messages.map((msg) => {
              if (msg.sender === "user") {
                return (
                  <div key={msg.id} className="ac-msg-user">
                    <div className="ac-user-bubble">{msg.text}</div>
                    <span className="type-caption ac-msg-time">{msg.timestamp}</span>
                  </div>
                );
              }

              // Corely Response
              return (
                <div key={msg.id} className="ac-response-card">
                  <span className="ac-avatar" aria-hidden="true">
                    <CorelyLogo size={18} />
                  </span>

                  <div className="ac-response-body">
                    {/* Response Header */}
                    <div className="ac-response-header">
                      <span className="ac-response-title">Corely</span>
                      <span className="type-caption">{msg.timestamp}</span>
                    </div>

                    {/* Response Body */}
                    <div className="ac-response-context">
                      {msg.text ? (
                        <div className="ac-md">
                          <ReactMarkdown
                            components={{
                              // eslint-disable-next-line @typescript-eslint/no-unused-vars
                              a: ({ node: _node, ...props }) => {
                                const href = props.href || "";
                                if (href.startsWith("#source-")) {
                                  const sourceId = href.replace("#source-", "");
                                  return (
                                    <a
                                      href={`#ref-${msg.id}-${sourceId}`}
                                      className="ac-cite"
                                      title="Jump to source"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        const el = document.getElementById(`ref-${msg.id}-${sourceId}`);
                                        if (el) {
                                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                                          el.style.boxShadow = "0 0 0 2px var(--accent-fill), 0 0 0 6px var(--accent-wash)";
                                          setTimeout(() => { el.style.boxShadow = "none"; }, 1500);
                                        }
                                      }}
                                    >
                                      {sourceId}
                                    </a>
                                  );
                                }
                                return <a {...props} target="_blank" rel="noopener noreferrer" />;
                              },
                            }}
                          >
                            {msg.text.replace(/\[(\d+)\]/g, " [[$1]](#source-$1) ")}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <ThinkingState sources={msg.sources} sourcesReceived={msg.sourcesReceived} />
                      )}
                    </div>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="ac-r-source-wrap">
                        <span className="ac-r-source-label">
                          Sources &amp; temporal confidence
                          <span className="ui-badge">{msg.sources.length}</span>
                        </span>
                        <div className="ac-source-grid">
                          {msg.sources.map((src, i) => (
                            <a
                              key={i}
                              id={`ref-${msg.id}-${i + 1}`}
                              href={src.url || "#"}
                              target={src.url ? "_blank" : "_self"}
                              rel="noopener noreferrer"
                              className="ac-r-source-badge"
                              title={src.title}
                            >
                              <span className="ac-source-num">{i + 1}</span>
                              <span className="ac-source-main">
                                <span className="ac-source-title">{src.title}</span>
                                <span className="ac-source-meta">
                                  <span className="ac-source-type">
                                    <SourceLogo type={src.type} size={14} tile={false} />
                                    {formatSourceType(src.type)}
                                  </span>
                                  {src.confidenceLabel && (
                                    <StatusBadge tone={toneForConfidence(src.confidenceLabel)}>
                                      {src.confidenceLabel} · {src.confidenceScore}%
                                    </StatusBadge>
                                  )}
                                </span>
                              </span>
                              {src.url && <ExternalLink size={14} className="ac-source-ext" />}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Response Actions */}
                    {!msg.isStreaming && msg.text && (
                      <div className="ac-response-footer">
                        <div className="ac-footer-actions">
                          {/* Copy with success flash */}
                          <button
                            type="button"
                            className={`ui-btn ui-btn--ghost ui-btn--sm ac-action-btn${copiedMessageId === msg.id ? " is-copied" : ""}`}
                            onClick={() => handleCopy(msg.text, msg.id)}
                          >
                            {copiedMessageId === msg.id ? (
                              <><Check size={16} /> Copied</>
                            ) : (
                              <><Copy size={16} /> Copy</>
                            )}
                          </button>

                          {/* Share */}
                          <button
                            type="button"
                            className="ui-btn ui-btn--ghost ui-btn--sm ac-action-btn"
                            onClick={handleShare}
                          >
                            <Share2 size={16} /> Share
                          </button>

                          {/* Save to memory — real API */}
                          <button
                            type="button"
                            className="ui-btn ui-btn--ghost ui-btn--sm ac-action-btn"
                            onClick={() => void handleSaveToMemory(msg)}
                          >
                            <BookmarkPlus size={16} /> Save to memory
                          </button>

                          {/* Export this answer only */}
                          <button
                            type="button"
                            className="ui-btn ui-btn--ghost ui-btn--sm ac-action-btn"
                            onClick={() => handleExportMessage(msg)}
                            title="Export this question, answer and sources as Markdown"
                          >
                            <Download size={16} /> Export
                          </button>
                        </div>

                        <div className="ac-feedback">
                          <span className="type-caption ac-feedback-label">Was this helpful?</span>
                          <button
                            type="button"
                            className="ui-icon-btn ui-icon-btn--sm ac-feedback-btn"
                            aria-label="Thumbs up"
                            aria-pressed={msg.feedback === "positive"}
                            disabled={msg.id.startsWith(TEMP_ID_PREFIX)}
                            title={msg.id.startsWith(TEMP_ID_PREFIX) ? "Feedback works once the answer is saved" : undefined}
                            onClick={() => void handleFeedback(msg.id, "positive")}
                          >
                            <ThumbsUp size={16} fill={msg.feedback === "positive" ? "currentColor" : "none"} />
                          </button>
                          <button
                            type="button"
                            className="ui-icon-btn ui-icon-btn--sm ac-feedback-btn"
                            aria-label="Thumbs down"
                            aria-pressed={msg.feedback === "negative"}
                            disabled={msg.id.startsWith(TEMP_ID_PREFIX)}
                            title={msg.id.startsWith(TEMP_ID_PREFIX) ? "Feedback works once the answer is saved" : undefined}
                            onClick={() => void handleFeedback(msg.id, "negative")}
                          >
                            <ThumbsDown size={16} fill={msg.feedback === "negative" ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Placeholder while an old conversation loads */}
            {messages.length === 0 && loading && (
              <div className="ac-history-loading" aria-hidden="true">
                <div className="ui-skeleton ac-skel-bubble" />
                <div className="ui-skeleton" style={{ width: "85%" }} />
                <div className="ui-skeleton" style={{ width: "70%" }} />
                <div className="ui-skeleton" style={{ width: "50%" }} />
              </div>
            )}

            {/* Empty state with preset prompts */}
            {messages.length === 0 && !loading && (
              <div className="ui-empty ac-empty">
                <span className="ui-icon-well ui-icon-well--lg ui-icon-well--accent">
                  <Sparkles />
                </span>
                <h2 className="type-heading">Ask anything about your company</h2>
                <p className="type-subtitle ui-empty__text">
                  Corely&#39;s semantic brain indexes all your connected sources and responds with citation-backed intelligence.
                </p>

                {/* Preset prompt grid */}
                <div className="ac-prompts-grid">
                  {PRESET_PROMPTS.map((p) => (
                    <button
                      key={p.text}
                      type="button"
                      className="ac-prompt-card"
                      onClick={() => void handleSubmit(undefined, p.text)}
                    >
                      <span className="ac-prompt-icon">{p.icon}</span>
                      <span className="ac-prompt-text">{p.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="ac-composer-form">
        <div className="ac-input-wrapper">
          {/* Attached file chip */}
          <AnimatePresence>
            {attachedFile && (
              <motion.div
                className="ac-input-chips"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="ac-input-chips-inner">
                  <span className="ac-chip">
                    <FileText size={12} />
                    <span className="ac-chip-label">{attachedFile.name}</span>
                    <button
                      type="button"
                      className="ac-chip-remove"
                      aria-label="Remove attached file"
                      onClick={handleRemoveFile}
                    >
                      <X size={12} />
                    </button>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            ref={textareaRef}
            className="ac-input-field"
            aria-label="Ask Corely"
            placeholder="Ask anything about your company... (Shift+Enter for new line)"
            rows={1}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="ac-input-actions">
            <div className="ac-input-tools">
              {/* File Attachment */}
              <button
                type="button"
                className={`ui-btn ui-btn--ghost ac-tool-btn${attachedFile ? " is-active" : ""}`}
                aria-label="Attach file"
                title="Attach a text file (.txt, .md, .csv, .json) as context. Upload PDF or Word files in Sources."
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={16} />
              </button>
            </div>

            <button
              type="submit"
              className="ui-btn ui-btn--primary ac-submit-btn"
              aria-label="Submit prompt"
              disabled={!query.trim() || loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
