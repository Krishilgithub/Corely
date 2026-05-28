"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { Database, Shield, Search, Workflow, BrainCircuit } from "lucide-react";
import { cn } from "../../lib/utils";

const features = [
  {
    title: "Unified Knowledge Graph",
    description: "Corely connects to all your tools—Slack, Drive, Notion, GitHub—and builds a real-time organizational brain.",
    icon: <Database className="w-6 h-6 text-[#ff6b00]" />,
    className: "md:col-span-2",
  },
  {
    title: "Instant Retrieval",
    description: "Sub-second semantic search across billions of documents.",
    icon: <Search className="w-6 h-6 text-zinc-400" />,
    className: "md:col-span-1",
  },
  {
    title: "Autonomous Agents",
    description: "Deploy AI workflows that execute tasks across your ecosystem without human intervention.",
    icon: <Workflow className="w-6 h-6 text-blue-400" />,
    className: "md:col-span-1",
  },
  {
    title: "Enterprise Grade Security",
    description: "SOC2 Type II compliant. Your data never trains our models. Strict RBAC enforcement.",
    icon: <Shield className="w-6 h-6 text-emerald-400" />,
    className: "md:col-span-2",
  },
];

const FeatureCard = ({ feature, index }: { feature: { title: string; description: string; icon: React.ReactNode; className: string }; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: "easeOut" }}
      className={cn(
        "group relative p-8 rounded-3xl bg-white border border-black/5 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-black/15",
        feature.className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10">
        <div className="mb-6 p-4 rounded-2xl bg-zinc-50 inline-flex border border-black/5 shadow-sm">
          {feature.icon}
        </div>
        <h3 className="text-2xl font-semibold text-zinc-900 mb-3 tracking-tight">{feature.title}</h3>
        <p className="text-zinc-600 leading-relaxed font-light">{feature.description}</p>
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
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-black/10 bg-white shadow-sm">
            <BrainCircuit className="w-4 h-4 text-[#ff6b00]" />
            <span className="text-xs font-medium tracking-wide text-zinc-600 uppercase">The Engine</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-black tracking-tighter mb-6">
            A nervous system for <br />
            modern enterprises.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
