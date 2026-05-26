"use client";
import { motion } from "framer-motion";
import { Brain, Zap, PieChart, ShieldAlert, ChevronRight, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface StatCard {
  icon: React.ElementType;
  value: number;
  suffix?: string;
  label: string;
  trend: string;
  delay: number;
}

const stats: StatCard[] = [
  {
    icon: Brain,
    value: 12,
    label: "Critical Insights",
    trend: "↑ 3 vs yesterday",
    delay: 0.1,
  },
  {
    icon: Zap,
    value: 8,
    label: "Pending Actions",
    trend: "↑ 2 vs yesterday",
    delay: 0.2,
  },
  {
    icon: PieChart,
    value: 94,
    suffix: "%",
    label: "Knowledge Coverage",
    trend: "↑ 5% vs last week",
    delay: 0.3,
  },
  {
    icon: ShieldAlert,
    value: 3,
    label: "Emerging Risks",
    trend: "↑ 1 vs yesterday",
    delay: 0.4,
  },
];

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const duration = 800;
    const steps = 25;
    const increment = target / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCurrent(Math.min(Math.round(increment * step), target));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return <>{current}{suffix}</>;
}

export default function StatsCards() {
  return (
    <div className="grid grid-cols-4 gap-6 mb-6 font-sans">
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          className="bg-white border border-[#f1f1f1] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex items-center justify-between relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: stat.delay, duration: 0.45, ease: "easeOut" }}
        >
          {/* Accent glow on hover */}
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-[#ff6b00]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="flex items-center gap-4.5">
            {/* Orange circular icon container */}
            <div className="w-[48px] h-[48px] rounded-full bg-[#ff6b00] flex items-center justify-center text-white shrink-0 shadow-sm shadow-[#ff6b00]/20 group-hover:scale-105 transition-transform duration-300">
              <stat.icon size={20} strokeWidth={2.2} />
            </div>
            
            <div className="flex flex-col text-left">
              <div className="text-[44px] font-extrabold text-[#111111] leading-none tracking-tight">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-[14px] font-bold text-[#6b7280] leading-snug mt-0.5">
                {stat.label}
              </div>
              <div className="text-[12px] font-bold text-[#22c55e] flex items-center gap-1 mt-1 leading-none">
                <TrendingUp size={12} className="shrink-0" />
                <span>{stat.trend}</span>
              </div>
            </div>
          </div>
          
          <ChevronRight size={16} className="text-[#d1d5db] group-hover:text-[#6b7280] transition-colors shrink-0" />
        </motion.div>
      ))}
    </div>
  );
}
