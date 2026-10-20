"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FooterSection from "../../components/landing/FooterSection";
import LandingNavbar from "../../components/landing/LandingNavbar";
import { ctaPrimary, ctaSecondary } from "../../components/landing/primitives";

const FAQS = [
  {
    question: "What counts as an indexed document?",
    answer: "A document is any discrete file, page, or conversation thread we index. This includes a single Google Doc, a Notion page, a Slack thread, or a Jira issue. We only count active documents that are currently stored in your Corely intelligence layer."
  },
  {
    question: "Is my data used to train your AI models?",
    answer: "Never. Your organizational data is strictly isolated within your workspace. We do not use customer data to train our foundational models, and all interactions with third-party LLMs (like OpenAI) are done via zero-retention enterprise APIs."
  },
  {
    question: "How long does it take to connect my tools?",
    answer: "Most integrations take less than 60 seconds to authenticate via OAuth. The initial indexing process happens in the background and speed depends on your data volume. A typical workspace of 10,000 documents finishes indexing in under 5 minutes."
  },
  {
    question: "Do you offer SOC 2 compliance?",
    answer: "Yes. Corely is SOC 2 Type II compliant. We offer dedicated VPCs, custom DPAs, and on-premise deployment options for our Enterprise tier customers."
  }
];

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

/* One feature line in a plan card. */
function PlanItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm text-text-secondary">
      <Check size={16} className="mt-0.5 shrink-0 text-text-primary" aria-hidden="true" />
      {children}
    </li>
  );
}

const cardClass = "rounded-2xl border bg-surface p-8 flex flex-col transition-colors duration-200";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="bg-canvas text-text-primary min-h-screen flex flex-col overflow-x-clip selection:bg-[var(--accent-soft)]">
      <LandingNavbar variant="page" />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pt-36 pb-24">
        <motion.div {...reveal()} className="text-center mb-14 flex flex-col items-center gap-5">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.05] text-text-primary">
            Simple, transparent pricing.
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-text-secondary max-w-2xl">
            Start free and scale as your organization&apos;s memory grows. No hidden fees.
          </p>

          {/* Billing toggle */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <span className={`text-sm font-medium ${!isAnnual ? "text-text-primary" : "text-text-tertiary"}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              role="switch"
              className="w-11 h-6 rounded-full bg-border-strong relative p-0.5 transition-colors duration-200 aria-checked:bg-accent-fill cursor-pointer"
              aria-checked={isAnnual}
            >
              <motion.div
                className="w-5 h-5 bg-[var(--accent-fg)] rounded-full shadow-sm"
                animate={{ x: isAnnual ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isAnnual ? "text-text-primary" : "text-text-tertiary"}`}>Annually</span>
              <span className="ui-badge ui-badge--success">Save 20%</span>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 mb-24 lg:mb-32">
          {/* Starter */}
          <motion.div {...reveal(0.1)} className={`${cardClass} border-hairline hover:border-border-strong`}>
            <h3 className="text-xl font-semibold tracking-tight text-text-primary mb-2">Starter</h3>
            <p className="text-sm text-text-secondary mb-6 min-h-10">Perfect for small teams exploring unified intelligence.</p>
            <div className="mb-8">
              <span className="text-4xl font-semibold tracking-tight tabular-nums">$0</span>
            </div>
            <ul className="flex flex-col gap-3.5 mb-10 flex-1">
              <PlanItem>Up to 3 team members</PlanItem>
              <PlanItem>3 standard integrations</PlanItem>
              <PlanItem>1,000 indexed documents</PlanItem>
              <PlanItem>Standard LLM models</PlanItem>
            </ul>
            <Link href="/signup" className={`${ctaSecondary} w-full`}>
              Get started for free
            </Link>
          </motion.div>

          {/* Growth: the highlighted plan */}
          <motion.div
            {...reveal(0.2)}
            className={`${cardClass} relative border-[var(--accent-border)] shadow-[0_0_0_4px_var(--accent-wash)]`}
          >
            <span className="ui-badge ui-badge--accent absolute -top-3 left-8">
              <Sparkles aria-hidden="true" /> Most popular
            </span>
            <h3 className="text-xl font-semibold tracking-tight text-text-primary mb-2">Growth</h3>
            <p className="text-sm text-text-secondary mb-6 min-h-10">For growing companies with complex knowledge bases.</p>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight tabular-nums">${isAnnual ? "49" : "59"}</span>
              <span className="text-sm font-medium text-text-tertiary">/user/mo</span>
            </div>
            <ul className="flex flex-col gap-3.5 mb-10 flex-1">
              <PlanItem>Unlimited team members</PlanItem>
              <PlanItem>All integrations included</PlanItem>
              <PlanItem>50,000 indexed documents/user</PlanItem>
              <PlanItem>Premium LLMs (GPT-4o, Claude 3.5)</PlanItem>
              <PlanItem>Custom autonomous workflows</PlanItem>
              <PlanItem>Priority email support</PlanItem>
            </ul>
            <Link href="/signup" className={`${ctaPrimary} w-full`}>
              Start 14-day free trial
            </Link>
          </motion.div>

          {/* Enterprise */}
          <motion.div {...reveal(0.3)} className={`${cardClass} border-hairline hover:border-border-strong`}>
            <h3 className="text-xl font-semibold tracking-tight text-text-primary mb-2">Enterprise</h3>
            <p className="text-sm text-text-secondary mb-6 min-h-10">Custom security and compliance for large organizations.</p>
            <div className="mb-8">
              <span className="text-4xl font-semibold tracking-tight">Custom</span>
            </div>
            <ul className="flex flex-col gap-3.5 mb-10 flex-1">
              <PlanItem>Everything in Growth</PlanItem>
              <PlanItem>SSO &amp; SAML support</PlanItem>
              <PlanItem>Dedicated VPC &amp; Data Isolation</PlanItem>
              <PlanItem>SOC2 Compliance &amp; Custom DPA</PlanItem>
              <PlanItem>Dedicated success manager</PlanItem>
              <PlanItem>Custom LLM Fine-tuning</PlanItem>
            </ul>
            <Link href="/contact" className={`${ctaSecondary} w-full`}>
              Contact sales
            </Link>
          </motion.div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-text-primary text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="rounded-2xl border border-hairline bg-surface divide-y divide-hairline overflow-hidden">
            {FAQS.map((faq, idx) => (
              <div key={idx}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer hover:bg-surface-hover transition-colors duration-150"
                  aria-expanded={openFaq === idx}
                >
                  <span className="text-base font-semibold text-text-primary">{faq.question}</span>
                  <span className="size-8 shrink-0 rounded-lg border border-hairline bg-surface-secondary flex items-center justify-center text-icon-secondary">
                    {openFaq === idx ? <Minus size={16} /> : <Plus size={16} />}
                  </span>
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-sm leading-relaxed text-text-secondary">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
