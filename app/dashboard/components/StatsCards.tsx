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
  { icon: Brain, value: 12, label: "Critical Insights", trend: "↑ 3 vs yesterday", delay: 0.05 },
  { icon: Zap, value: 8, label: "Pending Actions", trend: "↑ 2 vs yesterday", delay: 0.1 },
  { icon: PieChart, value: 94, suffix: "%", label: "Knowledge Coverage", trend: "↑ 5% vs last week", delay: 0.15 },
  { icon: ShieldAlert, value: 3, label: "Emerging Risks", trend: "↑ 1 vs yesterday", delay: 0.2 },
];

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const steps = 30;
    const increment = target / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCurrent(Math.min(Math.round(increment * step), target));
      if (step >= steps) clearInterval(timer);
    }, 900 / steps);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <>
      {current}
      {suffix}
    </>
  );
}

export default function StatsCards() {
  return (
    <div className="db-stats-grid">
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          className="db-stat-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: stat.delay, duration: 0.4, ease: "easeOut" }}
          whileHover={{ y: -2 }}
        >
          <div className="db-stat-left">
            <div className="db-stat-icon">
              <stat.icon size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="db-stat-num">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="db-stat-label">{stat.label}</div>
              <div className="db-stat-trend">
                <TrendingUp size={11} />
                {stat.trend}
              </div>
            </div>
          </div>
          <ChevronRight size={15} style={{ color: "#d4d4d4", flexShrink: 0 }} />
        </motion.div>
      ))}
    </div>
  );
}
