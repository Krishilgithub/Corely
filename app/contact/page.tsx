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

  const labelClass = "text-sm font-medium text-text-primary";

  return (
    <SimplePageLayout title="Talk to Sales" description="Learn how Corely can transform your enterprise's institutional knowledge.">
      <div className="not-prose">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="rounded-2xl border border-hairline bg-surface p-6 sm:p-8 shadow-2xs flex flex-col gap-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="firstName" className={labelClass}>First Name</label>
                  <input required type="text" id="firstName" className="ui-input" placeholder="Jane" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="lastName" className={labelClass}>Last Name</label>
                  <input required type="text" id="lastName" className="ui-input" placeholder="Doe" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className={labelClass}>Work Email</label>
                <input required type="email" id="email" className="ui-input" placeholder="jane@company.com" />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="company" className={labelClass}>Company Name</label>
                <input required type="text" id="company" className="ui-input" placeholder="Acme Corp" />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="message" className={labelClass}>How can we help?</label>
                <textarea required id="message" rows={4} className="ui-input !resize-none" placeholder="Tell us about your team and what you're looking to achieve..."></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="ui-btn ui-btn--primary ui-btn--lg ui-btn--block mt-2"
              >
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <>Contact Sales <ArrowRight size={16} /></>}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-hairline bg-surface px-6 py-12 sm:p-12 shadow-2xs flex flex-col items-center justify-center text-center gap-4"
            >
              <div className="size-14 rounded-2xl bg-success-soft text-success flex items-center justify-center mb-2">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Message received</h2>
              <p className="text-base leading-relaxed text-text-secondary max-w-md">
                Thank you for reaching out. Our team will review your inquiry and get back to you within 24 hours.
              </p>
              <button
                onClick={() => setIsSuccess(false)}
                className="ui-btn ui-btn--secondary mt-4"
              >
                Send another message
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-hairline">
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-2">Support</h3>
            <p className="text-sm text-text-secondary mb-2">Need technical assistance with your account?</p>
            <a href="mailto:support@corely.ai" className="text-sm font-semibold text-[var(--accent-text)] underline-offset-4 hover:underline">support@corely.ai</a>
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-2">Office</h3>
            <p className="text-sm leading-relaxed text-text-secondary">Corely Inc.<br/>San Francisco, CA<br/>United States</p>
          </div>
        </div>
      </div>
    </SimplePageLayout>
  );
}
