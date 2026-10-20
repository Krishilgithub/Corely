import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

/**
 * Maps a status word to a badge tone.
 * synced / active / connected / completed → success
 * syncing / pending / processing / stale  → warning
 * error / failed / disconnected           → error
 * anything else                           → neutral
 */
export function toneForStatus(status?: string | null): StatusTone {
  const s = (status || "").toLowerCase();
  if (["synced", "active", "connected", "completed", "success", "healthy", "approved", "live", "fresh"].includes(s)) return "success";
  if (["syncing", "pending", "processing", "queued", "stale", "running", "paused", "warning"].includes(s)) return "warning";
  if (["error", "failed", "disconnected", "rejected", "critical", "high"].includes(s)) return "error";
  if (["info", "new", "beta"].includes(s)) return "info";
  return "neutral";
}

/** Pill-shaped status badge. Colour carries status only. */
export function StatusBadge({
  tone = "neutral",
  children,
  dot = false,
  className,
}: {
  tone?: StatusTone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("ui-badge", `ui-badge--${tone}`, className)}>
      {dot && <span className="ui-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
