"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Hero3D from "./Hero3D";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[100svh] pt-32 flex flex-col items-center justify-center overflow-hidden bg-transparent text-zinc-900"
    >
      <Hero3D />

      {/* Radial Gradient overlay */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.08)_0%,transparent_60%)] pointer-events-none" />

      <motion.div 
        style={{ y: y1, opacity }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto"
      >
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/10 bg-white/60 backdrop-blur-md shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-[#ff6b00] animate-pulse"></span>
          <span className="text-xs font-medium tracking-wide text-zinc-600 uppercase">Corely Intelligence Layer 2.0</span>
        </div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 leading-[1.1] text-center text-black"
        >
          The Unified Brain<br />
          For Your Enterprise.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-lg md:text-xl text-zinc-600 max-w-2xl mb-12 font-light tracking-wide"
        >
          Corely transforms fragmented organizational knowledge into a unified, autonomous intelligence layer that understands context and acts across your ecosystem.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/signup">
            <button className="group relative px-8 py-4 bg-zinc-900 text-white font-semibold rounded-full overflow-hidden transition-transform shadow-md active:scale-95">
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b00] to-[#ff9240] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative group-hover:text-white transition-colors duration-300">Start Building</span>
            </button>
          </Link>
          
          <Link href="#how-it-works">
            <button className="px-8 py-4 text-zinc-900 font-medium rounded-full border border-black/10 hover:bg-black/5 transition-colors backdrop-blur-sm">
              Read the Manifesto
            </button>
          </Link>
        </motion.div>
      </motion.div>

    </section>
  );
}
