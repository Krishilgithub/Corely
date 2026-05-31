"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Database, Shield, Search, Workflow, BrainCircuit } from "lucide-react";
import { cn } from "../../lib/utils";

const features = [
  {
    title: "Unified Knowledge Graph",
    description: "Corely connects to all your tools—Slack, Drive, Notion, GitHub—and builds a real-time organizational brain that understands deep semantic context.",
    icon: <Database className="w-6 h-6 text-[#ff6b00]" />,
    className: "md:col-span-2 md:row-span-2 min-h-[300px]",
    visual: (
      <div className="absolute right-0 bottom-0 w-[80%] h-[80%] pointer-events-none flex flex-col gap-4 justify-end items-end p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.1),transparent_70%)] blur-[40px] -z-10" />
        
        {/* Floating Abstract UI Card 1 */}
        <div className="w-[110%] bg-white rounded-xl shadow-xl border border-black/5 p-4 flex gap-4 transform translate-x-12 translate-y-6 rotate-[-2deg]">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 border border-black/5">
             <Database className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="flex-1 flex flex-col gap-2.5 justify-center">
            <div className="h-3 w-1/3 bg-zinc-200 rounded-full" />
            <div className="h-2 w-full bg-zinc-100 rounded-full" />
            <div className="h-2 w-5/6 bg-zinc-100 rounded-full" />
          </div>
        </div>

        {/* Floating Abstract UI Card 2 */}
        <div className="w-[100%] bg-white rounded-xl shadow-2xl border border-black/5 p-5 flex gap-4 transform translate-x-4 rotate-[1deg] z-10 relative">
          <div className="absolute top-0 right-4 -translate-y-1/2 px-2 py-0.5 bg-[#ff6b00] text-white text-[9px] font-bold uppercase tracking-wider rounded-full shadow-sm">
            Semantic Match
          </div>
          <div className="w-12 h-12 rounded-full bg-[#ff6b00]/10 flex items-center justify-center shrink-0 border border-[#ff6b00]/20">
             <BrainCircuit className="w-6 h-6 text-[#ff6b00]" />
          </div>
          <div className="flex-1 flex flex-col gap-2.5">
            <div className="h-3.5 w-1/2 bg-zinc-800 rounded-full" />
            <div className="h-2 w-full bg-zinc-100 rounded-full" />
            <div className="h-2 w-full bg-zinc-100 rounded-full" />
            <div className="h-2 w-2/3 bg-zinc-100 rounded-full" />
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Instant Retrieval",
    description: "Sub-50ms semantic search across billions of documents.",
    icon: <Search className="w-6 h-6 text-zinc-900" />,
    className: "md:col-span-1 min-h-[200px]",
    visual: null
  },
  {
    title: "Autonomous Agents",
    description: "Deploy workflows that execute multi-step tasks across your ecosystem without human intervention.",
    icon: <Workflow className="w-6 h-6 text-zinc-900" />,
    className: "md:col-span-1 min-h-[200px]",
    visual: null
  },
  {
    title: "Zero-Trust Architecture",
    description: "SOC2 Type II compliant. Your data never trains our models. Strict role-based access control.",
    icon: <Shield className="w-6 h-6 text-zinc-900" />,
    className: "md:col-span-2 min-h-[200px] bg-zinc-900 text-white",
    visual: (
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
    )
  },
];

interface FeatureItem {
  title: string;
  description: string;
  icon: React.ReactElement;
  className: string;
  visual: React.ReactNode | null;
}

const FeatureCard = ({ feature, index }: { feature: FeatureItem; index: number }) => {
  const isDark = feature.className.includes("bg-zinc-900");
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative p-8 rounded-3xl border overflow-hidden transition-all duration-500",
        isDark ? "border-zinc-800 hover:border-zinc-700 shadow-2xl" : "bg-white border-black/5 hover:border-black/15 shadow-sm hover:shadow-md",
        feature.className
      )}
    >
      {/* Micro-grid background for light cards */}
      {!isDark && (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
      
      {feature.visual}
      
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div>
          <div className={cn(
            "mb-6 p-4 rounded-2xl inline-flex shadow-sm transition-transform duration-300 group-hover:scale-110",
            isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-black/5 border"
          )}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {isDark ? React.cloneElement(feature.icon as any, { className: "w-6 h-6 text-white" }) : feature.icon}
          </div>
          <h3 className={cn(
            "text-2xl font-bold mb-3 tracking-tight",
            isDark ? "text-white" : "text-zinc-900"
          )}>{feature.title}</h3>
          <p className={cn(
            "leading-relaxed font-light text-lg max-w-sm",
            isDark ? "text-zinc-400" : "text-zinc-600"
          )}>{feature.description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default function FeaturesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <section ref={containerRef} className="relative py-32 bg-zinc-50 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[#ff6b00]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-black/10 bg-white shadow-sm">
            <BrainCircuit className="w-4 h-4 text-[#ff6b00]" />
            <span className="text-xs font-bold tracking-[0.15em] text-zinc-600 uppercase">The Engine</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-black tracking-[-0.04em] mb-6 leading-[1.05]">
            A nervous system for <br />
            modern enterprises.
          </h2>
          <p className="text-xl text-zinc-600 font-light max-w-2xl mx-auto">
            Built from the ground up for massive scale, unmatched speed, and uncompromising security.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
