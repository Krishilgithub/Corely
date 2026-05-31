"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Sparkles, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FooterSection from "../../components/landing/FooterSection";

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

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="bg-zinc-50 min-h-screen selection:bg-[#ff6b00] selection:text-white flex flex-col">
      <nav className="w-full border-b border-black/5 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <span className="text-zinc-900 font-bold tracking-tight">Corely</span>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-32">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-black tracking-[-0.04em] mb-6 leading-[1.05]">
              Simple, transparent pricing.
            </h1>
            <p className="text-xl text-zinc-600 font-light max-w-2xl mx-auto mb-10">
              Start free and scale as your organization&apos;s memory grows. No hidden fees.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!isAnnual ? "text-zinc-900" : "text-zinc-500"}`}>Monthly</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                role="switch"
                className="w-14 h-7 rounded-full bg-zinc-200 relative p-1 transition-colors duration-300 aria-checked:bg-[#ff6b00]"
                aria-checked={isAnnual}
              >
                <motion.div 
                  className="w-5 h-5 bg-white rounded-full shadow-sm"
                  animate={{ x: isAnnual ? 28 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isAnnual ? "text-zinc-900" : "text-zinc-500"}`}>Annually</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Save 20%</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-32">
          {/* Starter Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-3xl p-10 border border-black/5 shadow-sm flex flex-col hover:shadow-md transition-shadow"
          >
            <h3 className="text-2xl font-bold text-zinc-900 mb-2">Starter</h3>
            <p className="text-zinc-500 text-sm mb-6 h-10">Perfect for small teams exploring unified intelligence.</p>
            <div className="mb-8">
              <span className="text-5xl font-bold tracking-tight">$0</span>
            </div>
            <ul className="flex flex-col gap-4 mb-10 flex-1">
              <li className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-[#ff6b00] shrink-0" /> Up to 3 team members</li>
              <li className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-[#ff6b00] shrink-0" /> 3 standard integrations</li>
              <li className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-[#ff6b00] shrink-0" /> 1,000 indexed documents</li>
              <li className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-[#ff6b00] shrink-0" /> Standard LLM models</li>
            </ul>
            <Link href="/signup" className="w-full py-4 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold rounded-xl text-center transition-colors">
              Get Started for Free
            </Link>
          </motion.div>

          {/* Growth Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative rounded-3xl shadow-2xl flex flex-col transform lg:-translate-y-4 bg-zinc-900 p-10"
          >
            <div className="relative h-full flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#ff6b00] text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full flex items-center gap-1 shadow-lg">
                <Sparkles size={12} /> Most Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 mt-2">Growth</h3>
              <p className="text-zinc-400 text-sm mb-6 h-10">For growing companies with complex knowledge bases.</p>
              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight text-white">${isAnnual ? "49" : "59"}</span>
                <span className="text-zinc-400">/user/mo</span>
              </div>
              <ul className="flex flex-col gap-4 mb-10 flex-1">
                <li className="flex items-start gap-3 text-sm text-zinc-300"><Check size={18} className="text-[#ff6b00] shrink-0" /> Unlimited team members</li>
                <li className="flex items-start gap-3 text-sm text-zinc-300"><Check size={18} className="text-[#ff6b00] shrink-0" /> All integrations included</li>
                <li className="flex items-start gap-3 text-sm text-zinc-300"><Check size={18} className="text-[#ff6b00] shrink-0" /> 50,000 indexed documents/user</li>
                <li className="flex items-start gap-3 text-sm text-zinc-300"><Check size={18} className="text-[#ff6b00] shrink-0" /> Premium LLMs (GPT-4o, Claude 3.5)</li>
                <li className="flex items-start gap-3 text-sm text-zinc-300"><Check size={18} className="text-[#ff6b00] shrink-0" /> Custom autonomous workflows</li>
                <li className="flex items-start gap-3 text-sm text-zinc-300"><Check size={18} className="text-[#ff6b00] shrink-0" /> Priority email support</li>
              </ul>
              <Link href="/signup" className="w-full py-4 px-4 bg-[#ff6b00] hover:bg-[#e66000] text-white font-semibold rounded-xl text-center transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                Start 14-Day Free Trial
              </Link>
            </div>
          </motion.div>

          {/* Enterprise Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-3xl p-10 border border-black/5 shadow-sm flex flex-col hover:shadow-md transition-shadow"
          >
            <h3 className="text-2xl font-bold text-zinc-900 mb-2">Enterprise</h3>
            <p className="text-zinc-500 text-sm mb-6 h-10">Custom security and compliance for large organizations.</p>
            <div className="mb-8">
              <span className="text-5xl font-bold tracking-tight">Custom</span>
            </div>
            <ul className="flex flex-col gap-4 mb-10 flex-1">
              <li className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-[#ff6b00] shrink-0" /> Everything in Growth</li>
              <li className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-[#ff6b00] shrink-0" /> SSO & SAML support</li>
              <li className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-[#ff6b00] shrink-0" /> Dedicated VPC & Data Isolation</li>
              <li className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-[#ff6b00] shrink-0" /> SOC2 Compliance & Custom DPA</li>
              <li className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-[#ff6b00] shrink-0" /> Dedicated success manager</li>
              <li className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-[#ff6b00] shrink-0" /> Custom LLM Fine-tuning</li>
            </ul>
            <Link href="/contact" className="w-full py-4 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold rounded-xl text-center transition-colors">
              Contact Sales
            </Link>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto border-t border-black/5 pt-24 pb-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="flex flex-col gap-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-white border border-black/5 rounded-2xl overflow-hidden hover:border-black/10 transition-colors">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-lg font-semibold text-zinc-900">{faq.question}</span>
                  <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center shrink-0">
                    {openFaq === idx ? <Minus size={16} className="text-[#ff6b00]" /> : <Plus size={16} className="text-zinc-400" />}
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 pt-0 text-zinc-600 leading-relaxed font-light">
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
