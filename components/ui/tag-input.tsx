"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A text field that turns entries into chips. Enter or a comma adds a chip,
 * Backspace on an empty field removes the last one. Pasting "a, b, c" adds three.
 */
export function TagInput({
  id,
  value,
  onChange,
  placeholder,
  max = 20,
  maxLength = 60,
  className,
}: {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
  maxLength?: number;
  className?: string;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (raw: string) => {
    const parts = raw.split(",").map(p => p.trim().slice(0, maxLength)).filter(Boolean);
    if (!parts.length) return;
    const seen = new Set(value.map(v => v.toLowerCase()));
    const next = [...value];
    for (const p of parts) {
      if (next.length >= max) break;
      if (!seen.has(p.toLowerCase())) { next.push(p); seen.add(p.toLowerCase()); }
    }
    onChange(next);
    setDraft("");
  };

  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));

  return (
    <div className={cn("ui-input ui-tag-input", className)} onClick={() => inputRef.current?.focus()}>
      <AnimatePresence initial={false}>
        {value.map((tag, i) => (
          <motion.span
            key={tag}
            className="ui-tag"
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
          >
            {tag}
            <button type="button" onClick={e => { e.stopPropagation(); remove(i); }} aria-label={`Remove ${tag}`}>
              <X size={12} />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <input
        id={id}
        ref={inputRef}
        value={draft}
        onChange={e => {
          const v = e.target.value;
          if (v.includes(",")) add(v); else setDraft(v);
        }}
        onKeyDown={e => {
          if (e.key === "Enter") { e.preventDefault(); add(draft); }
          else if (e.key === "Backspace" && !draft && value.length) remove(value.length - 1);
        }}
        onBlur={() => add(draft)}
        placeholder={value.length ? "" : placeholder}
        disabled={value.length >= max}
        aria-label={placeholder}
      />
    </div>
  );
}
