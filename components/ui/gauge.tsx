"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AnimatedNumber } from "./animated-number";
import { cn } from "@/lib/utils";

export type GaugeTone = "accent" | "success" | "warning" | "error" | "neutral";

/** Colour bands: a band applies from its `at` value upwards. */
export type GaugeThreshold = { at: number; tone: GaugeTone; label?: string };

const TONE_COLOR: Record<GaugeTone, string> = {
  accent: "var(--accent-fill)",
  success: "var(--success)",
  warning: "var(--warning)",
  error: "var(--error)",
  neutral: "var(--text-secondary)",
};

/** Default bands for "higher is better" values such as coverage or health. */
export const HIGHER_IS_BETTER: GaugeThreshold[] = [
  { at: 0, tone: "error", label: "Low" },
  { at: 50, tone: "warning", label: "Fair" },
  { at: 80, tone: "success", label: "Good" },
];

/** Default bands for "lower is better" values such as usage of a limit. */
export const LOWER_IS_BETTER: GaugeThreshold[] = [
  { at: 0, tone: "accent", label: "Healthy" },
  { at: 75, tone: "warning", label: "High" },
  { at: 90, tone: "error", label: "Critical" },
];

/**
 * Half-ring gauge (a 240° arc) with an animated fill, the value in the
 * middle, and a status word from the colour bands.
 */
export function Gauge({
  value,
  min = 0,
  max = 100,
  size = 160,
  thickness = 12,
  title,
  caption,
  suffix = "%",
  thresholds = HIGHER_IS_BETTER,
  className,
}: {
  value: number;
  min?: number;
  max?: number;
  size?: number;
  thickness?: number;
  title?: string;
  caption?: string;
  suffix?: string;
  thresholds?: GaugeThreshold[];
  className?: string;
}) {
  const id = useId();
  const reduce = useReducedMotion();
  const clamped = Math.max(min, Math.min(max, value));
  const ratio = max === min ? 0 : (clamped - min) / (max - min);
  const band = [...thresholds].sort((a, b) => a.at - b.at).filter(t => clamped >= t.at).pop() ?? thresholds[0];
  const color = TONE_COLOR[band?.tone ?? "accent"];

  // Geometry: a 240° arc that opens at the bottom.
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const sweep = 240;
  const start = 90 + (360 - sweep) / 2; // degrees, measured clockwise from +x
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [sx, sy] = point(start);
  const [ex, ey] = point(start + sweep);
  const arc = `M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`;
  const length = (sweep / 360) * 2 * Math.PI * r;

  return (
    <figure className={cn("ui-gauge", className)} style={{ width: size, margin: 0 }}>
      <div style={{ position: "relative", width: size, height: size * 0.86 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-labelledby={`${id}-t`}>
          <title id={`${id}-t`}>{`${title ? `${title}: ` : ""}${Math.round(clamped)}${suffix}${band?.label ? `, ${band.label}` : ""}`}</title>
          <path d={arc} fill="none" stroke="var(--surface-secondary)" strokeWidth={thickness} strokeLinecap="round" />
          <motion.path
            d={arc}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={length}
            initial={{ strokeDashoffset: reduce ? length * (1 - ratio) : length }}
            whileInView={{ strokeDashoffset: length * (1 - ratio) }}
            viewport={{ once: true }}
            transition={{ duration: reduce ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="ui-gauge__center">
          <span className="type-metric">
            <AnimatedNumber value={clamped} />{suffix}
          </span>
          {band?.label && <span className="ui-gauge__status" style={{ color }}>{band.label}</span>}
        </div>
      </div>
      {(title || caption) && (
        <figcaption className="ui-gauge__caption">
          {title && <span className="type-body" style={{ fontWeight: 600 }}>{title}</span>}
          {caption && <span className="type-caption">{caption}</span>}
        </figcaption>
      )}
    </figure>
  );
}
