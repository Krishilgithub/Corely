"use client";

import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Select, type SelectOption } from "./select";
import { cn } from "@/lib/utils";

export type FilterDef = {
  id: string;
  label: string;
  icon?: ReactNode;
  options: SelectOption[];
  /** The current choice. `emptyValue` (default "") means "no filter". */
  value: string;
  onChange: (value: string) => void;
  emptyValue?: string;
};

/**
 * Filter toolbar: search on the left, then one chip per filter
 * ("+ Status" when empty, "Status: Active ×" when set), "Clear all" when any
 * filter is on, and optional actions on the right (e.g. a segmented control).
 */
export function FilterToolbar({
  search,
  filters = [],
  leading,
  actions,
  onClearAll,
  className,
}: {
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  filters?: FilterDef[];
  /** Shown before the search, e.g. a segmented control for tabs. */
  leading?: ReactNode;
  /** Shown at the far right, e.g. a view toggle or export button. */
  actions?: ReactNode;
  /** Called by "Clear all". Defaults to clearing every filter and the search. */
  onClearAll?: () => void;
  className?: string;
}) {
  const activeCount = filters.filter(f => f.value !== (f.emptyValue ?? "")).length + (search?.value.trim() ? 1 : 0);
  const clearAll = () => {
    if (onClearAll) return onClearAll();
    filters.forEach(f => f.onChange(f.emptyValue ?? ""));
    search?.onChange("");
  };

  return (
    <div className={cn("ui-filter-toolbar", className)} role="toolbar" aria-label="Filters">
      {leading}
      {search && (
        <label className="ui-filter-toolbar__search">
          <Search size={16} aria-hidden="true" />
          <input
            className="ui-input"
            value={search.value}
            onChange={e => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? "Search"}
            aria-label={search.placeholder ?? "Search"}
          />
          {search.value && (
            <button type="button" onClick={() => search.onChange("")} aria-label="Clear search"><X size={14} /></button>
          )}
        </label>
      )}
      {filters.length > 0 && (
        <div className="ui-filter-toolbar__chips">
          {filters.map(f => (
            <Select
              key={f.id}
              variant="chip"
              chipLabel={f.label}
              leadingIcon={f.icon}
              options={f.options}
              value={f.value}
              onChange={f.onChange}
              emptyValue={f.emptyValue ?? ""}
            />
          ))}
          {activeCount > 0 && (
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>
      )}
      {actions && <div className="ui-filter-toolbar__actions">{actions}</div>}
    </div>
  );
}
