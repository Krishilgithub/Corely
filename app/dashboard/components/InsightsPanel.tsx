"use client";
import { motion } from "framer-motion";
import { ChevronRight, TrendingDown, Code, DollarSign, Users, CheckCircle2, RefreshCw } from "lucide-react";

interface Insight {
  priority: "High" | "Medium" | "Low";
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  source: string;
  time: string;
}

const insights: Insight[] = [
  {
    priority: "High",
    icon: TrendingDown,
    iconBg: "#fef2f2",
    iconColor: "#ef4444",
    title: "Customer churn risk increased",
    desc: "Churn risk has increased by 18% in the last 7 days driven by 3 key accounts.",
    source: "Salesforce",
    time: "2 min ago",
  },
  {
    priority: "High",
    icon: Code,
    iconBg: "#fff1f1",
    iconColor: "#dc2626",
    title: "Engineering bottleneck detected",
    desc: "API team is a blocking dependency for 12 projects.",
    source: "Jira",
    time: "15 min ago",
  },
  {
    priority: "Medium",
    icon: DollarSign,
    iconBg: "#fffbeb",
    iconColor: "#f59e0b",
    title: "Revenue anomaly identified",
    desc: "Mid-market segment revenue dropped by 7% this week.",
    source: "Looker",
    time: "34 min ago",
  },
  {
    priority: "Low",
    icon: Users,
    iconBg: "#f0fdf4",
    iconColor: "#22c55e",
    title: "Cross-team dependency alert",
    desc: "Design handoff delay affecting product launch timeline.",
    source: "Notion",
    time: "1 hr ago",
  },
];

export default function InsightsPanel() {
  return (
    <motion.div
      className="bg-white border border-[#f1f1f1] rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col h-[480px] p-6 font-sans relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all duration-300"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#f1f1f1] mb-4">
        <span className="text-[15px] font-bold text-[#111111]">Insights</span>
        <a href="#" className="text-[13px] font-semibold text-[#ff6b00] hover:text-[#e54e00] transition-colors">
          View all
        </a>
      </div>

      {/* Insight cards */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 mb-4 scrollbar-none">
        {insights.map((ins, i) => (
          <motion.div
            key={i}
            className="flex gap-3 bg-white border border-[#f1f1f1] hover:border-gray-200 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.35 }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-transparent"
              style={{ backgroundColor: ins.iconBg }}
            >
              <ins.icon size={16} color={ins.iconColor} strokeWidth={2.2} />
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                    ins.priority === "High"
                      ? "bg-red-50 text-red-500 border-red-500/10"
                      : ins.priority === "Medium"
                      ? "bg-amber-50 text-amber-600 border-amber-500/10"
                      : "bg-emerald-50 text-emerald-600 border-emerald-500/10"
                  }`}
                >
                  {ins.priority}
                </span>
              </div>
              <div className="text-[13px] font-bold text-[#111111] leading-tight mb-1 truncate">
                {ins.title}
              </div>
              <div className="text-[12px] font-medium text-[#6b7280] leading-snug mb-2 break-words">
                {ins.desc}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#9ca3af] font-semibold">
                <span>{ins.source}</span>
                <span>•</span>
                <span>{ins.time}</span>
              </div>
            </div>
            
            <ChevronRight size={14} className="text-gray-300 hover:text-gray-500 shrink-0 self-start mt-0.5" />
          </motion.div>
        ))}
      </div>

      {/* System Status Section */}
      <div className="border-t border-[#f1f1f1] pt-4 mt-auto flex flex-col gap-2">
        <div className="text-[10px] font-black text-[#9ca3af] uppercase tracking-[1px] text-left">
          System Status
        </div>
        <div className="flex items-center gap-2 text-[13px] font-bold text-[#111111] text-left">
          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
          <span className="text-emerald-600">All systems operational</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[#6b7280] font-semibold text-left">
          <RefreshCw size={12} className="text-gray-400 shrink-0" />
          <span>Data synced 2 min ago</span>
        </div>
      </div>
    </motion.div>
  );
}
