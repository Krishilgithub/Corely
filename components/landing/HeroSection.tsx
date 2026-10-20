"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import HeroProductStack from "./HeroProductStack";
import { ctaArrow, ctaPrimary, ctaSecondary } from "./primitives";

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
  return (
    <section className="relative overflow-x-clip min-h-[100svh] flex flex-col pt-28 pb-12 lg:pt-32 bg-[linear-gradient(to_bottom,var(--canvas),var(--surface)_45%,var(--canvas))] text-text-primary">
      {/* Soft grid and a neutral glow behind the hero */}
      <div
        className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:linear-gradient(to_bottom,#000_70%,transparent_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] max-w-full h-[420px] rounded-full bg-[radial-gradient(ellipse_at_center,var(--surface-secondary),transparent_70%)] blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex-1 flex items-center w-full max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-6">
          {/* Left: announcement, headline, sub copy, CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-start gap-6 text-left max-w-xl min-w-0"
          >
            <div className="inline-flex max-w-full items-center gap-2 h-8 pl-1 pr-3 rounded-full border border-hairline bg-[color-mix(in_srgb,var(--surface)_75%,transparent)] backdrop-blur-sm shadow-2xs">
              <span className="inline-flex items-center h-6 px-2 rounded-full border border-hairline bg-surface-secondary text-text-primary text-xs font-semibold">
                New
              </span>
              <span className="text-sm font-medium text-text-secondary truncate">Corely Intelligence Layer 2.0 is now live</span>
              <ChevronRight className="size-3.5 text-icon-secondary" aria-hidden="true" />
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-medium tracking-tight leading-[1.05] text-text-primary">
              The unified brain{" "}
              <span className="block text-[var(--accent-text)]">for your enterprise.</span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-text-secondary max-w-xl">
              Corely transforms fragmented organizational knowledge into a unified, autonomous intelligence layer that understands context and acts across your ecosystem.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 w-full sm:w-auto">
              <Link href="/signup" className={ctaPrimary}>
                Start building
                <ArrowRight className={ctaArrow} aria-hidden="true" />
              </Link>
              <Link href="/contact" className={ctaSecondary}>
                Talk to sales
              </Link>
            </div>
          </motion.div>

          {/* Right: product visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative w-full min-w-0"
          >
            {/* Very faint brand glow behind the visual */}
            <div
              className="absolute inset-x-[10%] top-1/2 h-2/3 -translate-y-1/2 rounded-full bg-[var(--accent-wash)] blur-3xl pointer-events-none"
              aria-hidden="true"
            />
            <HeroProductStack />
          </motion.div>
        </div>
      </div>

      {/* Trusted-by logo strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        className="relative z-10 mt-16 lg:mt-20 border-y border-hairline bg-[color-mix(in_srgb,var(--surface)_60%,transparent)] py-8"
      >
        <p className="mb-6 px-6 text-center text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">
          Trusted by forward-thinking teams worldwide
        </p>
        <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent_0,#000_128px,#000_calc(100%-128px),transparent_100%)]">
          {/* The list is doubled so the scroll loops without a gap */}
          <ul className="landing-marquee flex w-max items-center">
            {[...TRUSTED_LOGOS, ...TRUSTED_LOGOS].map((logo, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2.5 px-8 whitespace-nowrap select-none text-text-disabled hover:text-text-secondary transition-colors duration-200"
              >
                <span className="text-xl">{logo.icon}</span>
                <span className="text-base font-semibold tracking-tight">{logo.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}
