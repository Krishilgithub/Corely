"use client";

import { motion } from "framer-motion";
import { Clock, Network, AlertTriangle, TrendingDown, LayoutGrid, Hourglass, SearchX, ArrowRight } from "lucide-react";

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
    <section className="relative py-32 bg-zinc-50 overflow-hidden border-t border-black/5">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-block mb-6">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#ff6b00] uppercase">
              THE PROBLEM
            </span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 leading-[1.1]">
            <span className="text-black block mb-1">Your Knowledge Is Everywhere.</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff9240] block">
              Your Intelligence Is Nowhere.
            </span>
          </h2>
          
          <p className="text-lg text-zinc-600 font-light max-w-2xl mx-auto leading-relaxed">
            Modern organizations operate across disconnected tools, fragmented conversations, scattered documents, and siloed systems — making knowledge impossible to access when it matters most.
          </p>
        </motion.div>

        {/* Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {problems.map((problem, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-white border border-black/5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${problem.iconBg} shrink-0`}>
                  {problem.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-2">{problem.title}</h3>
                  <p className="text-sm text-zinc-500 font-light leading-relaxed">
                    {problem.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-3xl bg-white border border-black/5 shadow-sm mb-24"
        >
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left relative">
              <div className="p-3 rounded-xl bg-[#ff6b00]/10 shrink-0">
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-[#ff6b00] mb-0.5">{stat.value}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wide font-medium">{stat.label}</div>
              </div>
              {i < stats.length - 1 && (
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-12 bg-black/5" />
              )}
            </div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <h3 className="text-xl md:text-2xl font-bold text-black mb-8">
            This is exactly why Corely exists.
          </h3>
          <button className="group inline-flex items-center gap-2 px-8 py-4 bg-[#ff6b00] text-white font-semibold rounded-full hover:bg-[#e66000] transition-colors shadow-md hover:shadow-lg">
            <span>See How Corely Connects Everything</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

      </div>
    </section>
  );
}
