"use client";

import { useState } from "react";
import SimplePageLayout from "../../components/landing/SimplePageLayout";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <SimplePageLayout title="Talk to Sales" description="Learn how Corely can transform your enterprise's institutional knowledge.">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.form 
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="bg-white p-8 rounded-2xl border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="firstName" className="text-sm font-semibold text-zinc-900">First Name</label>
                  <input required type="text" id="firstName" className="px-4 py-3 rounded-xl border border-black/10 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20 focus:border-[#ff6b00] transition-all" placeholder="Jane" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="lastName" className="text-sm font-semibold text-zinc-900">Last Name</label>
                  <input required type="text" id="lastName" className="px-4 py-3 rounded-xl border border-black/10 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20 focus:border-[#ff6b00] transition-all" placeholder="Doe" />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-semibold text-zinc-900">Work Email</label>
                <input required type="email" id="email" className="px-4 py-3 rounded-xl border border-black/10 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20 focus:border-[#ff6b00] transition-all" placeholder="jane@company.com" />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="company" className="text-sm font-semibold text-zinc-900">Company Name</label>
                <input required type="text" id="company" className="px-4 py-3 rounded-xl border border-black/10 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20 focus:border-[#ff6b00] transition-all" placeholder="Acme Corp" />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-sm font-semibold text-zinc-900">How can we help?</label>
                <textarea required id="message" rows={4} className="px-4 py-3 rounded-xl border border-black/10 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20 focus:border-[#ff6b00] transition-all resize-none" placeholder="Tell us about your team and what you're looking to achieve..."></textarea>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#ff6b00] text-white font-bold rounded-xl hover:bg-[#e54e00] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-4px_rgba(255,107,0,0.45)] shadow-[0_4px_12px_rgba(255,107,0,0.25)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : <>Contact Sales <ArrowRight size={18} /></>}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-12 rounded-2xl border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center text-center gap-4"
            >
              <div className="w-16 h-16 bg-[#ff6b00]/10 text-[#ff6b00] rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">Message Received</h2>
              <p className="text-zinc-600 max-w-md">
                Thank you for reaching out. Our team will review your inquiry and get back to you within 24 hours.
              </p>
              <button 
                onClick={() => setIsSuccess(false)}
                className="mt-6 px-6 py-2.5 bg-zinc-100 text-zinc-900 font-semibold rounded-xl hover:bg-zinc-200 transition-colors"
              >
                Send another message
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-black/5">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Support</h3>
            <p className="text-zinc-600 mb-2">Need technical assistance with your account?</p>
            <a href="mailto:support@corely.ai" className="text-[#ff6b00] font-semibold hover:underline">support@corely.ai</a>
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Office</h3>
            <p className="text-zinc-600">Corely Inc.<br/>San Francisco, CA<br/>United States</p>
          </div>
        </div>
      </div>
    </SimplePageLayout>
  );
}
