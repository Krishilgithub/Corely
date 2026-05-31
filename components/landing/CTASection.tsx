"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative py-48 bg-white overflow-hidden border-t border-black/5">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[400px] bg-[#ff6b00]/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold text-black tracking-[-0.04em] mb-8 leading-[1.05]"
        >
          Ready to build your <br className="hidden md:block" />
          Company Brain?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-zinc-600 font-light max-w-2xl mx-auto mb-14"
        >
          Join forward-thinking organizations using Corely to unify their knowledge, automate workflows, and accelerate decision making.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-3 max-w-md mx-auto"
        >
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-zinc-500" />
            </div>
            <input 
              type="email" 
              placeholder="Enter your work email" 
              className="w-full pl-11 pr-4 py-4 bg-zinc-50 border border-black/10 rounded-xl md:rounded-l-xl md:rounded-r-none text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-transparent transition-all backdrop-blur-md"
            />
          </div>
          <button className="w-full sm:w-auto group flex items-center justify-center gap-2 px-8 py-4 bg-[#ff6b00] text-white font-semibold rounded-xl md:rounded-l-none md:rounded-r-xl overflow-hidden hover:bg-[#e66000] transition-all duration-300 active:scale-95 whitespace-nowrap">
            <span>Start Free Trial</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6 text-sm text-zinc-500 font-medium"
        >
          14-day free trial. No credit card required.
        </motion.p>
      </div>
    </section>
  );
}
