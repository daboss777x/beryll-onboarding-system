"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileText, Handshake, Lock, LockOpen, Mail, Phone, RefreshCw, Repeat, Scale, Search, Sparkles, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { FacetNode, type FacetState } from "@/components/brand";
import { Badge, cn } from "@/components/ui";
import { ExplainerShell, useStepper, type ExplainerProps } from "./ExplainerShell";

type Owner = "bdm" | "eng" | "joint";
interface Stage {
  id: string;
  title: string;
  icon: ReactNode;
  owner: Owner;
  bdm: string;
  eng: string;
  plain: string;
  gate?: boolean;
}

const I = 16;
const STAGES: Stage[] = [
  { id: "lead", title: "Lead", icon: <Handshake size={I} />, owner: "bdm", bdm: "Find and qualify the opportunity.", eng: "Nothing yet.", plain: "Someone shows interest. You find out if they are a real fit." },
  { id: "scoping", title: "Scoping call", icon: <Phone size={I} />, owner: "joint", bdm: "Lead the call. Ask about goals, systems and deadlines.", eng: "Join to size the technical work.", plain: "A short call to learn what the client needs tested and by when." },
  { id: "sow", title: "SOW drafted", icon: <FileText size={I} />, owner: "bdm", bdm: "Write the statement of work and the price.", eng: "Check the effort estimate.", plain: "The SOW is the written promise: what we do, for how much, by when." },
  { id: "approvals", title: "Approvals (Legal, Engineer)", icon: <Scale size={I} />, owner: "joint", bdm: "Chase both sign-offs and handle client questions.", eng: "Engineer confirms it is doable. Legal checks the terms.", plain: "Two internal checks before anything goes to the client to sign." },
  { id: "auth", title: "Authorisation-to-test signed", icon: <Lock size={I} />, owner: "bdm", bdm: "Get the client's signed permission. No signature, no testing.", eng: "Wait. They may not touch a system until this is signed.", plain: "Hard gate. Testing someone's systems without written permission is a crime.", gate: true },
  { id: "testing", title: "Testing", icon: <Search size={I} />, owner: "eng", bdm: "Keep the client updated. Do not promise findings.", eng: "Run the tests and record the evidence.", plain: "Engineers do the hands-on work. You stay close to the client." },
  { id: "report", title: "Report & debrief", icon: <Mail size={I} />, owner: "joint", bdm: "Book the debrief and keep the relationship warm.", eng: "Write the report and explain the findings.", plain: "The client gets the findings and a plain-English walk-through." },
  { id: "retest", title: "Retest", icon: <Wrench size={I} />, owner: "eng", bdm: "Sell and schedule the retest.", eng: "Check that the fixes really worked.", plain: "Once the client fixes things, we check the fixes hold." },
  { id: "renewal", title: "Renewal", icon: <Repeat size={I} />, owner: "bdm", bdm: "Review results and propose next year's testing.", eng: "Advise on what to test next.", plain: "Security is never finished, so good clients come back." },
];

const ownerLabel: Record<Owner, { text: string; tone: "aqua" | "neutral" | "warn" }> = {
  bdm: { text: "You own this", tone: "aqua" },
  eng: { text: "Engineers own this", tone: "neutral" },
  joint: { text: "Shared", tone: "warn" },
};

/** Closed lock that springs open after a beat: the gate being passed. */
function GateLock({ reduced }: { reduced: boolean }) {
  const delay = reduced ? 0 : 1.4;
  return (
    <span className="relative flex size-5 items-center justify-center">
      <motion.span
        className="absolute flex"
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 0.6 }}
        transition={{ delay, duration: 0.2 }}
      >
        <Lock size={20} aria-hidden />
      </motion.span>
      <motion.span
        className="absolute flex"
        initial={{ opacity: 0, scale: 0.6, rotate: -25 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay, type: "spring", stiffness: 380, damping: 16 }}
      >
        <LockOpen size={20} aria-hidden />
      </motion.span>
    </span>
  );
}

export function EngagementLifecycle({ onComplete }: ExplainerProps) {
  const s = useStepper(STAGES.length, onComplete, 5200);
  const cur = STAGES[s.index];

  return (
    <ExplainerShell
      title="The life of an engagement"
      stepper={s}
      stepTitle={cur.title}
      caption={
        <>
          {cur.plain}{" "}
          <span className="font-medium">
            {ownerLabel[cur.owner].text}.
          </span>
        </>
      }
    >
      <p className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <Badge tone="aqua">You (BDM)</Badge>
        <Badge tone="neutral">Engineers</Badge>
        <Badge tone="warn">Shared</Badge>
        <span>Press Next to move along the path.</span>
      </p>
      <ol className="relative">
        {STAGES.map((st, i) => {
          const state: FacetState = i < s.index ? "done" : i === s.index ? "active" : st.gate ? "locked" : "available";
          const active = i === s.index;
          const passedGate = st.gate && i < s.index;
          return (
            <li key={st.id} className="relative flex gap-3 pb-3 last:pb-0" aria-current={active ? "step" : undefined}>
              {i < STAGES.length - 1 && (
                <span aria-hidden className="absolute left-5 top-10 bottom-0 w-0.5 -translate-x-1/2 bg-border-strong">
                  <motion.span
                    className="block w-full bg-accent"
                    initial={false}
                    animate={{ height: i < s.index ? "100%" : "0%" }}
                    transition={{ duration: 0.5 }}
                  />
                </span>
              )}
              <div className="relative z-10 shrink-0">
                <FacetNode state={state} size={40} label={`${st.title}`}>
                  {st.gate && active ? <GateLock reduced={s.reduced} /> : st.icon}
                </FacetNode>
              </div>
              <motion.div
                layout={!s.reduced}
                className={cn(
                  "min-w-0 flex-1 rounded-lg border px-3 py-2 transition-colors",
                  active ? "border-accent bg-surface-strong shadow-glow" : "border-border bg-transparent",
                  st.gate && !active && "border-dashed border-danger/50",
                )}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={cn("text-sm font-semibold", !active && i > s.index && "text-muted")}>{st.title}</span>
                  {st.gate && (
                    <Badge tone={passedGate ? "success" : "danger"}>
                      {passedGate ? "Gate open" : "Hard gate"}
                    </Badge>
                  )}
                  <Badge tone={ownerLabel[st.owner].tone} className="ml-auto">
                    {st.owner === "bdm" ? "BDM" : st.owner === "eng" ? "Engineers" : "Shared"}
                  </Badge>
                </div>
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-md bg-accent-soft p-2 text-xs">
                          <p className="font-semibold text-accent">BDM does</p>
                          <p className="mt-0.5 text-text">{st.bdm}</p>
                        </div>
                        <div className="rounded-md bg-grey-200/60 p-2 text-xs [[data-theme=dark]_&]:bg-white/10">
                          <p className="font-semibold text-muted">Engineers do</p>
                          <p className="mt-0.5 text-text">{st.eng}</p>
                        </div>
                      </div>
                      {st.gate && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger">
                          <Sparkles size={14} aria-hidden /> The lock opens only when the signed form arrives.
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <RefreshCw size={12} aria-hidden /> After renewal the cycle starts again.
      </p>
    </ExplainerShell>
  );
}
