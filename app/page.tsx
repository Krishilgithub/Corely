"use client";

import HeroSection from "../components/landing/HeroSection";
import ProblemSection from "../components/landing/ProblemSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import IntegrationSection from "../components/landing/IntegrationSection";
import CTASection from "../components/landing/CTASection";
import FooterSection from "../components/landing/FooterSection";

export default function LandingPage() {
  return (
    <div className="bg-zinc-50 min-h-screen selection:bg-[#ff6b00] selection:text-white">
      {/* Premium Navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 rounded-2xl border border-black/10 bg-white/70 backdrop-blur-xl shadow-sm transition-all duration-300">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b00] to-[#ff9240] flex items-center justify-center shadow-[0_0_15px_rgba(255,107,0,0.4)]">
              <span className="text-white font-bold text-lg leading-none transform -rotate-45 block">
                ◆
              </span>
            </div>
            <span className="text-zinc-900 font-bold text-xl tracking-tight">Corely</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <a href="#" className="hover:text-zinc-900 transition-colors">Product</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Solutions</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Pricing</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Changelog</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              Log in
            </a>
            <a href="/login" className="hidden sm:inline-flex px-4 py-2 bg-zinc-900 text-white text-sm font-semibold rounded-full hover:bg-zinc-800 shadow-md hover:shadow-lg transition-all">
              Start Free
            </a>
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
