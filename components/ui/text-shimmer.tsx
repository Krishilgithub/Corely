import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Text with a soft light sweeping across it. Use it for short "working"
 * labels, such as "Corely is thinking". The sweep stops for people who
 * prefer reduced motion. Styles: .ui-shimmer in app/globals.css.
 */
export function TextShimmer({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("ui-shimmer", className)}>{children}</span>;
}
