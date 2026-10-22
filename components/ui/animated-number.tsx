"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/**
 * A number that counts up to its value when it scrolls into view, and glides
 * to new values when they change. Shows the final value at once for people
 * who prefer reduced motion.
 */
export function AnimatedNumber({
  value,
  format,
  duration = 0.8,
  className,
}: {
  value: number;
  format?: Intl.NumberFormatOptions;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const reduce = useReducedMotion();
  const fmt = useRef(new Intl.NumberFormat(undefined, format));
  const [shown, setShown] = useState(reduce ? value : 0);
  const from = useRef(reduce ? value : 0);

  useEffect(() => {
    fmt.current = new Intl.NumberFormat(undefined, format);
  }, [format]);

  useEffect(() => {
    if (!inView) return;
    if (reduce) { setShown(value); from.current = value; return; }
    const controls = animate(from.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: v => setShown(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  const decimals = format?.maximumFractionDigits ?? 0;
  const display = decimals === 0 ? Math.round(shown) : shown;

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }} aria-label={fmt.current.format(value)}>
      <span aria-hidden="true">{fmt.current.format(display)}</span>
    </span>
  );
}
