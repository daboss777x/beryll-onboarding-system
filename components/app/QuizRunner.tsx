"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { submitQuiz, type QuizSubmitResult } from "@/app/(hire)/actions";
import type { Quiz } from "@/content";
import { Badge, Button, GlassCard, ProgressBar, buttonStyles, cn } from "@/components/ui";
import { useReward } from "./useReward";

type Answer = string | string[];

/**
 * One question at a time; scored on the server. A failed attempt shows right/wrong per question only;
 * the answers and explanations appear once the quiz is passed (or was already done).
 */
export function QuizRunner({ quiz }: { quiz: Quiz }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>(() =>
    Object.fromEntries(quiz.questions.filter((q) => q.type === "ordering").map((q) => [q.id, q.options.map((o) => o.id)])),
  );
  const [result, setResult] = useState<Extract<QuizSubmitResult, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const reward = useReward();
  const router = useRouter();
  const q = quiz.questions[i];
  const total = quiz.questions.length;
  const answered = (id: string) => {
    const a = answers[id];
    return Array.isArray(a) ? a.length > 0 : !!a;
  };

  const set = (id: string, a: Answer) => setAnswers((prev) => ({ ...prev, [id]: a }));

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await submitQuiz(quiz.id, answers);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res);
      if (res.reward) reward(res.reward, `Passed: ${res.score}%`);
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <GlassCard variant="prism" className="flex flex-col gap-2" role="status">
          <div className="flex items-center gap-2">
            {result.passed ? <CheckCircle2 size={22} aria-hidden className="text-success" /> : <XCircle size={22} aria-hidden className="text-danger" />}
            <p className="font-display text-xl font-semibold">{result.passed ? "Passed" : "Not quite yet"}</p>
          </div>
          <p className="text-3xl font-semibold tabular-nums">{result.score}%</p>
          <p className="text-sm">
            {result.correctCount} of {total} correct.
            {!result.passed && " Have another go: the questions marked Missed are the ones to rethink."}
          </p>
          <p className="text-sm text-muted">
            Pass mark {result.passScore}%.{" "}
            {result.reviewsAdded > 0 && `${result.reviewsAdded} missed question${result.reviewsAdded === 1 ? "" : "s"} will come back on your Today page in 3 days.`}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {!result.passed && (
              <Button
                leftIcon={<RotateCcw size={16} aria-hidden />}
                onClick={() => {
                  setResult(null);
                  setI(0);
                }}
              >
                Try again
              </Button>
            )}
            <Link href="/today" className={buttonStyles({ variant: "secondary" })}>
              Back to Today
            </Link>
          </div>
        </GlassCard>
        <ol className="flex flex-col gap-3">
          {quiz.questions.map((qq, n) => {
            const f = result.feedback.find((x) => x.questionId === qq.id);
            const label = (id: string) => qq.options.find((o) => o.id === id)?.text ?? id;
            return (
              <li key={qq.id}>
                <GlassCard className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">
                      {n + 1}. {qq.prompt}
                    </p>
                    <Badge tone={f?.correct ? "success" : "danger"}>{f?.correct ? "Correct" : "Missed"}</Badge>
                  </div>
                  {!f?.correct && f?.correctOptionIds?.length ? (
                    <p className="text-sm">
                      <span className="font-medium">Answer: </span>
                      {qq.type === "ordering" ? f.correctOptionIds.map(label).join(" → ") : f.correctOptionIds.map(label).join(", ")}
                    </p>
                  ) : null}
                  {f?.explanation && <p className="text-sm text-muted">{f.explanation}</p>}
                  {!result.revealed && !f?.correct && <p className="text-sm text-muted">The answer shows once you pass.</p>}
                  {!f?.correct && f?.reviewModuleId && (
                    <Link href={`/learn/${f.reviewModuleId}`} className="text-sm font-medium text-accent hover:underline">
                      Re-read the lesson
                    </Link>
                  )}
                </GlassCard>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const order = (answers[q.id] as string[] | undefined) ?? q.options.map((o) => o.id);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    set(q.id, next);
  };

  return (
    <div className="flex flex-col gap-4">
      <ProgressBar value={((i + 1) / total) * 100} label={`Question ${i + 1} of ${total}`} size="sm" />
      <GlassCard variant="strong" className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3">
            {q.scenario && <p className="mb-1 text-sm text-muted">{q.scenario}</p>}
            <p className="font-display text-lg font-semibold">{q.prompt}</p>
            <p className="mt-1 text-xs text-muted">
              {q.type === "single" ? "Pick one." : q.type === "multi" ? "Pick all that apply." : "Use the arrows to put these in order."}
            </p>
          </legend>
          {q.type === "ordering" ? (
            <ol className="flex flex-col gap-2">
              {order.map((id, n) => (
                <li key={id} className="glass flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm">
                  <span className="w-5 text-muted tabular-nums">{n + 1}.</span>
                  <span className="flex-1">{q.options.find((o) => o.id === id)?.text}</span>
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
            q.options.map((o) => {
              const multi = q.type === "multi";
              const cur = answers[q.id];
              const checked = multi ? Array.isArray(cur) && cur.includes(o.id) : cur === o.id;
              return (
                <label
                  key={o.id}
                  className={cn(
                    "glass flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm",
                    checked && "border-accent bg-accent-soft",
                  )}
                >
                  <input
                    type={multi ? "checkbox" : "radio"}
                    name={q.id}
                    value={o.id}
                    checked={checked}
                    className="size-4 accent-[var(--accent)]"
                    onChange={() => {
                      if (!multi) return set(q.id, o.id);
                      const arr = Array.isArray(cur) ? cur : [];
                      set(q.id, arr.includes(o.id) ? arr.filter((x) => x !== o.id) : [...arr, o.id]);
                    }}
                  />
                  {o.text}
                </label>
              );
            })
          )}
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" disabled={i === 0} leftIcon={<ArrowLeft size={16} aria-hidden />} onClick={() => setI(i - 1)}>
            Back
          </Button>
          {i < total - 1 ? (
            <Button disabled={!answered(q.id)} rightIcon={<ArrowRight size={16} aria-hidden />} onClick={() => setI(i + 1)}>
              Next
            </Button>
          ) : (
            <Button loading={pending} disabled={!quiz.questions.every((x) => answered(x.id))} onClick={submit}>
              Submit answers
            </Button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
