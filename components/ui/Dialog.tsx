"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "./cn";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** dialog: centered modal. sheet: side panel on desktop, bottom sheet on phones. */
  variant?: "dialog" | "sheet";
  className?: string;
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Dialog({ open, onClose, title, description, children, footer, variant = "dialog", className }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => {
      const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel.current)?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const a = document.activeElement;
      if (e.shiftKey && (a === first || a === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && a === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open]);

  if (typeof document === "undefined") return null;
  const sheet = variant === "sheet";
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn("fixed inset-0 z-50 flex", sheet ? "items-end justify-end sm:items-stretch" : "items-end justify-center p-0 sm:items-center sm:p-4")}>
          <motion.div
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={sheet ? { y: 40, opacity: 0 } : { scale: 0.96, opacity: 0, y: 12 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={sheet ? { y: 40, opacity: 0 } : { scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "glass-strong relative flex max-h-[90dvh] w-full flex-col text-text",
              sheet ? "rounded-t-2xl sm:w-[26rem] sm:max-h-none sm:rounded-none sm:rounded-l-2xl" : "rounded-t-2xl sm:max-w-lg sm:rounded-2xl",
              className,
            )}
          >
            <div className="flex items-start justify-between gap-4 p-5 pb-3">
              <div>
                <h2 id={titleId} className="text-lg font-semibold">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1 text-sm text-muted">
                    {description}
                  </p>
                )}
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="-m-2 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-accent-soft hover:text-text">
                <X size={18} aria-hidden />
              </button>
            </div>
            <div className="overflow-y-auto px-5 pb-5 text-sm">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border p-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function Sheet(props: Omit<DialogProps, "variant">) {
  return <Dialog {...props} variant="sheet" />;
}
