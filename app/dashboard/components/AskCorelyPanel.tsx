"use client";
import { motion } from "framer-motion";
import { Sparkles, MoreHorizontal, X, Search, Paperclip, SendHorizontal } from "lucide-react";
import { useState } from "react";

const prompts = [
  "What changed across product teams this week?",
  "Summarize key blockers",
  "Show customer sentiment trends",
];

const initialMessages = [
  {
    role: "ai" as const,
    text: "Hi Krishil! I'm Corely. Your enterprise intelligence layer. How can I help you today?",
  },
];

export default function AskCorelyPanel() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [userMsg, setUserMsg] = useState("");

  const handlePrompt = (prompt: string) => {
    setUserMsg(prompt);
  };

  const handleSend = () => {
    if (!input.trim() && !userMsg) return;
    const text = input || userMsg;
    setMessages((prev) => [...prev, { role: "ai", text: "Let me look into that for you..." }]);
    setInput("");
    setUserMsg("");
  };

  return (
    <motion.div
      className="bg-white border border-[#f1f1f1] rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col h-[480px] p-6 font-sans relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all duration-300"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#f1f1f1] mb-4">
        <span className="flex items-center gap-2 text-[15px] font-bold text-[#111111]">
          <Sparkles size={14} className="text-[#ff6b00]" />
          Ask Corely
        </span>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111111] hover:bg-gray-50 transition-colors cursor-pointer" aria-label="More options">
            <MoreHorizontal size={15} />
          </button>
          <button className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111111] hover:bg-gray-50 transition-colors cursor-pointer" aria-label="Close">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Chat body */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 mb-4 scrollbar-none">
        {/* AI greeting */}
        <motion.div
          className="flex gap-3 text-left"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="w-7 h-7 rounded-lg bg-[#ff6b00] flex items-center justify-center font-black text-white text-[13px] shadow-sm shadow-[#ff6b00]/20 shrink-0">
            C
          </div>
          <div className="bg-[#fafafa] border border-[#f1f1f1] rounded-2xl px-4 py-3 text-[14px] text-[#111111] font-semibold leading-relaxed max-w-[85%]">
            {initialMessages[0].text}
          </div>
        </motion.div>

        {/* User message */}
        {userMsg && (
          <motion.div
            className="flex justify-end pl-10"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-[#fff3ee] border border-[#ff6b00]/10 text-[#ff6b00] rounded-2xl px-4 py-3 text-[14px] font-semibold leading-relaxed">
              {userMsg}
            </div>
          </motion.div>
        )}

        {/* Suggested prompts */}
        <motion.div
          className="flex flex-col gap-2 mt-2 pl-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {prompts.map((prompt) => (
            <button
              key={prompt}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-[#f1f1f1] hover:border-gray-200 hover:bg-gray-50 text-[13px] font-semibold text-[#111111] rounded-xl transition-all cursor-pointer text-left shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
              onClick={() => handlePrompt(prompt)}
            >
              <Search size={12} className="text-[#9ca3af] shrink-0" />
              <span className="truncate">{prompt}</span>
            </button>
          ))}
        </motion.div>
      </div>

      {/* Input footer */}
      <div className="mt-auto flex items-center gap-2.5 bg-[#fafafa] border border-[#f1f1f1] hover:border-gray-200 focus-within:border-gray-300 rounded-xl px-4 py-2.5 transition-all">
        <Paperclip size={14} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0" />
        <input
          className="flex-1 bg-transparent border-none text-[14px] text-[#111111] placeholder-gray-400 focus:outline-none font-medium"
          placeholder="Ask a follow-up..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          aria-label="Ask a follow-up question"
        />
        <button
          className="w-7 h-7 rounded-lg bg-[#ff6b00] hover:bg-[#e54e00] text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm shadow-[#ff6b00]/25"
          onClick={handleSend}
          aria-label="Send message"
        >
          <SendHorizontal size={13} />
        </button>
      </div>
    </motion.div>
  );
}
