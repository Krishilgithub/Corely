"use client";
import { motion } from "framer-motion";
import {
  Home, MessageSquare, Brain, BarChart2, Zap,
  Link2, Users, GitBranch, Shield, Settings, ChevronDown
} from "lucide-react";

const navItems = [
  { icon: Home,          label: "Home",       active: true  },
  { icon: MessageSquare, label: "Ask Corely", active: false },
  { icon: Brain,         label: "Memory",     active: false },
  { icon: BarChart2,     label: "Insights",   active: false },
  { icon: Zap,           label: "Actions",    active: false },
  { icon: Link2,         label: "Sources",    active: false },
  { icon: Users,         label: "Teams",      active: false },
  { icon: GitBranch,     label: "Workflows",  active: false },
  { icon: Shield,        label: "Security",   active: false },
  { icon: Settings,      label: "Settings",   active: false },
];

export default function Sidebar() {
  return (
    <aside className="w-[240px] fixed left-0 top-0 h-screen border-r border-[#f1f1f1] bg-white flex flex-col justify-between py-6 px-4 z-50 font-sans">
      <div>
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 px-2 mb-6 select-none group">
          <div className="w-9 h-9 bg-[#ff6b00] rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md shadow-[#ff6b00]/25 transition-transform group-hover:scale-105">
            C
          </div>
          <span className="text-xl font-bold tracking-tight text-[#111111]">
            Corely
          </span>
        </a>

        {/* Navigation */}
        <nav className="flex flex-col gap-1" aria-label="Dashboard navigation">
          {navItems.map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.3, ease: "easeOut" }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 cursor-pointer ${
                item.active
                  ? "bg-[#fff3ee] text-[#ff6b00] font-semibold"
                  : "text-[#6b7280] hover:text-[#111111] hover:bg-gray-50"
              }`}
              aria-current={item.active ? "page" : undefined}
            >
              <item.icon size={16} className={`shrink-0 ${item.active ? "text-[#ff6b00]" : "text-[#6b7280]"}`} />
              {item.label}
            </motion.button>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-5">
        {/* Enterprise Plan Card */}
        <motion.div
          className="border border-[#f1f1f1] rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] bg-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <div className="text-[13px] font-bold text-[#ff6b00] mb-0.5">Enterprise Plan</div>
          <div className="text-[14px] font-semibold text-[#111111] mb-3">Unlimited insights</div>
          
          <div className="flex items-center justify-between text-[12px] text-[#6b7280] mb-1.5 font-medium">
            <span>Usage this month</span>
            <span className="font-semibold text-[#111111]">78%</span>
          </div>
          
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#ff6b00] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "78%" }}
              transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* User Card */}
        <motion.div
          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-[#f1f1f1]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=80&auto=format&fit=crop"
              alt="Krishil Shah"
              className="w-9 h-9 rounded-full object-cover border border-[#f1f1f1]"
            />
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-[#111111] leading-tight">Krishil Shah</span>
              <span className="text-[12px] text-[#6b7280] font-medium">Admin</span>
            </div>
          </div>
          <ChevronDown size={14} className="text-[#9ca3af] shrink-0" />
        </motion.div>
      </div>
    </aside>
  );
}
