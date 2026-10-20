"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import CorelyLogo from "@/components/icons/corely-logo";
import { useTheme } from "@/components/ThemeProvider";

const NAV_LINKS = [
  { label: "Product", href: "#features" },
  { label: "Solutions", href: "#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Changelog", href: "/changelog" },
];

/* Sun / Moon button that flips between light and dark mode. */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      className="ui-icon-btn"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

/*
 * Floating pill navbar for the marketing pages.
 * "home" shows the section links and the sign in / sign up actions.
 * "page" is for inner pages and shows a "Back to Home" link instead.
 * Below 768px the home links move into a dropdown panel behind a menu button.
 */
export default function LandingNavbar({ variant = "home" }: { variant?: "home" | "page" }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the phone menu when the screen grows past the phone breakpoint.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const close = () => mq.matches && setMenuOpen(false);
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-6xl rounded-xl border border-hairline bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] backdrop-blur-md shadow-2xs transition-colors">
      <div className="flex items-center justify-between gap-3 h-16 px-3 sm:px-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 rounded-lg p-1 text-text-primary shrink-0">
          <CorelyLogo size={24} />
          <span className="text-lg font-bold tracking-tight">Corely</span>
        </Link>

        {variant === "home" ? (
          <>
            <nav className="hidden md:flex items-center gap-1" aria-label="Main">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center h-10 px-4 rounded-md text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors duration-150 active:scale-95"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="group hidden sm:inline-flex items-center gap-2 h-10 px-4 rounded-md bg-accent-fill text-accent-fg text-sm font-semibold shadow-2xs hover:bg-[var(--accent-fill-hover)] transition-all duration-150 active:scale-95"
              >
                Sign up
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <button
                type="button"
                className="ui-icon-btn md:hidden"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="landing-mobile-menu"
              >
                {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex items-center gap-2 h-10 px-3 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to Home
            </Link>
          </div>
        )}
      </div>

      {/* Phone menu panel */}
      {variant === "home" && menuOpen && (
        <div
          id="landing-mobile-menu"
          className="md:hidden border-t border-hairline p-3 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center h-11 px-3 rounded-lg text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-2 mt-1 border-t border-hairline">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center justify-center h-11 rounded-lg border border-hairline bg-surface text-sm font-semibold text-text-primary hover:bg-surface-hover transition-colors duration-150"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-accent-fill text-accent-fg text-sm font-semibold hover:bg-[var(--accent-fill-hover)] transition-colors duration-150"
            >
              Sign up
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
