"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCheckin, saveObservation, saveQa, signOffDay90 } from "@/app/(manager)/actions";
import { Button, Checkbox, Input, Textarea, cn } from "@/components/ui";
import type { ActionResult } from "./action-types";
import { useActionToast } from "./useActionToast";

function useAction() {
  const [pending, start] = useTransition();
  const notify = useActionToast();
  const router = useRouter();
  const run = (fn: () => Promise<ActionResult>, okTitle?: string, onOk?: () => void) =>
    start(async () => {
      const res = await fn();
      if (notify(res, okTitle)) onOk?.();
      router.refresh();
    });
  return { pending, run };
}

// ---------------------------------------------------------------- check-in

export function CheckinEditor({ hireId, dueDay, label, held, notes }: { hireId: string; dueDay: number; label: string; held: boolean; notes?: string }) {
  const [text, setText] = useState(notes ?? "");
  const [isHeld, setHeld] = useState(held);
  const { pending, run } = useAction();
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveCheckin(hireId, dueDay, { held: isHeld, notes: text }), `${label} check-in saved`);
      }}
    >
      <Textarea label="Notes" rows={3} maxLength={4000} placeholder="What went well, what is blocking, what you agreed." value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox label="Held" checked={isHeld} onChange={(e) => setHeld(e.target.checked)} />
        <Button type="submit" size="sm" loading={pending} disabled={pending}>
          Save
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- certification observation

export interface CriterionView {
  id: string;
  label: string;
  question: string;
}

export function ObservationForm({ hireId, criteria, initial, initialNotes }: { hireId: string; criteria: CriterionView[]; initial: Record<string, number>; initialNotes?: string }) {
  const [scores, setScores] = useState<Record<string, number>>(initial);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const { pending, run } = useAction();
  const complete = criteria.every((c) => scores[c.id]);
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveObservation(hireId, { scores, notes }), "Observation saved");
      }}
    >
      {criteria.map((c) => (
        <fieldset key={c.id} className="flex flex-col gap-2">
          <legend className="mb-1">
            <span className="block text-sm font-semibold">{c.label}</span>
            <span className="block text-xs text-muted">{c.question}</span>
          </legend>
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={c.label}>
            {[1, 2, 3, 4, 5].map((v) => {
              const on = scores[c.id] === v;
              return (
                <label
                  key={v}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-center rounded-md border text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent",
                    on ? (v < 3 ? "border-danger bg-danger-soft text-danger" : "border-accent bg-accent-soft text-accent") : "border-border bg-surface hover:bg-surface-strong",
                  )}
                >
                  <input type="radio" className="sr-only" name={c.id} value={v} checked={on} onChange={() => setScores((s) => ({ ...s, [c.id]: v }))} />
                  {v}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      <Textarea label="Observation notes" rows={3} maxLength={2000} placeholder="What you saw on the live or recorded call." value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button type="submit" loading={pending} disabled={pending || !complete} className="self-start">
        Save observation
      </Button>
      {!complete && <p className="-mt-3 text-xs text-muted">Score every criterion to save.</p>}
    </form>
  );
}

// ---------------------------------------------------------------- QA sampling

export function QaForm({ hireId, taskId, score, notes }: { hireId: string; taskId: string; score?: number; notes?: string }) {
  const [val, setVal] = useState(score !== undefined ? String(score) : "");
  const [text, setText] = useState(notes ?? "");
  const { pending, run } = useAction();
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveQa(hireId, taskId, { score: Number(val), notes: text }), "QA score saved");
      }}
    >
      <Input label="Score (0-100)" type="number" inputMode="numeric" min={0} max={100} required value={val} onChange={(e) => setVal(e.target.value)} wrapperClassName="sm:w-32" />
      <Input label="Note" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} wrapperClassName="flex-1" />
      <Button type="submit" size="md" variant="secondary" loading={pending} disabled={pending || val === ""}>
        Save
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------- day-90 sign-off

export function SignOffForm({ hireId, firstName }: { hireId: string; firstName: string }) {
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const { pending, run } = useAction();
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => signOffDay90(hireId, { note }), "Signed off");
      }}
    >
      <Textarea label="A note for their record (optional)" rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
      <Checkbox label={`I have held the 90-day conversation with ${firstName} and they work independently.`} checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
      <Button type="submit" loading={pending} disabled={pending || !confirm} className="self-start">
        Sign off day 90
      </Button>
    </form>
  );
}
