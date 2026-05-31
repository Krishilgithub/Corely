"use client";

import HeroSection from "../components/landing/HeroSection";
import ProblemSection from "../components/landing/ProblemSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import IntegrationSection from "../components/landing/IntegrationSection";
import CTASection from "../components/landing/CTASection";
import FooterSection from "../components/landing/FooterSection";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="bg-zinc-50 min-h-screen selection:bg-[#ff6b00] selection:text-white">
      {/* Premium Navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 rounded-2xl border border-black/10 bg-white/70 backdrop-blur-xl shadow-sm transition-all duration-300">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Corely" width={32} height={32} className="rounded-lg shadow-[0_0_15px_rgba(255,107,0,0.4)]" />
            <span className="text-zinc-900 font-bold text-xl tracking-tight">Corely</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <Link href="#features" className="hover:text-zinc-900 hover:-translate-y-[1px] hover:scale-105 transition-all duration-200">Product</Link>
            <Link href="#how-it-works" className="hover:text-zinc-900 hover:-translate-y-[1px] hover:scale-105 transition-all duration-200">Solutions</Link>
            <Link href="/pricing" className="hover:text-zinc-900 hover:-translate-y-[1px] hover:scale-105 transition-all duration-200">Pricing</Link>
            <Link href="/changelog" className="hover:text-zinc-900 hover:-translate-y-[1px] hover:scale-105 transition-all duration-200">Changelog</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:-translate-y-[1px] hover:scale-105 transition-all duration-200">
              Log in
            </Link>
            <Link href="/signup" className="hidden sm:inline-flex px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-full hover:bg-zinc-800 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] shadow-md transition-all duration-300">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Sections */}
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <IntegrationSection />
      <CTASection />

      {/* Footer */}
      <FooterSection />
    </div>
  );
}
