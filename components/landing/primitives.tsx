"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

/*
 * Small shared pieces for the public marketing pages.
 * They keep every landing section on the same pattern:
 * small uppercase eyebrow, large headline, grey sub copy,
 * neutral hairline cards and near-black primary buttons.
 */

/* Primary call to action: near-black fill, inverts in dark mode. */
export const ctaPrimary =
  "group inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-accent-fill text-accent-fg text-sm font-semibold shadow-2xs hover:bg-[var(--accent-fill-hover)] active:scale-[0.98] transition-[transform,background-color] duration-200 cursor-pointer whitespace-nowrap";

/* Secondary call to action: white surface with a hairline border. */
export const ctaSecondary =
  "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md border border-hairline bg-surface text-text-primary text-sm font-semibold shadow-2xs hover:bg-surface-hover hover:border-border-strong active:scale-[0.98] transition-[transform,background-color,border-color] duration-200 cursor-pointer whitespace-nowrap";

/* Arrow that slides right when its parent `group` is hovered. */
export const ctaArrow = "w-4 h-4 transition-transform duration-200 group-hover:translate-x-1";

/* Neutral card used across sections. Hover only darkens the border. */
export const landingCard =
  "rounded-2xl border border-hairline bg-surface transition-colors duration-200 hover:border-border-strong";

/* Fade-up reveal for landing content (0.6s, ease-out, runs once). */
export const revealProps = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

/* A neutral square tile that holds a lucide line icon. */
export function IconTile({
  children,
  size = "md",
  className,
}: {
  children: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "shrink-0 inline-flex items-center justify-center rounded-lg border border-hairline bg-surface-secondary text-icon-primary",
        size === "sm" ? "size-8 [&_svg]:size-4" : "size-10 [&_svg]:size-5",
        className
      )}
    >
      {children}
    </div>
  );
}

/* Small uppercase label that sits above a section headline. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary",
        className
      )}
    >
      <span className="h-px w-5 bg-border-strong" aria-hidden="true" />
      {children}
    </span>
  );
}

/* Section header: eyebrow, headline and one short paragraph. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <motion.div
      {...revealProps}
      className={cn(
        "flex flex-col gap-5 max-w-3xl",
        centered ? "mx-auto items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.1] text-text-primary">
        {title}
      </h2>
      {description && (
        <p className={cn("text-base sm:text-lg leading-relaxed text-text-secondary max-w-2xl", centered && "mx-auto")}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
