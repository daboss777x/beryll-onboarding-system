"use client";

import { useRef, useState, type ReactNode } from "react";
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Building2, CheckCircle2, FileText, GripVertical, Globe, KeyRound, Lock, XCircle } from "lucide-react";
import { Badge, cn } from "@/components/ui";
import { ExplainerShell, useStepper, type ExplainerProps } from "./ExplainerShell";

type TierId = "public" | "internal" | "confidential" | "restricted";
interface Tier {
  id: TierId;
  name: string;
  icon: ReactNode;
  rule: string;
  who: string;
  example: string;
}
const TIERS: Tier[] = [
  { id: "public", name: "Public", icon: <Globe size={18} />, rule: "Safe for anyone to see.", who: "Anyone, including the public", example: "Website pages, marketing brochures" },
  { id: "internal", name: "Internal", icon: <Building2 size={18} />, rule: "For Beryll staff only. Not harmful, but not for outsiders.", who: "All Beryll staff", example: "Price lists, staff rotas, process notes" },
  { id: "confidential", name: "Confidential", icon: <Lock size={18} />, rule: "Sensitive business information. Need-to-know only.", who: "Named people who need it", example: "Draft contracts, revenue forecasts" },
  { id: "restricted", name: "Client-Restricted", icon: <KeyRound size={18} />, rule: "It belongs to the client. Highest care, approved channels only.", who: "The engagement team and the client", example: "Test findings, client network details" },
];

interface Item {
  id: string;
  label: string;
  answer: TierId;
  why: string;
}
const ITEMS: Item[] = [
  { id: "brochure", label: "Marketing brochure", answer: "public", why: "It is made to be handed out, so anyone can see it." },
  { id: "prices", label: "Internal price list", answer: "internal", why: "Staff need it, but competitors should not have it. It is not about one client." },
  { id: "rota", label: "Staff holiday calendar", answer: "internal", why: "Harmless to staff, but no reason to share outside Beryll." },
  { id: "sow", label: "Draft SOW with Beryll margins", answer: "confidential", why: "It shows how we price, so only the deal team should see it." },
  { id: "report", label: "Client pentest report", answer: "restricted", why: "It lists a client's real weaknesses. A leak would help attackers." },
  { id: "ips", label: "Client IP range list", answer: "restricted", why: "It maps the client's systems. It is theirs, and only the test team should hold it." },
];
const tierName = (id: TierId) => TIERS.find((t) => t.id === id)!.name;

const STEP_COUNT = TIERS.length + 1;

function Chip({ item, onMove, children }: { item: Item; onMove: (t: TierId) => void; children?: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  return (
    <div className="space-y-1">
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`${item.label}. Drag to a tier, or use the select below.`}
        style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
        className={cn(
          "flex min-h-11 cursor-grab touch-manipulation items-center gap-2 rounded-lg border border-border-strong bg-surface-strong px-3 text-sm font-medium shadow-glass",
          isDragging && "relative z-50 cursor-grabbing border-accent shadow-glow",
        )}
      >
        <GripVertical size={16} className="shrink-0 text-muted" aria-hidden />
        <FileText size={16} className="shrink-0 text-accent" aria-hidden />
        <span className="min-w-0">{item.label}</span>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted">
        <span className="sr-only">Move {item.label} to</span>
        <select
          value=""
          onChange={(e) => e.target.value && onMove(e.target.value as TierId)}
          className="min-h-10 w-full cursor-pointer rounded-md border border-border-strong bg-bg-elevated px-2 text-xs text-text"
        >
          <option value="">Or choose a tier...</option>
          {TIERS.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </label>
      {children}
    </div>
  );
}

function Zone({ tier, active, drop, placed }: { tier: Tier; active: boolean; drop: boolean; placed: Item[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: tier.id, disabled: !drop });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border-2 p-3 transition-colors",
        isOver ? "border-accent bg-accent-soft shadow-glow" : active ? "border-accent bg-surface-strong shadow-glow" : "border-border bg-surface",
        !drop && !active && "opacity-70",
      )}
    >
      <div className="flex items-center gap-2 text-accent">
        {tier.icon}
        <h4 className="text-sm font-semibold text-text">{tier.name}</h4>
      </div>
      <p className="mt-1 text-xs text-muted">{tier.rule}</p>
      {!drop && active && (
        <motion.dl initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2 space-y-1 text-xs">
          <div><dt className="inline font-semibold">Who can see it: </dt><dd className="inline">{tier.who}</dd></div>
          <div><dt className="inline font-semibold">Examples: </dt><dd className="inline">{tier.example}</dd></div>
        </motion.dl>
      )}
      {drop && (
        <ul className="mt-2 min-h-8 space-y-1">
          {placed.map((it) => (
            <motion.li key={it.id} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1.5 rounded-md bg-success-soft px-2 py-1 text-xs font-medium text-success">
              <CheckCircle2 size={14} aria-hidden /> {it.label}
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DataClassification({ onComplete }: ExplainerProps) {
  // Fires when every item is sorted correctly (the real "finish" of this one), not merely on viewing the last step.
  const s = useStepper(STEP_COUNT, undefined);
  const [placed, setPlaced] = useState<Record<string, TierId>>({});
  const [fb, setFb] = useState<{ ok: boolean; text: string } | null>(null);
  const [misses, setMisses] = useState(0);
  const fired = useRef(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const practice = s.index === TIERS.length;
  const remaining = ITEMS.filter((i) => !placed[i.id]);
  const allDone = remaining.length === 0;

  const place = (itemId: string, tier: TierId) => {
    const item = ITEMS.find((i) => i.id === itemId);
    if (!item || placed[itemId]) return;
    if (item.answer === tier) {
      const next = { ...placed, [itemId]: tier };
      setPlaced(next);
      setFb({ ok: true, text: `Correct. ${item.label} is ${tierName(tier)}. ${item.why}` });
      if (ITEMS.every((i) => next[i.id]) && !fired.current) {
        fired.current = true;
        onComplete?.();
      }
    } else {
      setMisses((m) => m + 1);
      setFb({ ok: false, text: `Not quite. ${item.label} is not ${tierName(tier)}. Hint: ${item.why}` });
    }
  };
  const onDragEnd = (e: DragEndEvent) => {
    if (e.over) place(String(e.active.id), e.over.id as TierId);
  };
  const reset = () => {
    setPlaced({});
    setFb(null);
    setMisses(0);
    s.replay();
  };

  const stepTitle = practice ? "Your turn: sort the items" : `${TIERS[s.index].name}`;
  const caption = practice ? (
    <>Drag each item onto the tier it belongs in, or use the select under each item. Wrong guess? It springs back with a hint.</>
  ) : (
    <>{TIERS[s.index].rule} Seen by: {TIERS[s.index].who}.</>
  );

  return (
    <ExplainerShell
      title="Data classification: who may see what?"
      stepper={{ ...s, replay: reset }}
      stepTitle={stepTitle}
      caption={caption}
      arrowKeys={!practice}
    >
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid gap-2 sm:grid-cols-2">
          {TIERS.map((t, i) => (
            <Zone key={t.id} tier={t} active={!practice && i === s.index} drop={practice} placed={ITEMS.filter((it) => placed[it.id] === t.id)} />
          ))}
        </div>

        {practice && (
          <div className="mt-4" data-no-arrows>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold">Items to sort ({remaining.length} left)</h4>
              {misses > 0 && <Badge tone="warn">{misses} retry{misses > 1 ? "s" : ""}</Badge>}
            </div>
            {allDone ? (
              <motion.p initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-lg bg-success-soft p-3 text-sm font-medium text-success">
                All sorted. Rule of thumb: if it belongs to the client, treat it as Client-Restricted.
              </motion.p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {remaining.map((it) => (
                  <Chip key={it.id} item={it} onMove={(t) => place(it.id, t)} />
                ))}
              </div>
            )}
            <div aria-live="assertive" className="mt-3 min-h-6">
              {fb && (
                <motion.p
                  key={fb.text}
                  initial={fb.ok ? { opacity: 0 } : { x: [0, -8, 8, -6, 6, 0] }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn("flex items-start gap-1.5 text-sm font-medium", fb.ok ? "text-success" : "text-danger")}
                >
                  {fb.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden /> : <XCircle size={16} className="mt-0.5 shrink-0" aria-hidden />}
                  {fb.text}
                </motion.p>
              )}
            </div>
          </div>
        )}
      </DndContext>
    </ExplainerShell>
  );
}
