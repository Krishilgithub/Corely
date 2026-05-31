"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import Hero3D from "./Hero3D";

import { SiVercel, SiStripe, SiLinear, SiNotion, SiGithub, SiDocker, SiFigma, SiRaycast } from "react-icons/si";

const TRUSTED_LOGOS = [
  { name: "Vercel", icon: <SiVercel /> },
  { name: "Stripe", icon: <SiStripe /> },
  { name: "Linear", icon: <SiLinear /> },
  { name: "Notion", icon: <SiNotion /> },
  { name: "GitHub", icon: <SiGithub /> },
  { name: "Docker", icon: <SiDocker /> },
  { name: "Figma", icon: <SiFigma /> },
  { name: "Raycast", icon: <SiRaycast /> }
];

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const previewY = useTransform(scrollY, [0, 800], [0, -100]);
  const previewRotateX = useTransform(scrollY, [0, 800], [10, 0]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[100svh] pt-36 pb-20 flex flex-col items-center justify-start overflow-hidden bg-zinc-50 text-zinc-900 perspective-[2000px]"
    >
      <Hero3D />

      {/* Deep Radial Glow */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#ff6b00]/15 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        style={{ y: y1, opacity }}
        className="relative z-20 flex flex-col items-center text-center px-6 max-w-5xl mx-auto"
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/10 bg-white/60 backdrop-blur-md shadow-sm hover:bg-white/80 transition-colors cursor-pointer group"
        >
          <span className="flex items-center justify-center bg-[#ff6b00] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">New</span>
          <span className="text-sm font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors">Corely Intelligence Layer 2.0 is now live</span>
          <ChevronRight size={14} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-6xl md:text-8xl lg:text-[100px] font-bold tracking-[-0.04em] mb-8 leading-[1.05] text-center text-zinc-900"
        >
          The Unified Brain<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900">For Your Enterprise.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-2xl text-zinc-600 max-w-3xl mb-12 font-light tracking-tight leading-relaxed"
        >
          Corely transforms fragmented organizational knowledge into a unified, autonomous intelligence layer that understands context and acts across your ecosystem.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link href="/signup" className="w-full sm:w-auto">
            <button className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-800 transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_8px_20px_-6px_rgba(0,0,0,0.3)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_12px_24px_-8px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 active:translate-y-0">
              Start Building
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          
          <Link href="/contact" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 py-4 text-zinc-900 font-medium rounded-full border border-black/10 hover:bg-black/5 hover:border-black/20 transition-all backdrop-blur-sm">
              Talk to Sales
            </button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Glassmorphic App Preview */}
      <motion.div
        initial={{ opacity: 0, y: 100, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, rotateX: 10 }}
        style={{ y: previewY, rotateX: previewRotateX }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-6xl mx-auto mt-20 px-6"
      >
        <div className="relative rounded-2xl overflow-hidden border border-white/40 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] bg-white/40 backdrop-blur-2xl ring-1 ring-black/5">
          {/* Mac window controls */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-white/40 border-b border-black/5 flex items-center px-4 gap-2 backdrop-blur-md">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            <div className="mx-auto text-xs font-medium text-zinc-500">corely.ai/dashboard</div>
          </div>
          {/* Abstract UI content */}
          <div className="pt-12 h-[400px] md:h-[600px] w-full bg-zinc-50/50 flex p-6 gap-6">
            <div className="w-64 hidden md:flex flex-col gap-3">
              <div className="h-8 w-full bg-zinc-200/50 rounded-lg animate-pulse" />
              <div className="h-8 w-3/4 bg-zinc-200/50 rounded-lg animate-pulse" />
              <div className="h-8 w-5/6 bg-zinc-200/50 rounded-lg animate-pulse" />
              <div className="h-8 w-full bg-zinc-200/50 rounded-lg animate-pulse mt-8" />
              <div className="h-8 w-2/3 bg-zinc-200/50 rounded-lg animate-pulse" />
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <div className="w-full h-32 bg-white rounded-xl border border-black/5 shadow-sm p-6 flex flex-col gap-3">
                <div className="h-4 w-1/4 bg-zinc-200 rounded-full" />
                <div className="h-3 w-1/2 bg-zinc-100 rounded-full" />
                <div className="h-3 w-1/3 bg-zinc-100 rounded-full" />
              </div>
              <div className="w-full flex-1 bg-white rounded-xl border border-black/5 shadow-sm p-6 flex gap-4">
                <div className="flex-1 flex flex-col gap-3">
                  <div className="h-4 w-1/3 bg-zinc-200 rounded-full" />
                  <div className="h-20 w-full bg-zinc-50 rounded-lg border border-black/5" />
                  <div className="h-20 w-full bg-zinc-50 rounded-lg border border-black/5" />
                  <div className="h-20 w-full bg-zinc-50 rounded-lg border border-black/5" />
                </div>
                <div className="w-1/3 h-full bg-zinc-50 rounded-lg border border-black/5" />
              </div>
            </div>
          </div>
          {/* Subtle gradient overlay to fade out the bottom of the preview */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-zinc-50 to-transparent pointer-events-none" />
        </div>
      </motion.div>

      {/* Trusted By Logo Ticker */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="w-full relative z-10 mt-20 border-y border-black/5 bg-white/30 backdrop-blur-md py-10 overflow-hidden flex flex-col items-center"
      >
        <p className="text-sm font-medium text-zinc-500 mb-8 tracking-wide uppercase">Trusted by forward-thinking teams worldwide</p>
        <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
          <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll">
            {/* Double the list for infinite scrolling effect */}
            {[...TRUSTED_LOGOS, ...TRUSTED_LOGOS].map((logo, idx) => (
              <li key={idx} className="flex items-center gap-3 text-2xl font-bold text-zinc-400 whitespace-nowrap select-none opacity-60 hover:opacity-100 transition-opacity">
                {logo.icon}
                <span className="text-xl">{logo.name}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes infinite-scroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .animate-infinite-scroll {
            animation: infinite-scroll 30s linear infinite;
          }
        `}} />
      </motion.div>
    </section>
  );
}
