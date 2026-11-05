"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CheckCircle2, PartyPopper, XCircle } from "lucide-react";
import { answerSpacedReview, submitReviewTask, type SpacedAnswerResult } from "@/app/(hire)/actions";
import { Badge, Button, Checkbox, EmptyState, GlassCard, ProgressBar, Textarea, buttonStyles, cn } from "@/components/ui";
import { ASSESS_OPTIONS, type ReviewDef, type ScorecardRow } from "./review-defs";
import { useReward } from "./useReward";

const SCALE = [1, 2, 3, 4, 5];

function Segmented({ name, value, options, onChange, legend }: { name: string; legend: string; value?: string; options: { v: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <label
            key={o.v}
            className={cn(
              "inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-md border px-3 text-sm font-medium transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
              value === o.v ? "border-accent bg-accent text-on-accent" : "border-border bg-surface hover:bg-surface-strong",
            )}
          >
            <input type="radio" name={name} value={o.v} checked={value === o.v} onChange={() => onChange(o.v)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ReviewTaskForm({ def, scorecard }: { def: ReviewDef; scorecard: ScorecardRow[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [assessments, setAssessments] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();
  const reward = useReward();
  const router = useRouter();

  function validate(): string | undefined {
    for (const p of def.prompts) if (p.required && (answers[p.id] ?? "").trim().length < 10) return `Answer "${p.label}" (at least 10 characters).`;
    if (def.ratings?.some((r) => !ratings[r.id])) return "Rate every statement from 1 to 5.";
    if (def.scorecard === "assess" && scorecard.some((s) => !assessments[s.id])) return "Rate yourself on every goal.";
    if (def.confirm && !confirmed) return "Tick the confirmation box first.";
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        const err = validate();
        setError(err);
        if (err) return;
        start(async () => {
          const res = await submitReviewTask(def.id, { answers, ratings, assessments, confirmed });
          reward(res, "Review saved");
          if (res.ok) router.refresh();
          else setError(res.error);
        });
      }}
    >
      {def.scorecard && (
        <section aria-labelledby="sc-h" className="flex flex-col gap-3">
          <h2 id="sc-h" className="font-display text-lg font-semibold">
            Your 30/60/90 goals
          </h2>
          {scorecard.length ? (
            <ul className="flex flex-col gap-2">
              {scorecard.map((s) => (
                <li key={s.id} className="rounded-lg border border-border bg-surface p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{s.goal}</p>
                      <p className="text-xs text-muted">Target: {s.target}</p>
                    </div>
                    <Badge tone="aqua">Day {s.horizon}</Badge>
                  </div>
                  {def.scorecard === "assess" && (
                    <div className="mt-2">
                      <Segmented
                        name={`assess-${s.id}`}
                        legend={`How did you do on: ${s.goal}`}
                        value={assessments[s.id]}
                        options={ASSESS_OPTIONS.map((o) => ({ v: o.v, label: o.label }))}
                        onChange={(v) => setAssessments((a) => ({ ...a, [s.id]: v }))}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Your manager has not set your goals yet. Ask them at your next check-in.</p>
          )}
        </section>
      )}

      {def.ratings && (
        <section aria-labelledby="rt-h" className="flex flex-col gap-4">
          <div>
            <h2 id="rt-h" className="font-display text-lg font-semibold">
              How much do you agree?
            </h2>
            <p className="text-xs text-muted">1 = not at all, 5 = completely</p>
          </div>
          {def.ratings.map((r) => (
            <div key={r.id} className="flex flex-col gap-2">
              <p className="text-sm font-medium">{r.label}</p>
              <Segmented
                name={`rate-${r.id}`}
                legend={r.label}
                value={ratings[r.id] ? String(ratings[r.id]) : undefined}
                options={SCALE.map((n) => ({ v: String(n), label: String(n) }))}
                onChange={(v) => setRatings((x) => ({ ...x, [r.id]: Number(v) }))}
              />
            </div>
          ))}
        </section>
      )}

      {def.prompts.map((p) => (
        <Textarea
          key={p.id}
          label={p.required ? p.label : `${p.label} (optional)`}
          hint={p.hint}
          rows={3}
          maxLength={2000}
          value={answers[p.id] ?? ""}
          onChange={(e) => setAnswers((a) => ({ ...a, [p.id]: e.target.value }))}
        />
      ))}

      {def.confirm && <Checkbox label={def.confirm} checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" loading={pending} className="self-start">
        Save and complete
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------- spaced repetition

export interface SpacedItemView {
  quizId: string;
  quizTitle: string;
  itemId: string;
  type: "single" | "multi" | "ordering";
  scenario?: string;
  prompt: string;
  options: { id: string; text: string }[];
  step: number;
}

type Answer = string | string[];

export function SpacedReviewRunner({ items }: { items: SpacedItemView[] }) {
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<Answer | undefined>(() => initialAnswer(items[0]));
  const [result, setResult] = useState<Extract<SpacedAnswerResult, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [pending, start] = useTransition();
  const router = useRouter();
  const q = items[i];

  if (!q) {
    return (
      <EmptyState
        icon={<PartyPopper size={26} aria-hidden />}
        title="Reviews done"
        description={`You got ${score} of ${items.length} right. Missed ones come back in 3 days; the rest come back later to make them stick.`}
        action={
          <Link href="/today" className={buttonStyles({ variant: "secondary" })}>
            Back to Today
          </Link>
        }
      />
    );
  }

  const label = (id: string) => q.options.find((o) => o.id === id)?.text ?? id;
  const ready = q.type === "single" ? typeof answer === "string" && !!answer : Array.isArray(answer) && answer.length > 0;
  const order = Array.isArray(answer) ? answer : [];
  const move = (from: number, to: number) => {
    const next = [...order];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setAnswer(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <ProgressBar value={(i / items.length) * 100} label={`Question ${i + 1} of ${items.length}`} />
      <GlassCard className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">
            From {q.quizTitle} · review {q.step + 1} of 3
          </p>
          {q.scenario && <p className="mt-2 rounded-md bg-surface-strong p-3 text-sm">{q.scenario}</p>}
          <h2 className="mt-2 font-medium">{q.prompt}</h2>
          {q.type === "multi" && <p className="text-xs text-muted">Choose all that apply.</p>}
          {q.type === "ordering" && <p className="text-xs text-muted">Put these in the right order.</p>}
        </div>

        <fieldset disabled={!!result || pending}>
          <legend className="sr-only">{q.prompt}</legend>
          {q.type === "ordering" ? (
            <ol className="flex flex-col gap-2">
              {order.map((id, n) => (
                <li key={id} className="glass flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm">
                  <span className="w-5 text-muted tabular-nums">{n + 1}.</span>
                  <span className="flex-1">{label(id)}</span>
                  <Button size="sm" variant="ghost" aria-label="Move up" disabled={n === 0} onClick={() => move(n, n - 1)}>
                    <ArrowUp size={16} aria-hidden />
                  </Button>
                  <Button size="sm" variant="ghost" aria-label="Move down" disabled={n === order.length - 1} onClick={() => move(n, n + 1)}>
                    <ArrowDown size={16} aria-hidden />
                  </Button>
                </li>
              ))}
            </ol>
          ) : (
            <ul className="flex flex-col gap-2">
              {q.options.map((o) => {
                const checked = q.type === "single" ? answer === o.id : Array.isArray(answer) && answer.includes(o.id);
                const isKey = result?.correctOptionIds.includes(o.id);
                return (
                  <li key={o.id}>
                    <label
                      className={cn(
                        "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition",
                        checked ? "border-accent bg-accent-soft" : "border-border bg-surface hover:bg-surface-strong",
                        result && isKey && "border-success bg-success-soft",
                      )}
                    >
                      <input
                        type={q.type === "single" ? "radio" : "checkbox"}
                        name={`sr-${q.itemId}`}
                        checked={checked}
                        onChange={(e) => {
                          if (q.type === "single") setAnswer(o.id);
                          else {
                            const cur = Array.isArray(answer) ? answer : [];
                            setAnswer(e.target.checked ? [...cur, o.id] : cur.filter((x) => x !== o.id));
                          }
                        }}
                        className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                      />
                      <span>{o.text}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>

        {result && (
          <div role="status" className={cn("flex flex-col gap-1.5 rounded-md p-3 text-sm", result.correct ? "bg-success-soft" : "bg-danger-soft")}>
            <p className={cn("flex items-center gap-1.5 font-medium", result.correct ? "text-success" : "text-danger")}>
              {result.correct ? <CheckCircle2 size={16} aria-hidden /> : <XCircle size={16} aria-hidden />}
              {result.correct ? (result.retired ? "Correct. That one is locked in." : `Correct. It comes back on day ${result.nextDueDay}.`) : `Not quite. It comes back on day ${result.nextDueDay}.`}
            </p>
            {!result.correct && (
              <p>
                <span className="font-medium">Answer: </span>
                {result.correctOptionIds.map(label).join(q.type === "ordering" ? " → " : ", ")}
              </p>
            )}
            {result.explanation && <p className="text-muted">{result.explanation}</p>}
            {!result.correct && result.reviewModuleId && (
              <Link href={`/learn/${result.reviewModuleId}`} className="font-medium text-accent hover:underline">
                Re-read the lesson
              </Link>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {result ? (
            <Button
              onClick={() => {
                const next = i + 1;
                setI(next);
                setAnswer(initialAnswer(items[next]));
                setResult(null);
                setError(null);
                if (next >= items.length) router.refresh();
              }}
            >
              {i + 1 < items.length ? "Next question" : "Finish"}
            </Button>
          ) : (
            <>
            <Button
              loading={pending}
              disabled={!ready}
              onClick={() =>
                start(async () => {
                  const res = await answerSpacedReview(q.quizId, q.itemId, answer ?? "");
                  if (res.ok) {
                    setResult(res);
                    if (res.correct) setScore((s) => s + 1);
                  } else setError(res.error);
                })
              }
            >
              Check answer
            </Button>
            {error && (
              <Button
                variant="ghost"
                onClick={() => {
                  const next = i + 1;
                  setI(next);
                  setAnswer(initialAnswer(items[next]));
                  setError(null);
                }}
              >
                Skip this one
              </Button>
            )}
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function initialAnswer(q: SpacedItemView | undefined): Answer | undefined {
  if (!q) return undefined;
  return q.type === "ordering" ? q.options.map((o) => o.id) : q.type === "multi" ? [] : undefined;
}
