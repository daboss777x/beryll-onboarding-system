"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { Avatar, ThemeToggle, cn } from "@/components/ui";

const ROLE_LABEL = { hire: "New hire", manager: "Manager", buddy: "Buddy" } as const;

export function UserMenu({
  name,
  title,
  role,
  align = "left",
  compact,
}: {
  name: string;
  title: string;
  role: keyof typeof ROLE_LABEL;
  align?: "left" | "right";
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 text-left hover:bg-surface-strong",
          compact && "w-auto",
        )}
      >
        <Avatar name={name} size={32} />
        {!compact && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="block truncate text-xs text-muted">{ROLE_LABEL[role]}</span>
          </span>
        )}
        <ChevronDown size={16} aria-hidden className="text-muted" />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "glass-strong absolute z-50 mt-2 w-64 rounded-lg p-3 shadow-pop",
            align === "right" ? "right-0" : "left-0",
            !compact && "bottom-full mb-2 mt-0",
          )}
        >
          <div className="mb-3">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-muted">
              {title} · {ROLE_LABEL[role]}
            </p>
          </div>
          <div className="mb-3 flex items-center justify-between gap-2 text-sm">
            <span className="text-muted">Theme</span>
            <ThemeToggle />
          </div>
          <form method="post" action="/logout">
            <button
              type="submit"
              role="menuitem"
              className="flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-sm font-medium text-danger hover:bg-danger-soft"
            >
              <LogOut size={16} aria-hidden /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
