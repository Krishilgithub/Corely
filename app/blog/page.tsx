"use client";

import Link from "next/link";
import FooterSection from "../../components/landing/FooterSection";

export default function BlogPage() {
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
            <Link href="/changelog" className="hover:text-zinc-900 transition-colors">Changelog</Link>
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

      {/* Blog Header */}
      <div className="pt-40 pb-10 px-6 max-w-5xl mx-auto w-full text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-900 mb-6">Corely Blog</h1>
        <p className="text-xl text-zinc-600 font-light">
          Thoughts on AI, knowledge management, and the future of work.
        </p>
      </div>

      {/* Blog Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-32 w-full grid md:grid-cols-2 gap-8">
        
        {/* Article 1 */}
        <div className="bg-white rounded-3xl overflow-hidden border border-zinc-200 shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow">
          <div className="h-48 bg-zinc-100 flex items-center justify-center">
            <span className="text-zinc-400 font-medium tracking-widest uppercase text-sm">Editorial</span>
          </div>
          <div className="p-8 flex flex-col flex-1">
            <span className="text-[#ff6b00] text-sm font-semibold mb-2">Company News</span>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 line-clamp-2">Why we built the Institutional Memory Engine</h2>
            <p className="text-zinc-600 text-sm mb-6 line-clamp-3">Knowledge is fragmenting across Slack, Notion, Jira, and Email at an unprecedented rate. Here is why the modern enterprise needs a unified intelligence layer.</p>
            <span className="mt-auto text-sm text-zinc-400">Oct 20, 2026 • 5 min read</span>
          </div>
        </div>

        {/* Article 2 */}
        <div className="bg-white rounded-3xl overflow-hidden border border-zinc-200 shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow">
          <div className="h-48 bg-zinc-100 flex items-center justify-center">
            <span className="text-zinc-400 font-medium tracking-widest uppercase text-sm">Engineering</span>
          </div>
          <div className="p-8 flex flex-col flex-1">
            <span className="text-[#ff6b00] text-sm font-semibold mb-2">Technical Deep Dive</span>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 line-clamp-2">Scaling vector search for millions of enterprise documents</h2>
            <p className="text-zinc-600 text-sm mb-6 line-clamp-3">A look under the hood at how Corely processes, embeds, and retrieves massive volumes of unstructured data in milliseconds.</p>
            <span className="mt-auto text-sm text-zinc-400">Oct 05, 2026 • 12 min read</span>
          </div>
        </div>

      </div>

      <div className="mt-auto">
        <FooterSection />
      </div>
    </div>
  );
}
