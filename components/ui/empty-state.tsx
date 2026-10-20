import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Empty or coming-soon block: gradient icon well, heading, one-line text,
 * then an optional action or a "Coming soon" pill.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  comingSoon = false,
  compact = false,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  comingSoon?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("ui-empty", className)} style={compact ? { padding: "32px 16px" } : undefined}>
      {icon && <span className={cn("ui-icon-well", !compact && "ui-icon-well--lg")}>{icon}</span>}
      <p className="type-heading">{title}</p>
      {description && <p className="type-subtitle ui-empty__text">{description}</p>}
      {comingSoon && <span className="ui-badge ui-badge--neutral">Coming soon</span>}
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
  );
}
