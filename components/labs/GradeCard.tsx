import { CheckCircle2, CircleAlert, Quote } from "lucide-react";
import { Badge, GlassCard, ProgressRing } from "@/components/ui";
import type { LabGradeView } from "./types";

/** Score, strengths, gaps and a model-answer excerpt from the lab grader. */
export function GradeCard({ grade, passScore, title = "Feedback" }: { grade: LabGradeView; passScore?: number; title?: string }) {
  const passed = passScore === undefined ? undefined : grade.score >= passScore;
  return (
    <GlassCard variant="strong" className="flex flex-col gap-4" aria-live="polite">
      <div className="flex items-center gap-4">
        <ProgressRing value={grade.score} size={64} label="Score">
          <span className="text-sm font-semibold">{grade.score}</span>
        </ProgressRing>
        <div className="min-w-0">
          <p className="font-display font-semibold">{title}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {passed !== undefined && <Badge tone={passed ? "success" : "warn"}>{passed ? `Pass (${passScore}+)` : `Needs ${passScore}`}</Badge>}
            {grade.mode === "fallback" && <Badge tone="neutral">Rule-based check</Badge>}
          </div>
        </div>
      </div>
      {grade.strengths.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-success uppercase">Strengths</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            {grade.strengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <CheckCircle2 size={16} aria-hidden className="mt-0.5 shrink-0 text-success" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {grade.gaps.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-warn uppercase">Gaps</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            {grade.gaps.map((s, i) => (
              <li key={i} className="flex gap-2">
                <CircleAlert size={16} aria-hidden className="mt-0.5 shrink-0 text-warn" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {grade.modelAnswerExcerpt && (
        <blockquote className="flex gap-2 rounded-lg bg-accent-soft p-3 text-sm">
          <Quote size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
          <span>
            <span className="mb-0.5 block text-xs font-semibold tracking-wide text-accent uppercase">From the model answer</span>
            {grade.modelAnswerExcerpt}
          </span>
        </blockquote>
      )}
    </GlassCard>
  );
}
