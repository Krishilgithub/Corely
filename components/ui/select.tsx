"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  /** Icon shown at the start of the trigger. */
  leadingIcon?: ReactNode;
  /** Search box inside the menu. Defaults to on when there are more than 8 options. */
  searchable?: boolean;
  size?: "md" | "sm";
  /**
   * "input": looks like a text field (forms).
   * "chip": a filter chip, "+ Label" when empty and "Label: Value ×" when set.
   */
  variant?: "input" | "chip";
  /** Chip variant: the filter name, e.g. "Status". */
  chipLabel?: string;
  /** Chip variant: the value that means "no filter" (default ""). */
  emptyValue?: string;
  "aria-label"?: string;
  className?: string;
  menuWidth?: number;
};

const MENU_MAX_H = 300;

/**
 * Custom dropdown that replaces the native <select>: styled menu, check on
 * the chosen option, optional search, full keyboard support, and it flips
 * above the trigger when there is no room below.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  id,
  disabled,
  required,
  leadingIcon,
  searchable,
  size = "md",
  variant = "input",
  chipLabel,
  emptyValue = "",
  className,
  menuWidth,
  ...rest
}: Props) {
  const autoId = useId();
  const listId = `${id ?? autoId}-list`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number; width: number; up: boolean } | null>(null);
  const typeahead = useRef({ text: "", at: 0 });

  const showSearch = searchable ?? options.length > 8;
  const selected = options.find(o => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter(o => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.max(menuWidth ?? r.width, variant === "chip" ? 220 : 180);
    const below = window.innerHeight - r.bottom;
    const up = below < MENU_MAX_H + 16 && r.top > below;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    setPos({ left, top: up ? r.top - 6 : r.bottom + 6, width, up });
  }, [menuWidth, variant]);

  const openMenu = () => {
    if (disabled) return;
    setQuery("");
    const i = options.findIndex(o => o.value === value);
    setActive(i >= 0 ? i : 0);
    place();
    setOpen(true);
  };
  const close = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };
  const choose = (o: SelectOption) => {
    if (o.disabled) return;
    onChange(o.value);
    close();
  };

  useLayoutEffect(() => { if (open) place(); }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !triggerRef.current?.contains(t)) close(false);
    };
    const onMove = () => place();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 0);
    else setTimeout(() => menuRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the active option in view.
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const move = (dir: 1 | -1) => {
    if (!filtered.length) return;
    let i = active;
    for (let n = 0; n < filtered.length; n++) {
      i = (i + dir + filtered.length) % filtered.length;
      if (!filtered[i].disabled) break;
    }
    setActive(i);
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(filtered.length - 1); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[active]) choose(filtered[active]); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") { close(false); }
    else if (!showSearch && e.key.length === 1) {
      // Type to jump to an option.
      const now = Date.now();
      typeahead.current.text = now - typeahead.current.at < 600 ? typeahead.current.text + e.key.toLowerCase() : e.key.toLowerCase();
      typeahead.current.at = now;
      const i = filtered.findIndex(o => o.label.toLowerCase().startsWith(typeahead.current.text));
      if (i >= 0) setActive(i);
    }
  };

  const isEmpty = value === emptyValue || !selected;
  const chipText = chipLabel ?? placeholder;

  return (
    <>
      {variant === "chip" ? (
        <span className={cn("ui-filter-chip", !isEmpty && "is-active", className)}>
          <button
            ref={triggerRef}
            id={id}
            type="button"
            className="ui-filter-chip__main"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            aria-label={rest["aria-label"] ?? chipText}
            disabled={disabled}
            onClick={() => (open ? close() : openMenu())}
            onKeyDown={e => { if (["ArrowDown", "Enter", " "].includes(e.key) && !open) { e.preventDefault(); openMenu(); } }}
          >
            {isEmpty ? <Plus size={14} /> : leadingIcon}
            <span className="ui-filter-chip__label">{chipText}</span>
            {!isEmpty && <span className="ui-filter-chip__value">{selected?.label}</span>}
          </button>
          {!isEmpty && (
            <button type="button" className="ui-filter-chip__clear" onClick={() => onChange(emptyValue)} aria-label={`Clear ${chipText} filter`}>
              <X size={12} />
            </button>
          )}
        </span>
      ) : (
        <button
          ref={triggerRef}
          id={id}
          type="button"
          className={cn("ui-input ui-select", size === "sm" && "ui-select--sm", className)}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={rest["aria-label"]}
          disabled={disabled}
          data-placeholder={!selected || undefined}
          onClick={() => (open ? close() : openMenu())}
          onKeyDown={e => { if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key) && !open) { e.preventDefault(); openMenu(); } }}
        >
          {(leadingIcon || selected?.icon) && <span className="ui-select__icon">{selected?.icon ?? leadingIcon}</span>}
          <span className="ui-select__value">{selected?.label ?? placeholder}</span>
          <ChevronDown size={16} className="ui-select__chevron" data-open={open || undefined} />
        </button>
      )}

      {/* Lets the browser block form submit when a required choice is empty. */}
      {required && (
        <input className="ui-select__native" tabIndex={-1} aria-hidden="true" required value={value} onChange={() => {}} />
      )}

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div
              ref={menuRef}
              className="ui-select-menu ui-popover"
              style={{
                left: pos.left,
                width: pos.width,
                ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }),
              }}
              initial={{ opacity: 0, y: pos.up ? 4 : -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: pos.up ? 4 : -4 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              tabIndex={-1}
              onKeyDown={onMenuKey}
            >
              {showSearch && (
                <div className="ui-select-menu__search">
                  <Search size={14} />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={e => { setQuery(e.target.value); setActive(0); }}
                    placeholder="Search"
                    aria-label="Search options"
                    aria-controls={listId}
                  />
                </div>
              )}
              <div id={listId} role="listbox" className="ui-select-menu__list" aria-activedescendant={filtered[active] ? `${listId}-${active}` : undefined}>
                {filtered.length === 0 ? (
                  <div className="ui-select-menu__empty">No matches</div>
                ) : (
                  filtered.map((o, i) => {
                    const isSel = o.value === value;
                    return (
                      <div
                        key={o.value}
                        id={`${listId}-${i}`}
                        data-index={i}
                        role="option"
                        aria-selected={isSel}
                        aria-disabled={o.disabled || undefined}
                        className={cn("ui-select-option", i === active && "is-active", isSel && "is-selected", o.disabled && "is-disabled")}
                        onMouseEnter={() => setActive(i)}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => choose(o)}
                      >
                        {o.icon && <span className="ui-select-option__icon">{o.icon}</span>}
                        <span className="ui-select-option__text">
                          <span className="ui-select-option__label">{o.label}</span>
                          {o.description && <span className="ui-select-option__desc">{o.description}</span>}
                        </span>
                        {isSel && <Check size={15} className="ui-select-option__check" />}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
