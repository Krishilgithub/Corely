import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Page header: title and one-line subtitle on the left, actions on the right.
 * Put the primary action last so it sits on the far right.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("ui-page-header", className)}>
      <div className="ui-page-header__text">
        <h1 className="type-title">{title}</h1>
        {subtitle && <p className="type-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="ui-page-header__actions">{actions}</div>}
    </div>
  );
}
