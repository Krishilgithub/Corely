"use client";

import { useId, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type TabItem<T extends string> = { value: T; label: ReactNode; icon?: ReactNode; badge?: ReactNode };

/**
 * Tabs whose indicator glides to the selected tab.
 *  - "underline": a line under the tab strip (page sections).
 *  - "pill": a soft pill on a sunken track (filters, segmented choices).
 */
export function AnimatedTabs<T extends string>({
  items,
  value,
  onChange,
  variant = "underline",
  label,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "underline" | "pill";
  label: string;
  className?: string;
}) {
  const groupId = useId();
  const reduce = useReducedMotion();
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 500, damping: 38, mass: 0.6 };

  return (
    <div className={cn("ui-tabs", `ui-tabs--${variant}`, className)} role="tablist" aria-label={label}>
      {items.map(item => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className="ui-tabs__tab"
            onClick={() => onChange(item.value)}
            onKeyDown={e => {
              // Arrow keys move between tabs.
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              const i = items.findIndex(t => t.value === value);
              const next = items[(i + (e.key === "ArrowRight" ? 1 : -1) + items.length) % items.length];
              onChange(next.value);
            }}
          >
            {selected && (
              <motion.span
                layoutId={`${groupId}-indicator`}
                className="ui-tabs__indicator"
                transition={spring}
                aria-hidden="true"
              />
            )}
            <span className="ui-tabs__content">
              {item.icon}
              {item.label}
              {item.badge}
            </span>
          </button>
        );
      })}
    </div>
  );
}
