"use client";
import StatsCards from "./components/StatsCards";
import AskCorelyPanel from "./components/AskCorelyPanel";
import IntelligenceCore from "./components/IntelligenceCore";
import InsightsPanel from "./components/InsightsPanel";
import AutonomousActions from "./components/AutonomousActions";
import { Calendar, ChevronDown } from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-white bg-tech-grid p-8 flex flex-col gap-6 relative select-none font-sans">
      {/* Dynamic light glows in background */}
      <div className="absolute left-1/4 top-1/4 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-[#ff6b00]/3 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-[#ff6b00]/2 rounded-full blur-[80px] pointer-events-none" />

      {/* Greeting Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
        <div className="text-left">
          <h1 className="text-[38px] md:text-[58px] font-black tracking-tight leading-[1.02] text-[#111111]">
            Good morning, Krishil 👋
          </h1>
          <p className="text-[15px] font-medium text-[#6b7280] mt-1.5">
            Here’s what Corely discovered across your organization today.
          </p>
        </div>
        
        {/* Date picker */}
        <button className="self-start md:self-auto flex items-center gap-2.5 bg-white border border-[#f1f1f1] px-4 py-2 rounded-xl text-[13px] font-bold text-[#111111] shadow-[0_2px_6px_rgba(0,0,0,0.01)] hover:border-gray-200 transition-colors select-none cursor-pointer">
          <Calendar size={14} className="text-[#6b7280] shrink-0" />
          <span>May 12, 2025</span>
          <ChevronDown size={14} className="text-[#9ca3af] shrink-0" />
        </button>
      </div>

      {/* Stat Cards Row */}
      <StatsCards />

      {/* Main 3-column bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-6 relative z-10">
        <AskCorelyPanel />
        <IntelligenceCore />
        <InsightsPanel />
      </div>

      {/* Autonomous Actions Timeline */}
      <AutonomousActions />
    </main>
  );
}
