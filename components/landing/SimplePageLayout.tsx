"use client";

import React from "react";
import FooterSection from "./FooterSection";
import LandingNavbar from "./LandingNavbar";

/*
 * Shell for the inner marketing pages (about, blog, legal, contact...).
 * Floating navbar, a left-aligned title block, then long-form content.
 */
export default function SimplePageLayout({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-canvas text-text-primary min-h-screen flex flex-col selection:bg-[var(--accent-soft)]">
      <LandingNavbar variant="page" />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 pt-36 pb-24">
        <div className="mb-10 pb-10 border-b border-hairline flex flex-col gap-4">
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight leading-[1.1] text-text-primary">{title}</h1>
          <p className="text-base sm:text-lg leading-relaxed text-text-secondary">{description}</p>
        </div>
        <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-text-primary prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-p:text-text-secondary prose-p:leading-7 prose-li:text-text-secondary prose-strong:text-text-primary prose-a:text-[var(--accent-text)] prose-a:font-medium prose-a:underline-offset-4">
          {children}
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
