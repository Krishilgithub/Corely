"use client";

import React from "react";
import { Globe, MessageSquare, Hash } from "lucide-react";
import Link from "next/link";
import CorelyLogo from "@/components/icons/corely-logo";

const linkClass = "text-sm text-text-secondary hover:text-text-primary transition-colors duration-150";
const socialClass =
  "inline-flex items-center justify-center size-10 rounded-lg border border-hairline bg-surface text-icon-secondary hover:text-text-primary hover:border-border-strong transition-colors duration-150";

export default function FooterSection() {
  return (
    <footer className="relative bg-canvas border-t border-hairline pt-16 pb-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand column */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-5 text-text-primary">
              <CorelyLogo size={24} />
              <span className="text-lg font-bold tracking-tight">Corely</span>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary max-w-sm mb-6">
              The Intelligence Layer for modern organizations. Connect your entire ecosystem and never lose institutional knowledge again.
            </p>
            <div className="flex items-center gap-2">
              <Link href="https://twitter.com/corely" className={socialClass} aria-label="Twitter">
                <MessageSquare size={16} />
              </Link>
              <Link href="https://github.com/corely" className={socialClass} aria-label="GitHub">
                <Hash size={16} />
              </Link>
              <Link href="https://corely.ai" className={socialClass} aria-label="Website">
                <Globe size={16} />
              </Link>
            </div>
          </div>

          {/* Link columns */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary mb-4">Product</h3>
            <ul className="flex flex-col gap-3">
              <li><Link href="/#features" className={linkClass}>Features</Link></li>
              <li><Link href="/#how-it-works" className={linkClass}>Integrations</Link></li>
              <li><Link href="/pricing" className={linkClass}>Pricing</Link></li>
              <li><Link href="/changelog" className={linkClass}>Changelog</Link></li>
              <li><Link href="/#security" className={linkClass}>Security</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary mb-4">Company</h3>
            <ul className="flex flex-col gap-3">
              <li><Link href="/about" className={linkClass}>About Us</Link></li>
              <li><Link href="/careers" className={linkClass}>Careers</Link></li>
              <li><Link href="/blog" className={linkClass}>Blog</Link></li>
              <li><Link href="/contact" className={linkClass}>Contact</Link></li>
              <li><Link href="/#how-it-works" className={linkClass}>Manifesto</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary mb-4">Legal</h3>
            <ul className="flex flex-col gap-3">
              <li><Link href="/privacy" className={linkClass}>Privacy Policy</Link></li>
              <li><Link href="/terms" className={linkClass}>Terms of Service</Link></li>
              <li><Link href="/cookie" className={linkClass}>Cookie Policy</Link></li>
              <li><Link href="/dpa" className={linkClass}>DPA</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-hairline flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-sm text-text-tertiary">
            © {new Date().getFullYear()} Corely Enterprise. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            <span className="text-sm text-text-tertiary">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
