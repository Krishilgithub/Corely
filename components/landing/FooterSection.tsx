"use client";

import React from "react";
import { Globe, MessageSquare, Hash } from "lucide-react";
import Link from "next/link";

export default function FooterSection() {
  return (
    <footer className="relative bg-zinc-50 pt-20 pb-10 border-t border-black/10 overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[200px] bg-[#ff6b00] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          
          {/* Brand Column */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b00] to-[#ff9240] flex items-center justify-center shadow-[0_0_15px_rgba(255,107,0,0.4)]">
                <span className="text-white font-bold text-lg leading-none transform -rotate-45 block">
                  ◆
                </span>
              </div>
              <span className="text-zinc-900 font-bold text-xl tracking-tight">Corely</span>
            </div>
            <p className="text-zinc-600 text-sm max-w-sm font-light leading-relaxed mb-6">
              The Intelligence Layer for modern organizations. Connect your entire ecosystem and never lose institutional knowledge again.
            </p>
            <div className="flex items-center gap-4 text-zinc-500">
              <Link href="https://twitter.com/corely" className="hover:text-zinc-900 transition-colors">
                <MessageSquare size={20} />
              </Link>
              <Link href="https://github.com/corely" className="hover:text-zinc-900 transition-colors">
                <Hash size={20} />
              </Link>
              <Link href="https://corely.ai" className="hover:text-zinc-900 transition-colors">
                <Globe size={20} />
              </Link>
            </div>
          </div>
          
          {/* Links Columns */}
          <div>
            <h3 className="text-zinc-900 font-semibold mb-4 text-sm">Product</h3>
            <ul className="flex flex-col gap-3 text-sm text-zinc-600 font-light">
              <li><Link href="/#features" className="hover:text-zinc-900 transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-zinc-900 transition-colors">Integrations</Link></li>
              <li><Link href="/pricing" className="hover:text-zinc-900 transition-colors">Pricing</Link></li>
              <li><Link href="/changelog" className="hover:text-zinc-900 transition-colors">Changelog</Link></li>
              <li><Link href="/#security" className="hover:text-zinc-900 transition-colors">Security</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-zinc-900 font-semibold mb-4 text-sm">Company</h3>
            <ul className="flex flex-col gap-3 text-sm text-zinc-600 font-light">
              <li><Link href="/" className="hover:text-zinc-900 transition-colors">About Us</Link></li>
              <li><Link href="/" className="hover:text-zinc-900 transition-colors">Careers</Link></li>
              <li><Link href="/blog" className="hover:text-zinc-900 transition-colors">Blog</Link></li>
              <li><Link href="/" className="hover:text-zinc-900 transition-colors">Contact</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-zinc-900 transition-colors">Manifesto</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-zinc-900 font-semibold mb-4 text-sm">Legal</h3>
            <ul className="flex flex-col gap-3 text-sm text-zinc-600 font-light">
              <li><Link href="/" className="hover:text-zinc-900 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/" className="hover:text-zinc-900 transition-colors">Terms of Service</Link></li>
              <li><Link href="/" className="hover:text-zinc-900 transition-colors">Cookie Policy</Link></li>
              <li><Link href="/" className="hover:text-zinc-900 transition-colors">DPA</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-black/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500 text-sm font-light">
            © {new Date().getFullYear()} Corely Enterprise. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-zinc-500 text-sm font-light">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
