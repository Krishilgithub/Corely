"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import { ctaArrow, ctaPrimary, revealProps } from "./primitives";

export default function CTASection() {
  return (
    <section className="relative py-24 lg:py-32 bg-canvas border-t border-hairline">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface px-6 py-16 sm:px-12 lg:py-24">
          {/* Faint grid that fades toward the edges */}
          <div
            className="absolute inset-0 pointer-events-none bg-[linear-gradient(#80808014_1px,transparent_1px),linear-gradient(90deg,#80808014_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
            <motion.h2
              {...revealProps}
              className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.1] text-text-primary"
            >
              Ready to build your <span className="sm:block">company brain?</span>
            </motion.h2>

            <motion.p
              {...revealProps}
              transition={{ ...revealProps.transition, delay: 0.1 }}
              className="text-base sm:text-lg leading-relaxed text-text-secondary max-w-2xl"
            >
              Join forward-thinking organizations using Corely to unify their knowledge, automate workflows, and accelerate decision making.
            </motion.p>

            <motion.div
              {...revealProps}
              transition={{ ...revealProps.transition, delay: 0.2 }}
              className="w-full max-w-md flex flex-col sm:flex-row items-stretch gap-2 pt-2"
            >
              <div className="relative flex-1 min-w-0">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="size-4 text-icon-secondary" />
                </div>
                <input
                  type="email"
                  placeholder="Enter your work email"
                  className="ui-input !h-11 !pl-10"
                />
              </div>
              <button className={ctaPrimary}>
                <span>Start free trial</span>
                <ArrowRight className={ctaArrow} />
              </button>
            </motion.div>

            <p className="text-sm font-medium text-text-tertiary">
              14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
