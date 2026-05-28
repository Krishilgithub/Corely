"use client";

import { motion } from "framer-motion";
import { Sun, Database, Network, Zap, ShieldCheck, Mic, Star, Lock, Users } from "lucide-react";

const mainFeatures = [
  {
    title: "Context Engine",
    description: "Understands people, teams, projects and workflows across your entire organization.",
    icon: <Sun className="w-5 h-5 text-[#ff6b00]" />,
    iconBg: "bg-[#ff6b00]/10",
  },
  {
    title: "Memory Layer",
    description: "Retains knowledge that matters across time and tools — nothing gets lost.",
    icon: <Database className="w-5 h-5 text-[#ff6b00]" />,
    iconBg: "bg-[#ff6b00]/10",
  },
  {
    title: "Reasoning Core",
    description: "Synthesizes insights from complex, fragmented data to surface what matters most.",
    icon: <Network className="w-5 h-5 text-[#ff6b00]" />,
    iconBg: "bg-[#ff6b00]/10",
  },
  {
    title: "Action Engine",
    description: "Takes action across tools and systems on your behalf — automatically.",
    icon: <Zap className="w-5 h-5 text-[#ff6b00]" />,
    iconBg: "bg-[#ff6b00]/10",
  },
];

const smallFeatures = [
  {
    title: "Unified Context",
    description: "Brings all your data and teams into one understanding.",
    icon: <ShieldCheck className="w-4 h-4 text-[#ff6b00]" />,
  },
  {
    title: "Persistent Memory",
    description: "Remembers what matters across time, projects, and people.",
    icon: <Mic className="w-4 h-4 text-[#ff6b00]" />,
  },
  {
    title: "Intelligent Reasoning",
    description: "Understands relationships, patterns, and what's really important.",
    icon: <Star className="w-4 h-4 text-[#ff6b00]" />,
  },
  {
    title: "Action at Scale",
    description: "Executes across systems so your team can move faster.",
    icon: <Zap className="w-4 h-4 text-[#ff6b00]" />,
  },
  {
    title: "Enterprise Grade",
    description: "Built with security, privacy, and compliance at every layer.",
    icon: <Lock className="w-4 h-4 text-[#ff6b00]" />,
  },
  {
    title: "People Amplified",
    description: "AI that empowers people — not replaces them.",
    icon: <Users className="w-4 h-4 text-[#ff6b00]" />,
  },
];

export default function HowItWorksSection() {
  return (
    <section className="relative py-32 bg-zinc-50 overflow-hidden border-t border-black/5">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-8 rounded-full border border-[#ff6b00]/20 bg-[#ff6b00]/5">
            <span className="text-[11px] font-bold tracking-[0.15em] text-[#ff6b00] uppercase">
              CORELY INTELLIGENCE LAYER
            </span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 leading-[1.1]">
            <span className="text-black">One Layer. </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff9240]">
              Infinite Intelligence.
            </span>
          </h2>
          
          <p className="text-lg text-zinc-600 font-light max-w-2xl mx-auto leading-relaxed">
            Corely connects your data, understands your context, builds memory that lasts, and powers intelligent action across your organization.
          </p>
        </motion.div>

        {/* 4 Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {mainFeatures.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-white border border-black/5 shadow-sm hover:shadow-md transition-shadow flex items-start gap-6"
            >
              <div className={`p-4 rounded-2xl ${feature.iconBg} shrink-0`}>
                {feature.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">{feature.title}</h3>
                <p className="text-zinc-500 font-light leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 6 Small Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-0 bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden"
        >
          {smallFeatures.map((feature, i) => (
            <div 
              key={i} 
              className={`p-6 flex flex-col gap-3 relative ${
                i !== smallFeatures.length - 1 ? "border-b md:border-b-0 lg:border-r border-black/5" : ""
              } ${
                (i + 1) % 3 !== 0 && i !== smallFeatures.length - 1 ? "md:border-r lg:border-r border-black/5" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#ff6b00]/10 flex items-center justify-center shrink-0 mb-2">
                {feature.icon}
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 mb-1 leading-tight">{feature.title}</h4>
                <p className="text-xs text-zinc-500 font-light leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
