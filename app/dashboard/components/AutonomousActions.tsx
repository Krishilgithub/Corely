"use client";
import { motion } from "framer-motion";

interface Action {
  time: string;
  icon: React.ReactNode;
  iconBg: string;
  desc: string;
  source: string;
}

function ZoomIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#2D8CFF" />
      <rect x="5" y="8" width="10" height="8" rx="2" fill="white" />
      <path d="M15 11l4-2.8v7.6l-4-2.8v-2z" fill="white" />
    </svg>
  );
}

function SalesforceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#00A1E0" />
      <path d="M19 12.5c0-1.5-1.2-2.7-2.8-2.7-.3 0-.5 0-.8.1C14.8 8.6 13.2 7.3 11.3 7.3 8.5 7.3 6.2 9.6 6.2 12.4c0 .2 0 .3.1.5-1.6.8-2.7 2.2-2.7 3.9 0 2.1 1.6 3.7 3.7 3.7H19c2.1 0 3.7-1.6 3.7-3.7 0-2.1-1.6-3.7-3.7-3.7" fill="white" />
    </svg>
  );
}

function WorkflowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#ff6b00" />
      <circle cx="7" cy="12" r="2.5" stroke="white" strokeWidth="2" fill="none" />
      <circle cx="17" cy="7" r="2.5" stroke="white" strokeWidth="2" fill="none" />
      <circle cx="17" cy="17" r="2.5" stroke="white" strokeWidth="2" fill="none" />
      <path d="M9.5 11l5-3M9.5 13l5 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#EA4335" />
      <path d="M5 8.5v8h14v-8l-7 5.5-7-5.5z" fill="white" />
      <path d="M5 7.5h14v1.5l-7 5.5-7-5.5V7.5z" fill="#C5221F" />
    </svg>
  );
}

const actions: Action[] = [
  {
    time: "9:15 AM",
    icon: <ZoomIcon />,
    iconBg: "#eff8ff",
    desc: "Generated meeting summary",
    source: "Zoom • Completed",
  },
  {
    time: "9:07 AM",
    icon: <SalesforceIcon />,
    iconBg: "#eff8ff",
    desc: "Updated CRM records",
    source: "Salesforce • Completed",
  },
  {
    time: "8:52 AM",
    icon: <WorkflowIcon />,
    iconBg: "#fff3ee",
    desc: "Triggered follow-up workflow",
    source: "Corely Workflow • Completed",
  },
  {
    time: "8:45 AM",
    icon: <GmailIcon />,
    iconBg: "#fff5f5",
    desc: "Created executive digest",
    source: "Email • Completed",
  },
];

export default function AutonomousActions() {
  return (
    <motion.div
      className="bg-white border border-[#f1f1f1] rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.01)] p-6 font-sans relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all duration-300"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.45, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#f1f1f1] mb-6">
        <span className="text-[15px] font-bold text-[#111111]">Autonomous Actions</span>
        <a href="#" className="text-[13px] font-semibold text-[#ff6b00] hover:text-[#e54e00] transition-colors">
          View all actions
        </a>
      </div>

      {/* Horizontal actions list */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        {actions.map((action, i) => (
          <div key={i} className="flex items-center relative">
            <motion.div
              className="w-full flex items-center gap-4 bg-white border border-[#f1f1f1] hover:border-gray-200 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-sm transition-all duration-200 cursor-pointer relative z-10 text-left"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 + i * 0.08, duration: 0.35 }}
            >
              {/* Icon wrap */}
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100/50"
                style={{ backgroundColor: action.iconBg }}
              >
                {action.icon}
              </div>

              {/* Action content */}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-[#6b7280] mb-0.5">{action.time}</div>
                <div className="text-[13px] font-bold text-[#111111] leading-tight mb-1.5 truncate group-hover:text-[#ff6b00] transition-colors">
                  {action.desc}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#6b7280] font-semibold">
                  <span>{action.source.split(" • ")[0]}</span>
                  <span>•</span>
                  <span className="text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-500/10 text-[9px] font-black uppercase tracking-wide shrink-0">
                    Completed
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Connecting dot and line to next card */}
            {i < actions.length - 1 && (
              <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 items-center z-0 w-7">
                <div className="h-[1px] w-full border-t border-dashed border-gray-200" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <div className="h-[1px] w-full border-t border-dashed border-gray-200" />
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
