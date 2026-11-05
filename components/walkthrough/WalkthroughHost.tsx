"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Lightbulb, ListChecks, MousePointer2, Pause, Play, Timer, X } from "lucide-react";
import { Badge, Button, Dialog, ProgressBar, buttonStyles, cn } from "@/components/ui";
import { getWalkthrough, MAX_ERRORS_TO_PASS, WALKTHROUGH_MODES, walkthroughHref, type Walkthrough, type WalkthroughMode, type WalkthroughResult, type WalkthroughStep } from "@/content/walkthroughs";
import { onTour, runTourCommand } from "./bus";
import { centerOf, findTarget, isFocusable, selectValue, sleep, typeInto, waitForTarget } from "./dom";
import { useWalkthroughResult, type WalkthroughCompleteHandler } from "./result";
import { buildResult } from "./score";
import { matches } from "./validators";

type Signal = { cancelled: boolean };

/**
 * Mount inside the mini-app. Reads ?walkthrough=<id>&mode=watch|guided|solo and runs the tour.
 * `onSetup` puts the app in the walkthrough's start state (fresh tour data, start view).
 * Needs a <Suspense> boundary above it (useSearchParams).
 *
 * `onComplete(result)` receives Guided and Solo results: once when the run finishes, or once with
 * `completed: false` if the hire exits after at least one step. Watch runs are not reported.
 * Without the prop, a <WalkthroughResultProvider> handler is used, else the result is logged.
 */
export function WalkthroughHost({ onSetup, onComplete, exitFocusId }: { onSetup: (wt: Walkthrough) => void; onComplete?: WalkthroughCompleteHandler; exitFocusId?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [run, setRun] = useState(0);
  // The overlay is client-only: it depends on the viewport, reduced-motion preference and live DOM
  // rects, none of which the server knows. Rendering it only after mount keeps hydration exact.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const wt = getWalkthrough(params.get("walkthrough"));
  const modeParam = params.get("mode");
  const mode = (WALKTHROUGH_MODES as readonly string[]).includes(modeParam ?? "") ? (modeParam as WalkthroughMode) : "guided";

  const exit = useCallback(() => {
    router.replace(pathname, { scroll: false });
    requestAnimationFrame(() => (exitFocusId ? document.getElementById(exitFocusId) : null)?.focus());
  }, [router, pathname, exitFocusId]);

  if (!wt || !mounted) return null;
  return <Runner key={`${wt.id}-${mode}-${run}`} wt={wt} mode={mode} onSetup={onSetup} onComplete={onComplete} onExit={exit} onRestart={() => setRun((r) => r + 1)} />;
}

function Runner({ wt, mode, onSetup, onComplete, onExit: leave, onRestart }: { wt: Walkthrough; mode: WalkthroughMode; onSetup: (wt: Walkthrough) => void; onComplete?: WalkthroughCompleteHandler; onExit: () => void; onRestart: () => void }) {
  const steps = useMemo(() => (mode === "solo" ? wt.steps.filter((s) => s.action !== "observe") : wt.steps), [wt, mode]);
  const reduce = useReducedMotion() ?? false;
  const { report } = useWalkthroughResult(onComplete);

  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [nudge, setNudge] = useState<string | null>(null);
  const [nudgeKey, setNudgeKey] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<WalkthroughResult | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number; pressed: boolean } | null>(null);

  const indexRef = useRef(0);
  const errorsRef = useRef(0);
  const startedAt = useRef(0);
  const finished = useRef(false);
  const performed = useRef(new Set<number>());
  const sigRef = useRef<Signal>({ cancelled: false });

  // ---- lifecycle -----------------------------------------------------------
  const setupRef = useRef(onSetup);
  useEffect(() => {
    setupRef.current(wt);
    startedAt.current = Date.now();
  }, [wt]);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const r = buildResult({ walkthroughId: wt.id, mode, stepsDone: steps.length, totalSteps: steps.length, errors: errorsRef.current, durationMs: Date.now() - startedAt.current });
    setResult(r);
    setCursor(null);
    void report(r);
  }, [wt.id, mode, steps.length, report]);

  // Exiting mid-run still reports what was done (completed: false), so abandoned runs are visible.
  const onExit = useCallback(() => {
    if (!finished.current && mode !== "watch" && indexRef.current > 0) {
      finished.current = true;
      void report(buildResult({ walkthroughId: wt.id, mode, stepsDone: indexRef.current, totalSteps: steps.length, errors: errorsRef.current, durationMs: Date.now() - startedAt.current }));
    }
    leave();
  }, [mode, wt.id, steps.length, report, leave]);

  const goTo = useCallback(
    (i: number) => {
      indexRef.current = i;
      setIndex(i);
      setNudge(null);
      setShowHint(false);
      if (i >= steps.length) finish();
    },
    [steps.length, finish],
  );

  // Esc exits (dialogs stop propagation of their own Esc).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  // ---- guided + solo: validate real actions from the bus --------------------
  useEffect(() => {
    if (mode === "watch") return;
    const known = new Set(steps.map((s) => s.event).filter(Boolean));
    const typed = new Set(steps.filter((s) => s.action === "type").map((s) => s.event));
    let typeTimer: ReturnType<typeof setTimeout> | undefined;
    let pending = false;

    const wrong = (msg: string) => {
      errorsRef.current += 1;
      setErrors(errorsRef.current);
      setNudge(msg);
      setNudgeKey((k) => k + 1);
    };
    const flush = () => {
      clearTimeout(typeTimer);
      if (pending) {
        pending = false;
        goTo(indexRef.current + 1);
      }
    };

    const off = onTour((name, payload) => {
      if (finished.current) return;
      let s = steps[indexRef.current];
      if (!s) return;
      if (pending && name !== s.event) flush();
      s = steps[indexRef.current];
      if (!s) return;

      // Observe step: let the user jump ahead if they already did the next action.
      if (s.action === "observe") {
        let j = indexRef.current + 1;
        while (steps[j]?.action === "observe") j++;
        const next = steps[j];
        if (next && next.event === name && matches(next, payload)) goTo(j + 1);
        return;
      }

      if (name === s.event) {
        if (matches(s, payload)) {
          if (s.action === "type") {
            clearTimeout(typeTimer);
            pending = true;
            typeTimer = setTimeout(flush, 900);
          } else goTo(indexRef.current + 1);
        } else if (s.action === "type") {
          clearTimeout(typeTimer);
          pending = false;
        } else wrong(s.hint);
        return;
      }
      if (name.endsWith("_blocked")) return wrong(typeof payload.reason === "string" ? payload.reason : s.hint);
      if (known.has(name) && !typed.has(name)) wrong(s.hint);
    });
    return () => {
      off();
      clearTimeout(typeTimer);
    };
  }, [mode, steps, goTo]);

  // ---- watch: ghost cursor performs each step --------------------------------
  const runWatchStep = useCallback(
    async (i: number, sig: Signal, fast: boolean) => {
      const s = steps[i];
      if (!s) return;
      const quick = fast || reduce;
      const el = await waitForTarget(s.target, 6000, sig);
      if (sig.cancelled) return;
      if (!el) {
        console.warn(`[walkthrough] target "${s.target}" not found, skipping step ${s.id}`);
        return;
      }
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: quick ? "auto" : "smooth" });
      await sleep(quick ? 60 : 450);
      if (sig.cancelled) return;
      setCursor({ ...centerOf(el), pressed: false });
      await sleep(quick ? 80 : 850);
      if (sig.cancelled) return;

      if (!performed.current.has(i)) {
        if (s.action === "click") {
          setCursor((c) => c && { ...c, pressed: true });
          await sleep(quick ? 0 : 160);
          if (sig.cancelled) return;
          performed.current.add(i);
          el.click();
          setCursor((c) => c && { ...c, pressed: false });
        } else if (s.action === "type") {
          await typeInto(el, s.demoValue ?? "", quick ? 0 : 32, sig);
          if (sig.cancelled) return;
          performed.current.add(i);
        } else if (s.action === "select") {
          performed.current.add(i);
          selectValue(el, s.demoValue ?? "");
        } else if (s.action === "drag" && s.dropTarget) {
          setCursor((c) => c && { ...c, pressed: true });
          const drop = await waitForTarget(s.dropTarget, 3000, sig);
          if (sig.cancelled) return;
          if (drop) {
            drop.scrollIntoView({ block: "nearest", inline: "center", behavior: quick ? "auto" : "smooth" });
            await sleep(quick ? 40 : 300);
            setCursor({ ...centerOf(drop), pressed: true });
            await sleep(quick ? 60 : 900);
            if (sig.cancelled) return;
          }
          performed.current.add(i);
          runTourCommand({ kind: "drag", source: s.target, target: s.dropTarget });
          setCursor((c) => c && { ...c, pressed: false });
        } else performed.current.add(i);
      }
      await sleep(fast ? 250 : Math.min(7000, Math.max(2600, s.narration.length * 42)));
    },
    [steps, reduce],
  );

  useEffect(() => {
    if (mode !== "watch" || paused || finished.current || index >= steps.length) return;
    const sig: Signal = { cancelled: false };
    sigRef.current = sig;
    void runWatchStep(index, sig, false).then(() => {
      if (!sig.cancelled) goTo(index + 1);
    });
    return () => {
      sig.cancelled = true;
    };
  }, [mode, paused, index, steps.length, runWatchStep, goTo]);

  const watchNext = async () => {
    sigRef.current.cancelled = true;
    const sig: Signal = { cancelled: false };
    sigRef.current = sig;
    const i = indexRef.current;
    await runWatchStep(i, sig, true);
    if (!sig.cancelled && indexRef.current === i) goTo(i + 1);
  };
  const watchBack = () => {
    sigRef.current.cancelled = true;
    goTo(Math.max(0, indexRef.current - 1));
  };

  // ---- guided: scroll to and focus each new target ---------------------------
  const popoverRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mode !== "guided" || index >= steps.length) return;
    const sig: Signal = { cancelled: false };
    void waitForTarget(steps[index].target, 4000, sig).then((el) => {
      if (sig.cancelled) return;
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.top < 72 || r.bottom > window.innerHeight - 220) el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
        if (isFocusable(el) && steps[index].action !== "observe") el.focus({ preventScroll: true });
        else popoverRef.current?.focus({ preventScroll: true });
      } else popoverRef.current?.focus({ preventScroll: true });
    });
    return () => {
      sig.cancelled = true;
    };
  }, [mode, index, steps, reduce]);

  const step = steps[index] as WalkthroughStep | undefined;

  return (
    <>
      {!result && step && mode === "guided" && (
        <>
          <Spotlight target={step.target} drop={step.action === "drag" ? step.dropTarget : undefined} dim />
          <GuidedPopover
            ref={popoverRef}
            wt={wt}
            step={step}
            index={index}
            total={steps.length}
            errors={errors}
            nudge={nudge}
            nudgeKey={nudgeKey}
            showHint={showHint}
            onHint={() => setShowHint(true)}
            onNext={() => goTo(index + 1)}
            onExit={onExit}
          />
        </>
      )}

      {!result && step && mode === "watch" && (
        <>
          <div aria-hidden className="fixed inset-0 z-[39] cursor-default" />
          <Spotlight target={step.target} drop={step.action === "drag" ? step.dropTarget : undefined} />
          {cursor && <GhostCursor {...cursor} reduce={reduce} />}
          <WatchBar wt={wt} step={step} index={index} total={steps.length} paused={paused} onPause={() => setPaused((p) => !p)} onNext={watchNext} onBack={watchBack} onExit={onExit} />
        </>
      )}

      {!result && mode === "solo" && <SoloPanel wt={wt} steps={steps} index={index} errors={errors} nudgeKey={nudgeKey} startedAt={startedAt} onExit={onExit} />}

      <ResultDialog result={result} wt={wt} onRestart={onRestart} onExit={onExit} />
    </>
  );
}

// ---- target tracking ---------------------------------------------------------

function useTargetRect(id: string | undefined) {
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  useEffect(() => {
    let raf = 0;
    let last = "";
    const loop = () => {
      const el = id ? findTarget(id) : null;
      const r = el?.getBoundingClientRect();
      const next = r ? { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } : null;
      const key = next ? `${next.x},${next.y},${next.w},${next.h}` : "";
      if (key !== last) {
        last = key;
        setRect(next);
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [id]);
  return rect;
}

function useViewport() {
  const [vp, setVp] = useState({ w: 1024, h: 768 });
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return vp;
}

// ---- overlays --------------------------------------------------------------

const PAD = 6;

function Spotlight({ target, drop, dim }: { target: string; drop?: string; dim?: boolean }) {
  const r = useTargetRect(target);
  const d = useTargetRect(drop);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40">
      {dim && !r && <div className="absolute inset-0 bg-overlay" />}
      {r && (
        <div
          className={cn("absolute rounded-lg ring-2 ring-aqua motion-safe:transition-all motion-safe:duration-300", !dim && "shadow-glow")}
          style={{ left: r.x - PAD, top: r.y - PAD, width: r.w + PAD * 2, height: r.h + PAD * 2, boxShadow: dim ? "0 0 0 200vmax var(--overlay), var(--sh-glow)" : undefined }}
        />
      )}
      {d && <div className="absolute rounded-xl border-2 border-dashed border-aqua motion-safe:animate-pulse" style={{ left: d.x - PAD, top: d.y - PAD, width: d.w + PAD * 2, height: d.h + PAD * 2 }} />}
    </div>
  );
}

function GhostCursor({ x, y, pressed, reduce }: { x: number; y: number; pressed: boolean; reduce: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[46]"
      initial={false}
      animate={{ x: x - 4, y: y - 2, scale: pressed ? 0.82 : 1 }}
      transition={reduce ? { duration: 0 } : { type: "tween", ease: "easeInOut", duration: 0.75 }}
    >
      <span className="absolute -left-3 -top-3 size-8 rounded-full bg-aqua/30 motion-safe:animate-ping" />
      <MousePointer2 size={28} className="relative fill-aqua text-grey-900 drop-shadow-lg" strokeWidth={1.5} />
    </motion.div>
  );
}

interface PopoverProps {
  wt: Walkthrough;
  step: WalkthroughStep;
  index: number;
  total: number;
  errors: number;
  nudge: string | null;
  nudgeKey: number;
  showHint: boolean;
  onHint: () => void;
  onNext: () => void;
  onExit: () => void;
  ref: React.Ref<HTMLDivElement>;
}

function GuidedPopover({ wt, step, index, total, errors, nudge, nudgeKey, showHint, onHint, onNext, onExit, ref }: PopoverProps) {
  const r = useTargetRect(step.target);
  const vp = useViewport();
  const W = Math.min(360, vp.w - 32);
  const docked = vp.w < 640 || !r;
  let style: React.CSSProperties | undefined;
  if (!docked && r) {
    const below = r.y + r.h + 16;
    const left = Math.min(Math.max(16, r.x), vp.w - W - 16);
    style = below + 260 < vp.h ? { top: below, left, width: W } : { bottom: Math.max(16, vp.h - r.y + 16), left, width: W };
  }
  const reduce = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="false"
      aria-labelledby="wt-step-title"
      aria-describedby="wt-step-body"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      key={step.id}
      className={cn("glass-strong fixed z-[45] flex flex-col gap-2.5 rounded-xl p-4 text-text", docked && "inset-x-3 bottom-3 sm:left-auto sm:right-4 sm:w-[22.5rem]")}
      style={style}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted">
          {wt.title} · Step {index + 1} of {total}
        </span>
        <button type="button" onClick={onExit} aria-label="Exit walkthrough (Esc)" className="-m-2 inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-accent-soft hover:text-text">
          <X size={16} aria-hidden />
        </button>
      </div>
      <ProgressBar value={(index / total) * 100} size="sm" />
      <h2 id="wt-step-title" className="text-base font-semibold">
        {step.title}
      </h2>
      <p id="wt-step-body" aria-live="polite" className="text-sm text-muted">
        {step.narration}
      </p>
      {nudge && (
        <motion.p key={nudgeKey} role="alert" initial={reduce ? false : { x: -6 }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 600, damping: 12 }} className="rounded-md bg-warn-soft px-3 py-2 text-sm text-warn">
          Not quite. {nudge}
        </motion.p>
      )}
      {showHint && !nudge && <p className="rounded-md bg-accent-soft px-3 py-2 text-sm text-text">{step.hint}</p>}
      {!r && <p className="text-xs text-muted">Waiting for this part of the app to appear…</p>}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted">
          {errors} error{errors === 1 ? "" : "s"}
        </span>
        {step.action === "observe" ? (
          <Button size="sm" onClick={onNext} rightIcon={<ChevronRight size={16} aria-hidden />}>
            Next
          </Button>
        ) : (
          !showHint && (
            <Button size="sm" variant="ghost" onClick={onHint} leftIcon={<Lightbulb size={16} aria-hidden />}>
              Show hint
            </Button>
          )
        )}
      </div>
    </motion.div>
  );
}

function WatchBar({ wt, step, index, total, paused, onPause, onNext, onBack, onExit }: { wt: Walkthrough; step: WalkthroughStep; index: number; total: number; paused: boolean; onPause: () => void; onNext: () => void; onBack: () => void; onExit: () => void }) {
  const pauseRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    pauseRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div role="region" aria-label="Walkthrough player" className="glass-strong fixed inset-x-3 bottom-3 z-[45] mx-auto flex max-w-2xl flex-col gap-2 rounded-xl p-4 text-text">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-medium text-muted">
          <Badge tone="aqua">Watch</Badge>
          {wt.title} · Step {index + 1} of {total}
        </span>
        <button type="button" onClick={onExit} aria-label="Exit walkthrough (Esc)" className="-m-2 inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-accent-soft hover:text-text">
          <X size={16} aria-hidden />
        </button>
      </div>
      <ProgressBar value={((index + 1) / total) * 100} size="sm" />
      <div aria-live="polite">
        <h2 className="text-base font-semibold">{step.title}</h2>
        <p className="mt-1 text-sm text-muted">{step.narration}</p>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onBack} disabled={index === 0} leftIcon={<ChevronLeft size={16} aria-hidden />}>
          Back
        </Button>
        <Button ref={pauseRef} size="sm" variant="secondary" onClick={onPause} leftIcon={paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}>
          {paused ? "Play" : "Pause"}
        </Button>
        <Button size="sm" onClick={onNext} rightIcon={<ChevronRight size={16} aria-hidden />}>
          Next
        </Button>
      </div>
    </div>
  );
}

function SoloPanel({ wt, steps, index, errors, nudgeKey, startedAt, onExit }: { wt: Walkthrough; steps: WalkthroughStep[]; index: number; errors: number; nudgeKey: number; startedAt: React.RefObject<number>; onExit: () => void }) {
  const [now, setNow] = useState(0);
  const [open, setOpen] = useState(true);
  const reduce = useReducedMotion();
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const elapsed = now && startedAt.current ? now - startedAt.current : 0;
  return (
    <aside aria-label="Solo task checklist" className="glass-strong fixed bottom-3 right-3 z-[45] w-[min(22rem,calc(100vw-1.5rem))] rounded-xl p-4 text-text">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge tone="aqua">Solo</Badge>
          <span className="text-sm font-semibold">{wt.title}</span>
        </div>
        <button type="button" onClick={onExit} aria-label="Exit walkthrough (Esc)" className="-m-2 inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-accent-soft hover:text-text">
          <X size={16} aria-hidden />
        </button>
      </div>
      <div className="mt-2 flex items-center gap-4 text-sm">
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <Timer size={16} aria-hidden className="text-accent" /> {formatDuration(elapsed)}
        </span>
        <motion.span key={nudgeKey} initial={reduce || nudgeKey === 0 ? false : { scale: 1.25 }} animate={{ scale: 1 }} className={cn("tabular-nums", errors > MAX_ERRORS_TO_PASS ? "text-danger" : errors > 0 ? "text-warn" : "text-muted")}>
          {errors} error{errors === 1 ? "" : "s"}
        </motion.span>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="ml-auto inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-md px-2 text-xs text-muted hover:text-text">
          <ListChecks size={16} aria-hidden /> {open ? "Hide" : "Tasks"}
        </button>
      </div>
      {open && (
        <ol className="mt-3 flex max-h-[40dvh] flex-col gap-1.5 overflow-y-auto">
          {steps.map((s, i) => (
            <li key={s.id} aria-current={i === index ? "step" : undefined} className={cn("flex items-start gap-2 text-sm", i > index && "text-muted", i === index && "font-medium")}>
              <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]", i < index ? "border-accent bg-accent text-on-accent" : i === index ? "border-accent text-accent" : "border-border-strong")}>
                {i < index ? <Check size={12} strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              <span>
                {s.title}
                {i < index && <span className="sr-only"> (done)</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function ResultDialog({ result, wt, onRestart, onExit }: { result: WalkthroughResult | null; wt: Walkthrough; onRestart: () => void; onExit: () => void }) {
  const nextMode: Record<WalkthroughMode, WalkthroughMode | null> = { watch: "guided", guided: "solo", solo: null };
  const next = result ? nextMode[result.mode] : null;
  const title = !result ? "" : result.mode === "watch" ? "You've watched it through" : result.passed ? "Passed" : "Not quite yet";
  return (
    <Dialog
      open={!!result}
      onClose={onExit}
      title={title}
      description={result ? `${wt.title} · ${result.mode[0].toUpperCase()}${result.mode.slice(1)} mode` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onExit}>
            Done
          </Button>
          <Button variant="secondary" onClick={onRestart}>
            Run again
          </Button>
          {next && (
            <Link href={walkthroughHref(wt.id, next)} replace scroll={false} className={buttonStyles({})}>
              Try {next === "guided" ? "Guided" : "Solo"}
            </Link>
          )}
        </>
      }
    >
      {result && (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ResultStat label="Time" value={formatDuration(result.durationMs)} />
            <ResultStat label="Score" value={result.score === null ? "—" : String(result.score)} />
            <ResultStat label="Errors" value={result.mode === "watch" ? "—" : String(result.errors)} />
            <ResultStat label="Result" value={result.passed ? "Pass" : "Retry"} tone={result.passed ? "text-success" : "text-warn"} />
          </dl>
          <p className="text-muted">
            {result.mode === "watch"
              ? "Now do it yourself in Guided mode. You'll get a spotlight and hints on every step."
              : result.passed
                ? result.mode === "solo"
                  ? "You ran the whole task with no hints. That's exactly how you'll do it with a real client."
                  : "Nicely done. When you're ready, try it Solo: no hints, timed."
                : `Solo and Guided runs pass with ${MAX_ERRORS_TO_PASS} errors or fewer. Run it again: the rules will feel natural after a couple of goes.`}
          </p>
        </div>
      )}
    </Dialog>
  );
}

function ResultStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={cn("mt-1 font-display text-xl font-semibold tabular-nums", tone)}>{value}</dd>
    </div>
  );
}

function formatDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
