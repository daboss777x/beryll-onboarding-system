"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./cn";

export interface TabItem {
  value: string;
  label: ReactNode;
  content?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  "aria-label"?: string;
}

export function Tabs({ items, value, defaultValue, onValueChange, className, ...rest }: TabsProps) {
  const uid = useId();
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value);
  const current = value ?? inner;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const enabled = items.filter((i) => !i.disabled);

  const select = (v: string) => {
    if (value === undefined) setInner(v);
    onValueChange?.(v);
  };

  const onKey = (e: KeyboardEvent) => {
    const idx = enabled.findIndex((i) => i.value === current);
    let next = -1;
    if (e.key === "ArrowRight") next = (idx + 1) % enabled.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + enabled.length) % enabled.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = enabled.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const t = enabled[next];
    select(t.value);
    refs.current[t.value]?.focus();
  };

  const active = items.find((i) => i.value === current);
  return (
    <div className={className}>
      <div role="tablist" aria-label={rest["aria-label"]} onKeyDown={onKey} className="glass inline-flex max-w-full gap-1 overflow-x-auto rounded-lg p-1">
        {items.map((t) => {
          const on = t.value === current;
          return (
            <button
              key={t.value}
              ref={(el) => {
                refs.current[t.value] = el;
              }}
              role="tab"
              id={`${uid}-t-${t.value}`}
              aria-selected={on}
              aria-controls={`${uid}-p-${t.value}`}
              tabIndex={on ? 0 : -1}
              disabled={t.disabled}
              onClick={() => select(t.value)}
              className={cn(
                "min-h-10 shrink-0 cursor-pointer rounded-md px-4 text-sm font-medium transition disabled:opacity-40",
                on ? "bg-accent text-on-accent shadow-glass" : "text-muted hover:text-text",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {active?.content !== undefined && (
        <div role="tabpanel" id={`${uid}-p-${active.value}`} aria-labelledby={`${uid}-t-${active.value}`} tabIndex={0} className="mt-4">
          {active.content}
        </div>
      )}
    </div>
  );
}
