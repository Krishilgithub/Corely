"use client";

import { useId, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type Segment<T extends string> = { value: T; label: ReactNode; icon?: ReactNode; count?: number; disabled?: boolean };

/**
 * Segmented control (the "sliding pill"): a few mutually exclusive choices on
 * a sunken track, with a pill that slides to the chosen one.
 * Behaves as a radio group: arrow keys move and select.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  label,
  size = "md",
  fullWidth = false,
  className,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
}) {
  const group = useId();
  const reduce = useReducedMotion();
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 520, damping: 40, mass: 0.6 };
  const enabled = segments.filter(s => !s.disabled);

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("ui-segmented", `ui-segmented--${size}`, fullWidth && "ui-segmented--full", className)}
      onKeyDown={e => {
        if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
        e.preventDefault();
        const i = enabled.findIndex(s => s.value === value);
        const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
        const next = enabled[(i + step + enabled.length) % enabled.length];
        onChange(next.value);
        (e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus();
      }}
    >
      {segments.map(s => {
        const on = s.value === value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={on}
            data-value={s.value}
            tabIndex={on ? 0 : -1}
            disabled={s.disabled}
            className="ui-segmented__item"
            onClick={() => onChange(s.value)}
          >
            {on && <motion.span layoutId={`${group}-pill`} className="ui-segmented__pill" transition={spring} aria-hidden="true" />}
            <span className="ui-segmented__content">
              {s.icon}
              {s.label}
              {s.count !== undefined && <span className="ui-segmented__count">{s.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
