"use client";
import { motion } from "framer-motion";
import { Building2, Sparkles, Bell, ChevronDown, Command } from "lucide-react";

export default function Topbar() {
  return (
    <motion.header
      className="w-[calc(100%-240px)] ml-[240px] fixed top-0 right-0 h-[64px] border-b border-[#f1f1f1] bg-white/95 backdrop-blur-md flex items-center justify-between px-8 z-40 font-sans"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Workspace Switcher */}
      <button className="flex items-center gap-2 border border-[#f1f1f1] hover:border-gray-200 px-3.5 py-1.5 rounded-xl text-[14px] font-semibold text-[#111111] transition-all bg-white hover:bg-gray-50/50 cursor-pointer shadow-sm shadow-gray-100/50">
        <Building2 size={14} className="text-[#6b7280]" />
        <span className="max-w-[130px] truncate">Corely Enterprise</span>
        <ChevronDown size={13} className="text-[#9ca3af]" />
      </button>

      {/* AI Search Bar */}
      <div className="w-[460px] bg-[#fafafa] border border-[#f1f1f1] hover:border-gray-200 px-4 py-2 rounded-xl flex items-center justify-between text-[14px] text-[#6b7280] shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] cursor-text transition-all group">
        <div className="flex items-center gap-2.5">
          <Sparkles size={15} className="text-[#ff6b00] shrink-0" />
          <span className="font-medium text-[#6b7280] group-hover:text-gray-500 transition-colors select-none">
            Ask anything about your company...
          </span>
        </div>
        <div className="flex items-center gap-0.5 px-2 py-0.5 bg-white border border-[#f1f1f1] rounded-lg text-[10px] font-bold text-[#6b7280] shadow-sm select-none">
          <Command size={10} />
          <span>K</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Notification */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-[#6b7280] hover:text-[#111111] hover:bg-gray-50 border border-transparent hover:border-[#f1f1f1] transition-all cursor-pointer">
          <Bell size={16} />
          <span className="absolute top-[5px] right-[5px] w-4.5 h-4.5 bg-[#ff6b00] border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white leading-none shadow-sm shadow-[#ff6b00]/30">
            3
          </span>
        </button>

        {/* AI Status */}
        <div className="border border-[#f1f1f1] rounded-full px-3.5 py-1 flex items-center gap-2.5 bg-white shadow-sm">
          <div className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[12px] font-bold text-[#111111] leading-tight">Corely AI</span>
            <span className="text-[9px] font-black text-green-500 uppercase tracking-wider leading-none">
              Active
            </span>
          </div>
        </div>

        {/* Avatar */}
        <img
          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=80&auto=format&fit=crop"
          alt="User Profile"
          className="w-9 h-9 rounded-full object-cover border border-[#f1f1f1] cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02]"
        />
      </div>
    </motion.header>
  );
}
