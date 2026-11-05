"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { checkDrill, submitDrills } from "@/app/(hire)/labs/actions";
import { useReward } from "@/components/app/useReward";
import type { DrillPublic } from "@/content/schema";
import { Badge, Button, GlassCard, ProgressBar, cn, useToast } from "@/components/ui";
import type { DrillFeedback } from "./types";

/** Twelve quick decisions with instant feedback. The server keeps the first answer per drill and scores those. */
export function DataDrills({
  drills,
  initialFeedback,
  passScore,
  done,
  lastScore,
}: {
  drills: DrillPublic[];
  initialFeedback: DrillFeedback[];
  passScore: number;
  done: boolean;
  lastScore?: number;
}) {
  const [feedback, setFeedback] = useState<Record<string, DrillFeedback>>(() => Object.fromEntries(initialFeedback.map((f) => [f.drillId, f])));
  const [index, setIndex] = useState(() => {
    const first = drills.findIndex((d) => !initialFeedback.some((f) => f.drillId === d.id));
    return first === -1 ? 0 : first;
  });
  const [summary, setSummary] = useState<{ score: number; correct: number; total: number; passed: boolean } | null>(null);
  const [pending, start] = useTransition();
  const reward = useReward();
  const { toast } = useToast();
  const router = useRouter();

  if (drills.length === 0) return <p className="text-sm text-muted">No drills are loaded yet.</p>;
  const drill = drills[index];
  const fb = feedback[drill.id];
  const answered = drills.filter((d) => feedback[d.id]).length;
  const correct = drills.filter((d) => feedback[d.id]?.correct).length;
  const allAnswered = answered === drills.length;

  const answer = (optionId: string) =>
    start(async () => {
      const res = await checkDrill(drill.id, optionId);
      if (!res.ok) {
        toast({ title: "Could not check that", description: res.error, tone: "danger" });
        return;
      }
      setFeedback((f) => ({ ...f, [res.drillId]: res }));
    });

  const finish = () =>
    start(async () => {
      const res = await submitDrills();
      if (!res.ok) {
        toast({ title: "Not yet", description: res.error, tone: "warn" });
        return;
      }
      setSummary({ score: res.score, correct: res.correct, total: res.total, passed: res.passed });
      reward(res.reward, "Data-handling drills passed");
      router.refresh();
    });

  const retry = () => {
    setFeedback({});
    setSummary(null);
    setIndex(0);
  };

  if (summary) {
    return (
      <GlassCard variant="strong" className="flex flex-col items-start gap-3" aria-live="polite">
        <Badge tone={summary.passed ? "success" : "warn"}>{summary.passed ? "Passed" : `Needs ${passScore}%`}</Badge>
        <p className="font-display text-2xl font-semibold">
          {summary.correct} of {summary.total} right ({summary.score}%)
        </p>
        <p className="text-sm text-muted">
          {summary.passed ? "Good instincts. These are the calls you will make every week." : "Review the explanations, then run the drills again. The options come in a new order each time, and your first answer to each drill is the one that counts."}
        </p>
        {!summary.passed && (
          <Button variant="secondary" onClick={retry} leftIcon={<RotateCcw size={16} aria-hidden />}>
            Run the drills again
          </Button>
        )}
      </GlassCard>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <GlassCard padding="sm" className="flex flex-col gap-2">
        <ProgressBar value={(answered / drills.length) * 100} label={`${answered} of ${drills.length} answered · ${correct} right`} />
        {done && <p className="text-xs text-muted">You passed these drills{lastScore !== undefined ? ` with ${lastScore}%` : ""}. This run is practice and is not recorded.</p>}
      </GlassCard>

      <GlassCard variant="strong" className="flex flex-col gap-4" aria-live="polite">
        <p className="text-xs font-semibold tracking-wide text-accent uppercase">
          Drill {index + 1} of {drills.length}
        </p>
        <p className="font-medium">{drill.scenario}</p>
        <div className="flex flex-col gap-2">
          {drill.options.map((o) => {
            const isChosen = fb?.chosenOptionId === o.id;
            const isRight = fb?.correctOptionId === o.id;
            return (
              <button
                key={o.id}
                type="button"
                disabled={!!fb || pending}
                onClick={() => answer(o.id)}
                className={cn(
                  "glass flex min-h-11 items-start gap-2 rounded-lg px-4 py-3 text-left text-sm transition enabled:hover:border-accent enabled:hover:bg-accent-soft disabled:cursor-default",
                  fb && isRight && "border-success bg-success-soft",
                  fb && isChosen && !isRight && "border-danger bg-danger-soft",
                )}
              >
                {fb && isRight && <CheckCircle2 size={16} aria-hidden className="mt-0.5 shrink-0 text-success" />}
                {fb && isChosen && !isRight && <XCircle size={16} aria-hidden className="mt-0.5 shrink-0 text-danger" />}
                <span>{o.text}</span>
              </button>
            );
          })}
        </div>
        {fb && (
          <div className={cn("rounded-lg p-3 text-sm", fb.correct ? "bg-success-soft" : "bg-warn-soft")}>
            <p className="mb-1 font-semibold">{fb.correct ? "Right." : "Not quite."}</p>
            <p>{fb.explanation}</p>
            {fb.sopTitle && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
                <BookOpen size={12} aria-hidden /> SOP: {fb.sopTitle}
              </p>
            )}
          </div>
        )}
      </GlassCard>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} leftIcon={<ArrowLeft size={14} aria-hidden />}>
          Previous
        </Button>
        {index < drills.length - 1 ? (
          <Button size="sm" onClick={() => setIndex((i) => i + 1)} disabled={!fb} rightIcon={<ArrowRight size={14} aria-hidden />}>
            Next drill
          </Button>
        ) : done ? null : (
          <Button size="sm" onClick={finish} loading={pending} disabled={!allAnswered || pending}>
            Finish and score
          </Button>
        )}
      </div>
    </div>
  );
}
