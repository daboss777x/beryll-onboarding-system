import { Info, Lightbulb, Quote } from "lucide-react";
import { Badge, GlassCard, ProgressBar, ProgressRing } from "@/components/ui";
import type { RoleplayResult } from "@/lib/types";

export const CRITERION_LABEL: Record<string, string> = {
  accuracy: "Accuracy",
  tone: "Tone",
  escalation: "Escalation",
  data_handling: "Data handling",
  no_over_promising: "No over-promising",
  next_step: "Clear next step",
};
const label = (c: string) => CRITERION_LABEL[c] ?? c.replace(/_/g, " ");

/** The six rubric criteria with evidence, the overall score and coaching. */
export function RoleplayResultCard({
  result,
  passMark,
  needsAiGrade = false,
  title = "Your call, scored",
}: {
  result: RoleplayResult;
  passMark?: number;
  /** The AI coach was offline: a capped quick check that still needs the full AI grade or a manager review. */
  needsAiGrade?: boolean;
  title?: string;
}) {
  return (
    <GlassCard variant="strong" className="flex flex-col gap-5" aria-live="polite">
      <div className="flex items-center gap-4">
        <ProgressRing value={result.overall} size={72} label="Overall score">
          <span className="text-base font-semibold">{result.overall}</span>
        </ProgressRing>
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold">{title}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {needsAiGrade ? <Badge tone="aqua">Awaiting full grade</Badge> : <Badge tone={result.passed ? "success" : "warn"}>{result.passed ? "Pass" : "Not yet"}</Badge>}
            {passMark !== undefined && <Badge tone="neutral">Pass mark {passMark}</Badge>}
          </div>
        </div>
      </div>
      {needsAiGrade && (
        <p className="flex gap-2 rounded-lg bg-accent-soft p-3 text-sm">
          <Info size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
          <span>This is a quick automatic check because the AI coach is offline. Your certification score needs the full AI grade or your manager&rsquo;s review.</span>
        </p>
      )}
      {result.summary && <p className="text-sm">{result.summary}</p>}

      <ul className="flex flex-col gap-4">
        {result.scores.map((s) => (
          <li key={s.criterion} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">{label(s.criterion)}</span>
              <span className={s.score >= 3 ? "text-success" : "text-warn"}>{s.score}/5</span>
            </div>
            <ProgressBar value={(s.score / 5) * 100} size="sm" />
            {s.evidence && (
              <p className="flex gap-1.5 text-xs text-muted">
                <Quote size={12} aria-hidden className="mt-0.5 shrink-0" />
                <span>{s.evidence}</span>
              </p>
            )}
          </li>
        ))}
      </ul>

      {result.coaching.length > 0 && (
        <div className="rounded-lg bg-accent-soft p-4">
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-accent uppercase">
            <Lightbulb size={14} aria-hidden /> Coaching
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {result.coaching.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </GlassCard>
  );
}
