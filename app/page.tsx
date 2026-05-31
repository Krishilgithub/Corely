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
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 rounded-2xl border border-black/[0.07] bg-white/85 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-300">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Corely" width={32} height={32} className="rounded-lg shadow-[0_0_14px_rgba(255,107,0,0.35)]" />
            <span className="text-zinc-900 font-extrabold text-xl tracking-tight">Corely</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
            <Link href="#features" className="hover:text-zinc-900 transition-colors duration-150 relative group">
              Product
              <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-[#ff6b00] transition-all duration-200 group-hover:w-full rounded-full" />
            </Link>
            <Link href="#how-it-works" className="hover:text-zinc-900 transition-colors duration-150 relative group">
              Solutions
              <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-[#ff6b00] transition-all duration-200 group-hover:w-full rounded-full" />
            </Link>
            <Link href="/pricing" className="hover:text-zinc-900 transition-colors duration-150 relative group">
              Pricing
              <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-[#ff6b00] transition-all duration-200 group-hover:w-full rounded-full" />
            </Link>
            <Link href="/changelog" className="hover:text-zinc-900 transition-colors duration-150 relative group">
              Changelog
              <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-[#ff6b00] transition-all duration-200 group-hover:w-full rounded-full" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors duration-150">
              Log in
            </Link>
            <Link href="/signup" className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#ff6b00] text-white text-sm font-bold rounded-xl hover:bg-[#e54e00] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-4px_rgba(255,107,0,0.45)] shadow-[0_4px_12px_rgba(255,107,0,0.25)] transition-all duration-200">
              Start Free →
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
