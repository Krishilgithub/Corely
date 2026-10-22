import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";

export type WellTone = "neutral" | "success" | "warning" | "muted" | "accent";

/**
 * KPI tile: gradient icon well, big metric, caption label, optional delta.
 * Use for counts. Keep the delta text short and factual ("+12 this week").
 */
export function KpiTile({
  icon,
  label,
  value,
  delta,
  deltaTone = "neutral",
  tone = "neutral",
  className,
}: {
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  deltaTone?: "success" | "warning" | "error" | "neutral";
  tone?: WellTone;
  className?: string;
}) {
  const deltaColor =
    deltaTone === "success" ? "var(--success)"
    : deltaTone === "warning" ? "var(--warning)"
    : deltaTone === "error" ? "var(--error)"
    : "var(--text-tertiary)";

  return (
    <div className={cn("ui-kpi", className)}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        {icon && <span className={cn("ui-icon-well", tone !== "neutral" && `ui-icon-well--${tone}`)}>{icon}</span>}
        {delta && (
          <span className="type-body" style={{ fontWeight: 600, color: deltaColor, fontSize: 13 }}>
            {delta}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="type-metric">{typeof value === "number" ? <AnimatedNumber value={value} /> : value}</span>
        <span className="type-caption">{label}</span>
      </div>
    </div>
  );
}
