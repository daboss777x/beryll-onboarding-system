"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitPulse } from "@/app/(hire)/actions";
import { Button, Textarea, cn } from "@/components/ui";
import { useReward } from "./useReward";

import { PULSE_QUESTIONS, type PulseDim as Dim } from "./pulse-copy";

const SCALE = [
  { v: 1, label: "Not at all" },
  { v: 2, label: "A little" },
  { v: 3, label: "Somewhat" },
  { v: 4, label: "Mostly" },
  { v: 5, label: "Completely" },
];

export function PulseForm({ day }: { day: number }) {
  const [vals, setVals] = useState<Partial<Record<Dim, number>>>({});
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();
  const reward = useReward();
  const router = useRouter();
  const complete = PULSE_QUESTIONS.every((q) => vals[q.id]);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!complete) {
          setError("Rate all three, from 1 to 5.");
          return;
        }
        setError(undefined);
        start(async () => {
          const res = await submitPulse({ day, clarity: vals.clarity!, confidence: vals.confidence!, belonging: vals.belonging!, comment });
          reward(res, "Pulse sent. Thank you");
          if (!res.ok) setError(res.error);
          router.refresh();
        });
      }}
    >
      {PULSE_QUESTIONS.map((q) => (
        <fieldset key={q.id} className="flex flex-col gap-2">
          <legend className="mb-1">
            <span className="block text-sm font-semibold">{q.label}</span>
            <span className="block text-sm text-muted">{q.question}</span>
          </legend>
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={q.label}>
            {SCALE.map((s) => {
              const on = vals[q.id] === s.v;
              return (
                <label
                  key={s.v}
                  className={cn(
                    "flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-md border px-1 py-1.5 text-center transition-colors",
                    "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent",
                    on ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface hover:bg-surface-strong",
                  )}
                >
                  <input type="radio" name={q.id} value={s.v} checked={on} onChange={() => setVals((v) => ({ ...v, [q.id]: s.v }))} className="sr-only" />
                  <span className="text-base font-semibold">{s.v}</span>
                  <span className="text-[10px] leading-tight text-muted sm:text-xs">{s.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      <Textarea
        label="Anything you want your manager to know? (optional)"
        hint="Your manager sees your ratings and this comment."
        rows={3}
        maxLength={1000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" loading={pending} disabled={pending} className="self-start">
        Send pulse
      </Button>
    </form>
  );
}
