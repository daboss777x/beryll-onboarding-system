"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { MotionConfig, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { Button, GlassCard, cn } from "@/components/ui";

export interface ExplainerProps {
  /** Called once, the first time the last step is viewed (lesson can award XP). */
  onComplete?: () => void;
}

export function useStepper(count: number, onComplete?: () => void, intervalMs = 5200) {
  const reduced = !!useReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const fired = useRef(false);
  const cb = useRef(onComplete);
  useEffect(() => {
    cb.current = onComplete;
  });

  const last = count - 1;
  const isPlaying = playing && !reduced && index < last;

  useEffect(() => {
    if (index === last && !fired.current) {
      fired.current = true;
      cb.current?.();
    }
  }, [index, last]);

  useEffect(() => {
    if (!isPlaying) return;
    const t = setTimeout(() => setIndex((i) => Math.min(i + 1, last)), intervalMs);
    return () => clearTimeout(t);
  }, [isPlaying, index, last, intervalMs]);

  const next = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.min(i + 1, last));
  }, [last]);
  const prev = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);
  const goTo = useCallback((i: number) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(i, last)));
  }, [last]);
  const replay = useCallback(() => {
    setIndex(0);
    setPlaying(true);
  }, []);
  const toggle = useCallback(() => {
    if (index >= last) {
      setIndex(0);
      setPlaying(true);
    } else setPlaying((p) => !p);
  }, [index, last]);

  return { index, last, reduced, isPlaying, next, prev, goTo, replay, toggle };
}

export type Stepper = ReturnType<typeof useStepper>;

interface ShellProps {
  title: string;
  stepper: Stepper;
  stepTitle: string;
  caption: ReactNode;
  children: ReactNode;
  /** Hide step-by-step controls (not used for sorting practice phase). */
  arrowKeys?: boolean;
  className?: string;
  footer?: ReactNode;
}

/** Shared frame: title, stage, caption (live region), progress and Play/Prev/Next/Replay controls. */
export function ExplainerShell({ title, stepper: s, stepTitle, caption, children, arrowKeys = true, className, footer }: ShellProps) {
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (!arrowKeys) return;
    const t = e.target as HTMLElement;
    if (t.closest("input, select, textarea, [data-no-arrows]")) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      s.next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      s.prev();
    }
  };
  const atEnd = s.index === s.last;
  return (
    <MotionConfig reducedMotion="user" transition={s.reduced ? { duration: 0 } : undefined}>
      <GlassCard
        role="group"
        aria-roledescription="animated explainer"
        aria-label={title}
        onKeyDown={onKey}
        padding="none"
        className={cn("w-full max-w-full overflow-hidden", className)}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <h3 className="text-base font-semibold sm:text-lg">{title}</h3>
          <span className="shrink-0 text-xs font-medium text-muted" aria-hidden>
            Step {s.index + 1} of {s.last + 1}
          </span>
        </header>

        <div className="px-3 py-4 sm:px-5">{children}</div>

        <div className="border-t border-border bg-accent-soft/40 px-4 py-3 sm:px-5" aria-live="polite" aria-atomic="true">
          <p className="text-sm font-semibold text-accent">
            <span className="sr-only">Step {s.index + 1} of {s.last + 1}. </span>
            {stepTitle}
          </p>
          <div className="mt-1 text-sm text-text">{caption}</div>
        </div>

        <div
          className="h-1 bg-grey-200 [[data-theme=dark]_&]:bg-white/10"
          role="progressbar"
          aria-label="Explainer progress"
          aria-valuemin={1}
          aria-valuemax={s.last + 1}
          aria-valuenow={s.index + 1}
        >
          <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${((s.index + 1) / (s.last + 1)) * 100}%` }} />
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
          {!s.reduced && (
            <Button size="sm" variant="primary" onClick={s.toggle} leftIcon={s.isPlaying ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}>
              {s.isPlaying ? "Pause" : "Play"}
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={s.prev} disabled={s.index === 0} leftIcon={<ChevronLeft size={16} aria-hidden />}>
            Prev
          </Button>
          <Button size="sm" variant="secondary" onClick={s.next} disabled={atEnd} rightIcon={<ChevronRight size={16} aria-hidden />}>
            Next
          </Button>
          <Button size="sm" variant="ghost" onClick={s.replay} leftIcon={<RotateCcw size={16} aria-hidden />} className="ml-auto">
            Replay
          </Button>
        </div>
        {footer}
      </GlassCard>
    </MotionConfig>
  );
}
