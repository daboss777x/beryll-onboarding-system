"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Eraser, Eye, HardHat, MessageCircle, RotateCw, ShieldAlert, ShieldCheck, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { Badge, cn } from "@/components/ui";
import { ExplainerShell, useStepper, type ExplainerProps } from "./ExplainerShell";

interface Phase {
  id: string;
  name: string;
  icon: ReactNode;
  happening: string;
  say: string;
}
const Z = 20;
const PHASES: Phase[] = [
  { id: "prepare", name: "Prepare", icon: <HardHat size={Z} />, happening: "Before anything goes wrong: a plan, contacts and practice drills are in place.", say: "\"Do you have an incident plan, and who gets the 3am call? We can help you write and rehearse one.\"" },
  { id: "detect", name: "Detect", icon: <Eye size={Z} />, happening: "Something odd is spotted and the team confirms whether it is a real attack.", say: "\"We have seen unusual activity and are confirming what it is. We will update you within the hour.\"" },
  { id: "contain", name: "Contain", icon: <ShieldAlert size={Z} />, happening: "Stop it spreading: isolate affected machines and block the attacker.", say: "\"We are isolating the affected systems so it cannot spread. Some services may be offline for a short while.\"" },
  { id: "eradicate", name: "Eradicate", icon: <Eraser size={Z} />, happening: "Remove the attacker's access and anything they left behind.", say: "\"We are removing the attacker's access and closing the door they used. We will confirm when it is clean.\"" },
  { id: "recover", name: "Recover", icon: <Wrench size={Z} />, happening: "Bring systems back safely and watch closely for a repeat.", say: "\"Your systems are coming back online in stages, and we are monitoring closely for any sign of a repeat.\"" },
  { id: "lessons", name: "Lessons learned", icon: <BookOpen size={Z} />, happening: "Review what happened, fix the root cause, and update the plan.", say: "\"Here is what happened and what we will change so it does not happen again. Let's also book a follow-up review.\"" },
];

const R = 36; // % radius of the wheel
function pos(i: number, n: number) {
  const a = (i / n) * 2 * Math.PI - Math.PI / 2;
  return { x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a) };
}

export function IncidentResponse({ onComplete }: ExplainerProps) {
  const s = useStepper(PHASES.length, onComplete, 5500);
  const cur = PHASES[s.index];
  const n = PHASES.length;
  const circ = 2 * Math.PI * R;
  return (
    <ExplainerShell
      title="Incident response: the six-phase wheel"
      stepper={s}
      stepTitle={`Phase ${s.index + 1}: ${cur.name}`}
      caption={cur.happening}
    >
      <div className="grid items-center gap-4 md:grid-cols-2">
        <div className="relative mx-auto aspect-square w-full max-w-[320px]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
            <circle cx="50" cy="50" r={R} fill="none" stroke="var(--border-strong)" strokeWidth="1.2" strokeDasharray="2 2" />
            <motion.circle
              cx="50" cy="50" r={R} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"
              transform="rotate(-90 50 50)"
              strokeDasharray={circ}
              initial={false}
              animate={{ strokeDashoffset: circ * (1 - (s.index + 1) / n) }}
              transition={{ duration: 0.7 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[38%] text-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={cur.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.2 }}>
                  <p className="font-display text-sm font-semibold leading-tight text-accent sm:text-base">{cur.name}</p>
                </motion.div>
              </AnimatePresence>
              <motion.span
                className="mt-1 inline-flex text-muted"
                animate={s.reduced ? undefined : { rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                title="The wheel loops: lessons feed the next Prepare"
              >
                <RotateCw size={14} aria-hidden />
              </motion.span>
            </div>
          </div>
          {PHASES.map((p, i) => {
            const { x, y } = pos(i, n);
            const active = i === s.index;
            const done = i < s.index;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => s.goTo(i)}
                aria-label={`Phase ${i + 1}: ${p.name}`}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "absolute flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 transition-colors",
                  active ? "border-accent bg-accent text-on-accent shadow-glow" : done ? "border-accent bg-accent-soft text-accent" : "glass text-muted",
                )}
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <motion.span className="flex" animate={active ? { scale: [1, 1.18, 1] } : { scale: 1 }} transition={active ? { repeat: Infinity, duration: 1.8 } : undefined}>
                  {p.icon}
                </motion.span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge tone="aqua"><MessageCircle size={12} aria-hidden /> What you say to the client</Badge>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.blockquote
              key={cur.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="relative rounded-xl rounded-tl-sm border border-accent bg-surface-strong p-3 text-sm leading-relaxed"
            >
              {cur.say}
            </motion.blockquote>
          </AnimatePresence>
          <p className="flex items-start gap-1.5 text-xs text-muted">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden />
            Stay calm, be honest, never guess. Engineers lead the technical work; you keep the client informed.
          </p>
        </div>
      </div>
    </ExplainerShell>
  );
}
