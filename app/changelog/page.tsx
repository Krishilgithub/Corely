"use client";

import Link from "next/link";
import FooterSection from "../../components/landing/FooterSection";

export default function ChangelogPage() {
  return (
    <div className="bg-zinc-50 min-h-screen selection:bg-[#ff6b00] selection:text-white flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 rounded-2xl border border-black/10 bg-white/70 backdrop-blur-xl shadow-sm transition-all duration-300">
        <div className="px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b00] to-[#ff9240] flex items-center justify-center shadow-[0_0_15px_rgba(255,107,0,0.4)]">
              <span className="text-white font-bold text-lg leading-none transform -rotate-45 block">
                ◆
              </span>
            </div>
            <span className="text-zinc-900 font-bold text-xl tracking-tight">Corely</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <Link href="/#features" className="hover:text-zinc-900 transition-colors">Product</Link>
            <Link href="/#how-it-works" className="hover:text-zinc-900 transition-colors">Solutions</Link>
            <Link href="/pricing" className="hover:text-zinc-900 transition-colors">Pricing</Link>
            <Link href="/changelog" className="text-zinc-900 transition-colors">Changelog</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="hidden sm:inline-flex px-4 py-2 bg-zinc-900 text-white text-sm font-semibold rounded-full hover:bg-zinc-800 shadow-md hover:shadow-lg transition-all">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Changelog Header */}
      <div className="pt-40 pb-10 px-6 max-w-3xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-900 mb-6">Changelog</h1>
        <p className="text-xl text-zinc-600 font-light">
          New updates and improvements to Corely.
        </p>
      </div>

      {/* Changelog Feed */}
      <div className="max-w-3xl mx-auto px-6 pb-32 w-full flex flex-col gap-12">
        
        {/* Entry 1 */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 relative">
          <div className="hidden md:block w-px bg-zinc-200 absolute left-[120px] top-8 bottom-[-48px] -z-10" />
          <div className="md:w-[120px] shrink-0 pt-1">
            <span className="text-sm font-semibold text-zinc-500">Oct 24, 2026</span>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-8 border border-zinc-200 shadow-sm relative">
            <div className="hidden md:block absolute left-[-45px] top-8 w-3 h-3 rounded-full bg-white border-2 border-[#ff6b00]" />
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">Corely Intelligence Layer 2.0</h2>
            <div className="prose prose-zinc prose-sm">
              <p>Today we are thrilled to announce Corely 2.0, the biggest upgrade to our Institutional Memory Engine since launch.</p>
              <ul>
                <li><strong>Autonomous Actions:</strong> Corely can now take action across your connected tools automatically based on learned insights.</li>
                <li><strong>Dynamic Analytics:</strong> The Insights dashboard has been completely rebuilt from the ground up for real-time aggregation.</li>
                <li><strong>Linear Connector:</strong> We&apos;ve added native support for Linear to index your engineering tickets and roadmaps.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Entry 2 */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 relative">
          <div className="md:w-[120px] shrink-0 pt-1">
            <span className="text-sm font-semibold text-zinc-500">Sep 12, 2026</span>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-8 border border-zinc-200 shadow-sm relative">
            <div className="hidden md:block absolute left-[-45px] top-8 w-3 h-3 rounded-full bg-white border-2 border-zinc-300" />
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">Slack Integration & Role-Based Access</h2>
            <div className="prose prose-zinc prose-sm">
              <p>Security and seamless communication are our top priorities for September.</p>
              <ul>
                <li><strong>Slack Integration:</strong> You can now seamlessly connect Slack to index all public channels and conversations.</li>
                <li><strong>Source-Level Permissions:</strong> Admins can now restrict specific data sources to be queried only by other Admins in the workspace.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <FooterSection />
      </div>
    </div>
  );
}
