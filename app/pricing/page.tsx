"use client";

import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import FooterSection from "../../components/landing/FooterSection";

export default function PricingPage() {
  return (
    <div className="bg-zinc-50 min-h-screen selection:bg-[#ff6b00] selection:text-white flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 rounded-2xl border border-black/10 bg-white/70 backdrop-blur-xl shadow-sm transition-all duration-300">
        <div className="px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Corely" width={32} height={32} className="rounded-lg shadow-[0_0_15px_rgba(255,107,0,0.4)]" />
            <span className="text-zinc-900 font-bold text-xl tracking-tight">Corely</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <Link href="/#features" className="hover:text-zinc-900 transition-colors">Product</Link>
            <Link href="/#how-it-works" className="hover:text-zinc-900 transition-colors">Solutions</Link>
            <Link href="/pricing" className="text-zinc-900 transition-colors">Pricing</Link>
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

      {/* Pricing Header */}
      <div className="pt-40 pb-20 px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-zinc-900 mb-6">Simple, transparent pricing</h1>
        <p className="text-xl text-zinc-600 max-w-2xl mx-auto font-light">
          Scale your institutional memory with plans designed for modern organizations.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-32 w-full grid md:grid-cols-3 gap-8">
        
        {/* Starter */}
        <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-zinc-900 mb-2">Starter</h3>
          <p className="text-zinc-500 text-sm mb-6 h-10">For small teams building their first intelligence layer.</p>
          <div className="mb-6">
            <span className="text-4xl font-bold text-zinc-900">$49</span>
            <span className="text-zinc-500 font-medium"> / mo</span>
          </div>
          <Link href="/signup" className="w-full py-3 rounded-full text-center font-medium border border-zinc-200 hover:bg-zinc-50 transition-colors mb-8">
            Start Free Trial
          </Link>
          <div className="flex flex-col gap-4 mt-auto">
            <div className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-emerald-500 shrink-0" /> Up to 5 team members</div>
            <div className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-emerald-500 shrink-0" /> 3 Data Sources</div>
            <div className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-emerald-500 shrink-0" /> 10,000 Documents</div>
            <div className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-emerald-500 shrink-0" /> Standard Support</div>
          </div>
        </div>

        {/* Professional */}
        <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-xl flex flex-col relative transform md:-translate-y-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#ff6b00] to-[#ff9240] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
            Most Popular
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
          <p className="text-zinc-400 text-sm mb-6 h-10">For growing companies that need serious memory horsepower.</p>
          <div className="mb-6">
            <span className="text-4xl font-bold text-white">$199</span>
            <span className="text-zinc-400 font-medium"> / mo</span>
          </div>
          <Link href="/signup" className="w-full py-3 rounded-full text-center font-medium bg-gradient-to-r from-[#ff6b00] to-[#ff9240] text-white shadow-lg hover:shadow-xl transition-all mb-8">
            Start Free Trial
          </Link>
          <div className="flex flex-col gap-4 mt-auto">
            <div className="flex items-start gap-3 text-sm text-zinc-300"><Check size={18} className="text-[#ff9240] shrink-0" /> Up to 25 team members</div>
            <div className="flex items-start gap-3 text-sm text-zinc-300"><Check size={18} className="text-[#ff9240] shrink-0" /> 10 Data Sources</div>
            <div className="flex items-start gap-3 text-sm text-zinc-300"><Check size={18} className="text-[#ff9240] shrink-0" /> 100,000 Documents</div>
            <div className="flex items-start gap-3 text-sm text-zinc-300"><Check size={18} className="text-[#ff9240] shrink-0" /> Autonomous Actions</div>
            <div className="flex items-start gap-3 text-sm text-zinc-300"><Check size={18} className="text-[#ff9240] shrink-0" /> Priority Support</div>
          </div>
        </div>

        {/* Enterprise */}
        <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-zinc-900 mb-2">Enterprise</h3>
          <p className="text-zinc-500 text-sm mb-6 h-10">Custom intelligence layers for massive organizations.</p>
          <div className="mb-6">
            <span className="text-4xl font-bold text-zinc-900">Custom</span>
          </div>
          <Link href="/signup" className="w-full py-3 rounded-full text-center font-medium border border-zinc-200 hover:bg-zinc-50 transition-colors mb-8">
            Contact Sales
          </Link>
          <div className="flex flex-col gap-4 mt-auto">
            <div className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-emerald-500 shrink-0" /> Unlimited team members</div>
            <div className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-emerald-500 shrink-0" /> Unlimited Data Sources</div>
            <div className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-emerald-500 shrink-0" /> Unlimited Documents</div>
            <div className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-emerald-500 shrink-0" /> Custom Integrations</div>
            <div className="flex items-start gap-3 text-sm text-zinc-600"><Check size={18} className="text-emerald-500 shrink-0" /> Dedicated Success Manager</div>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <FooterSection />
      </div>
    </div>
  );
}
