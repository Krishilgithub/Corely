"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FooterSection from "./FooterSection";

export default function SimplePageLayout({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-50 min-h-screen selection:bg-[#ff6b00] selection:text-white flex flex-col">
      <nav className="w-full border-b border-black/5 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <span className="text-zinc-900 font-bold tracking-tight">Corely</span>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-24">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-black tracking-tight mb-4">{title}</h1>
          <p className="text-xl text-zinc-600 font-light">{description}</p>
        </div>
        <div className="prose prose-zinc max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-[#ff6b00]">
          {children}
        </div>
      </main>
      
      <FooterSection />
    </div>
  );
}
