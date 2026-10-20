"use client";

import HeroSection from "../components/landing/HeroSection";
import ProblemSection from "../components/landing/ProblemSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import IntegrationSection from "../components/landing/IntegrationSection";
import CTASection from "../components/landing/CTASection";
import FooterSection from "../components/landing/FooterSection";
import LandingNavbar from "../components/landing/LandingNavbar";

export default function LandingPage() {
  return (
    <div className="bg-canvas text-text-primary min-h-screen w-full overflow-x-clip selection:bg-[var(--accent-soft)]">
      {/* Floating pill navbar */}
      <LandingNavbar />

      {/* Main sections */}
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
