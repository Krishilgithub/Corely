"use client";

import { motion } from "framer-motion";
import { Clock, Network, AlertTriangle, TrendingDown, LayoutGrid, Hourglass, SearchX } from "lucide-react";

const problems = [
  {
    title: "Time Lost Searching",
    description: "Teams waste hours searching across tools.",
    icon: <Clock className="w-5 h-5 text-[#ff6b00]" />,
    iconBg: "bg-[#ff6b00]/10",
  },
  {
    title: "Knowledge Silos",
    description: "Critical insights stay trapped in isolated systems.",
    icon: <Network className="w-5 h-5 text-[#ff6b00]" />,
    iconBg: "bg-[#ff6b00]/10",
  },
  {
    title: "Delayed Decisions",
    description: "Disconnected context slows business execution.",
    icon: <AlertTriangle className="w-5 h-5 text-[#ff6b00]" />,
    iconBg: "bg-[#ff6b00]/10",
  },
];

const stats = [
  {
    value: "30%",
    label: "Productivity Lost",
    icon: <TrendingDown className="w-5 h-5 text-[#ff6b00]" />,
  },
  {
    value: "8+",
    label: "Tools Per Team",
    icon: <LayoutGrid className="w-5 h-5 text-[#ff6b00]" />,
  },
  {
    value: "Hours",
    label: "Wasted Weekly",
    icon: <Hourglass className="w-5 h-5 text-[#ff6b00]" />,
  },
  {
    value: "Critical",
    label: "Context Missing",
    icon: <SearchX className="w-5 h-5 text-[#ff6b00]" />,
  },
];

export default function ProblemSection() {
  return (
    <section className="relative py-40 bg-white overflow-hidden text-zinc-900 border-t border-black/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,107,0,0.08)_0%,transparent_60%)] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-24"
        >
          <div className="inline-block mb-6">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#ff6b00] uppercase px-4 py-1.5 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/20">
              The Fragmentation Crisis
            </span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold tracking-[-0.04em] mb-8 leading-[1.05]">
            <span className="text-black block mb-2">Your Knowledge Is Everywhere.</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff9240] block">
              Your Intelligence Is Nowhere.
            </span>
          </h2>
          
          <p className="text-xl text-zinc-600 font-light max-w-2xl mx-auto leading-relaxed">
            Modern organizations operate across disconnected tools, fragmented conversations, and siloed systems—making knowledge impossible to access when it matters most.
          </p>
        </motion.div>

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-black/5 border border-black/5 rounded-3xl overflow-hidden mb-12 shadow-sm"
        >
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-10 bg-white relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#ff6b00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-4 rounded-2xl bg-[#ff6b00]/10 mb-6 shrink-0 border border-[#ff6b00]/20 relative z-10 group-hover:scale-110 transition-transform duration-300">
                {stat.icon}
              </div>
              <div className="text-4xl font-bold text-black mb-2 relative z-10">{stat.value}</div>
              <div className="text-sm text-zinc-500 font-medium tracking-wide relative z-10">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {problems.map((problem, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + (i * 0.1) }}
              className="p-8 rounded-3xl bg-white border border-black/5 hover:border-black/15 transition-all flex flex-col gap-4 shadow-sm hover:shadow-md"
            >
              <div className="flex items-start gap-5">
                <div className="p-3 rounded-xl bg-zinc-50 border border-black/5 shrink-0">
                  {problem.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-2 text-lg">{problem.title}</h3>
                  <p className="text-zinc-600 font-light leading-relaxed">
                    {problem.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
