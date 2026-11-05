"use client";

import { motion } from "framer-motion";
import { ClipboardCheck, DoorClosed, Eye, Home, ScanSearch, VenetianMask } from "lucide-react";
import type { ReactNode } from "react";
import { Badge, cn } from "@/components/ui";
import { ExplainerShell, useStepper, type ExplainerProps } from "./ExplainerShell";

interface Service {
  id: string;
  name: string;
  short: string;
  analogy: string;
  what: string;
  cost: string;
  costLevel: number;
  time: string;
  timeLevel: number;
  get: string;
  sayIt: string;
}

const SERVICES: Service[] = [
  {
    id: "scan", name: "Vulnerability scan", short: "Scan",
    analogy: "Walking round the house checking every door and window is locked.",
    what: "A tool automatically checks systems against a list of known weaknesses.",
    cost: "Lowest: roughly hundreds to a few thousand euro", costLevel: 1,
    time: "Hours to a few days", timeLevel: 1,
    get: "A list of known weaknesses, ranked by severity.",
    sayIt: "A fast, affordable health check. It finds known problems but does not try to break in.",
  },
  {
    id: "pentest", name: "Penetration test", short: "Pen test",
    analogy: "Hiring a licensed burglar to actually try to get in, then tell you how.",
    what: "An engineer manually tries to break in, chaining weaknesses together like a real attacker.",
    cost: "Mid: roughly several thousand to tens of thousands", costLevel: 3,
    time: "1 to 3 weeks", timeLevel: 3,
    get: "A report showing what was exploited, the evidence, and how to fix it.",
    sayIt: "Proof of what a real attacker could do today, with a clear fix list.",
  },
  {
    id: "redteam", name: "Red team", short: "Red team",
    analogy: "A heist crew plans a full break-in, in secret, using any trick: doors, staff, even the lock-up routine.",
    what: "A stealthy, goal-based attack on the whole organisation: people, process and technology.",
    cost: "High: often tens of thousands and up", costLevel: 5,
    time: "4 to 12 weeks", timeLevel: 5,
    get: "A story of how far the crew got, and how well the defenders noticed.",
    sayIt: "For mature clients who want to test their defenders, not just their locks.",
  },
  {
    id: "soc", name: "Managed SOC", short: "Managed SOC",
    analogy: "A guard who watches the cameras 24/7 and raises the alarm the moment something odd happens.",
    what: "Our analysts monitor the client's systems around the clock and respond to threats.",
    cost: "Ongoing: a monthly fee that scales with size", costLevel: 4,
    time: "Continuous (a 12-month contract is typical)", timeLevel: 4,
    get: "Alerts handled, monthly reports and fast response when something happens.",
    sayIt: "Not a one-off test. It is ongoing protection, so it is a subscription.",
  },
  {
    id: "audit", name: "Security audit", short: "Audit",
    analogy: "A building inspector with a checklist: is the house up to code and are the right policies in place?",
    what: "A review of policies, settings and evidence against a standard such as ISO 27001.",
    cost: "Low to mid: depends on scope", costLevel: 2,
    time: "2 to 6 weeks", timeLevel: 2,
    get: "A gap report against the standard and a to-do list for compliance.",
    sayIt: "The answer when the client says a customer or regulator is asking for proof.",
  },
];

function Meter({ label, level, text }: { label: string; level: number; text: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold text-muted">{label}</span>
        <span className="text-right text-text">{text}</span>
      </div>
      <div className="mt-1 flex gap-1" role="img" aria-label={`${label}: ${level} out of 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.span
            key={n}
            className="h-2 flex-1 rounded-full"
            initial={false}
            animate={{ backgroundColor: n <= level ? "var(--accent)" : "var(--grey-300)", opacity: n <= level ? 1 : 0.5 }}
            transition={{ delay: n * 0.05 }}
          />
        ))}
      </div>
    </div>
  );
}

/** Little house scene: each service animates a different "actor" around the same house. */
function Scene({ id }: { id: string }) {
  const loop = { repeat: Infinity, ease: "easeInOut" as const };
  let actor: ReactNode;
  if (id === "scan") {
    actor = (
      <motion.span className="absolute bottom-3 text-accent" animate={{ x: [-70, 70, -70] }} transition={{ ...loop, duration: 5 }}>
        <ScanSearch size={34} aria-hidden />
      </motion.span>
    );
  } else if (id === "pentest") {
    actor = (
      <motion.span className="absolute bottom-3 text-accent" animate={{ x: [-80, -6, -14, -6, -14, -6], rotate: [0, 0, -8, 8, -8, 0] }} transition={{ ...loop, duration: 4 }}>
        <VenetianMask size={34} aria-hidden />
      </motion.span>
    );
  } else if (id === "redteam") {
    actor = (
      <>
        {[-1, 0, 1].map((k) => (
          <motion.span key={k} className="absolute bottom-3 text-accent" style={{ left: `calc(50% + ${k * 30}px - 14px)` }} animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ ...loop, duration: 2.4, delay: k * 0.3 + 0.3 }}>
            <VenetianMask size={26} aria-hidden />
          </motion.span>
        ))}
      </>
    );
  } else if (id === "soc") {
    actor = (
      <motion.span className="absolute top-2 text-accent" animate={{ scale: [1, 1.18, 1] }} transition={{ ...loop, duration: 2 }}>
        <Eye size={32} aria-hidden />
      </motion.span>
    );
  } else {
    actor = (
      <motion.span className="absolute bottom-3 right-6 text-accent" animate={{ y: [0, -5, 0] }} transition={{ ...loop, duration: 2.4 }}>
        <ClipboardCheck size={34} aria-hidden />
      </motion.span>
    );
  }
  return (
    <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-lg border border-border bg-accent-soft/50" aria-hidden>
      <Home size={64} strokeWidth={1.5} className="text-grey-500" />
      <DoorClosed size={22} className="absolute bottom-4 left-1/2 ml-5 text-grey-500" />
      {id === "soc" && (
        <motion.span
          className="absolute size-24 rounded-full border-2 border-accent"
          animate={{ scale: [0.8, 1.5], opacity: [0.6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
        />
      )}
      {actor}
    </div>
  );
}

export function ServiceTypes({ onComplete }: ExplainerProps) {
  const s = useStepper(SERVICES.length, onComplete, 7000);
  const cur = SERVICES[s.index];
  return (
    <ExplainerShell
      title="Which security service is it?"
      stepper={s}
      stepTitle={`${cur.name}: "${cur.analogy}"`}
      caption={<>Say it to a client: {cur.sayIt}</>}
    >
      <div role="group" aria-label="Choose a service" className="mb-3 flex flex-wrap gap-2">
        {SERVICES.map((v, i) => (
          <button
            key={v.id}
            type="button"
            onClick={() => s.goTo(i)}
            aria-pressed={i === s.index}
            className={cn(
              "min-h-10 cursor-pointer rounded-full border px-3 text-sm font-medium transition",
              i === s.index ? "border-accent bg-accent text-on-accent shadow-glow" : "glass text-text hover:border-border-strong",
            )}
          >
            {v.short}
          </button>
        ))}
      </div>
      <motion.div key={cur.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Scene id={cur.id} />
          <p className="text-sm"><Badge tone="aqua" className="mr-2">In plain English</Badge>{cur.what}</p>
        </div>
        <div className="space-y-3 rounded-lg border border-border bg-surface-strong p-3">
          <Meter label="Cost" level={cur.costLevel} text={cur.cost} />
          <Meter label="Time" level={cur.timeLevel} text={cur.time} />
          <div className="text-sm">
            <p className="text-xs font-semibold text-muted">What the client gets</p>
            <p className="mt-0.5">{cur.get}</p>
          </div>
          <p className="text-xs text-muted">Costs are ballpark guides for learning. Always quote from the current price list.</p>
        </div>
      </motion.div>
    </ExplainerShell>
  );
}
