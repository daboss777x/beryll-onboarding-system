"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "./cn";

export type ToastTone = "info" | "success" | "warn" | "danger";
export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** ms; 0 = sticky. Default 4500 */
  duration?: number;
}
interface ToastItem extends ToastInput {
  id: number;
}

interface ToastApi {
  toast: (t: ToastInput) => number;
  dismiss: (id: number) => void;
}
const Ctx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast must be used inside <ToastProvider> (or <UIProvider>)");
  return c;
}

const icons = { info: Info, success: CheckCircle2, warn: AlertTriangle, danger: XCircle } as const;
const toneText: Record<ToastTone, string> = { info: "text-accent", success: "text-success", warn: "text-warn", danger: "text-danger" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((s) => s.filter((t) => t.id !== id)), []);
  const toast = useCallback(
    (t: ToastInput) => {
      const id = nextId.current++;
      setItems((s) => [...s.slice(-3), { ...t, id }]);
      const d = t.duration ?? 4500;
      if (d > 0) setTimeout(() => dismiss(id), d);
      return id;
    },
    [dismiss],
  );
  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const tone = t.tone ?? "info";
            const Icon = icons[tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="glass-strong pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg p-3.5 text-text"
              >
                <Icon size={20} aria-hidden className={cn("mt-0.5 shrink-0", toneText[tone])} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-xs text-muted">{t.description}</p>}
                </div>
                <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="-m-2 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted hover:text-text">
                  <X size={16} aria-hidden />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
