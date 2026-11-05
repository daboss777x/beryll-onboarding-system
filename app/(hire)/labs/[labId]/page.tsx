import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Lock, ShieldCheck, Sparkles, Target } from "lucide-react";
import { loadHireState } from "@/components/app/hire-state";
import { PageHeader, TaskStatusBadge } from "@/components/app/screen";
import { DataDrills } from "@/components/labs/DataDrills";
import { PhishingSim } from "@/components/labs/PhishingSim";
import { RedlineLab } from "@/components/labs/RedlineLab";
import { SignatureStoryLab } from "@/components/labs/SignatureStoryLab";
import { TranslatorDrills } from "@/components/labs/TranslatorDrills";
import { shuffleDrillOptions } from "@/components/labs/scoring";
import type { DrillFeedback } from "@/components/labs/types";
import { EmptyState, GlassCard, buttonStyles } from "@/components/ui";
import { dataHandlingDrills, phishingEmail, redlineContracts, signatureStory, sopById, tasks, translatorDrills } from "@/content";
import { drillKeys } from "@/content/server";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";
import { isLabId, taskForLab, TRANSLATOR_MIN_ITEMS } from "../server";

export const metadata = { title: "Lab · Beryll Onboard" };

const numRecord = (v: unknown): Record<string, number> =>
  v && typeof v === "object" ? (Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([, n]) => typeof n === "number")) as Record<string, number>) : {};

export default async function LabPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params;
  const task = isLabId(labId) ? taskForLab(labId) : undefined;
  if (!task) notFound();

  const profile = await requireUser("hire");
  const state = await loadHireState(await getRepo(), profile);
  const status = state.taskStatuses[task.id];
  const row = state.progress.find((p) => p.taskId === task.id);
  const data = row?.data ?? {};
  const done = status === "done";
  const passScore = task.passScore;

  let body: ReactNode;
  if (status === "locked") {
    body = (
      <EmptyState
        icon={<Lock size={24} aria-hidden />}
        title="Not open yet"
        description={task.unlockDay && task.unlockDay > state.programDay ? `This lab opens on day ${task.unlockDay}. You're on day ${state.programDay}.` : "Finish the earlier steps on your roadmap first."}
        action={
          <Link href="/roadmap" className={buttonStyles({ variant: "secondary" })}>
            Open the roadmap
          </Link>
        }
      />
    );
  } else if (labId === "redline-lab") {
    body = <RedlineLab contracts={redlineContracts} initialBest={numRecord(data.best)} passScore={passScore ?? 70} done={done} />;
  } else if (labId === "translator-drills") {
    body = <TranslatorDrills drills={translatorDrills} initialBest={numRecord(data.best)} passScore={passScore ?? 70} minItems={TRANSLATOR_MIN_ITEMS} done={done} />;
  } else if (labId === "signature-story") {
    body = <SignatureStoryLab story={signatureStory} done={done} />;
  } else if (labId === "data-handling-drills") {
    // Restore feedback for drills already answered in this attempt (only those drills' answers are revealed).
    const answers = !done && data.drillAnswers && typeof data.drillAnswers === "object" ? (data.drillAnswers as Record<string, unknown>) : {};
    const initialFeedback: DrillFeedback[] = [];
    for (const d of dataHandlingDrills) {
      const chosen = answers[d.id];
      const key = drillKeys.find((k) => k.drillId === d.id);
      if (typeof chosen !== "string" || !key) continue;
      initialFeedback.push({ drillId: d.id, chosenOptionId: chosen, correct: chosen === key.correctOptionId, correctOptionId: key.correctOptionId, explanation: key.explanation, sopTitle: sopById(key.sopId)?.title });
    }
    // Option order is reshuffled per attempt (seeded, so server and client render the same order).
    const drills = shuffleDrillOptions(dataHandlingDrills, `${profile.id}:${row?.attempts ?? 0}`);
    body = <DataDrills drills={drills} initialFeedback={initialFeedback} passScore={passScore ?? 80} done={done} lastScore={row?.score} />;
  } else {
    const setupTask = tasks.find((t) => t.href === "/checklist/security-setup");
    const setupStatus = setupTask ? state.taskStatuses[setupTask.id] : undefined;
    body = (
      <div className="flex flex-col gap-5">
        {setupTask && setupStatus && (
          <GlassCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} aria-hidden className="mt-0.5 shrink-0 text-accent" />
              <div>
                <p className="font-medium">{setupTask.title}</p>
                <p className="text-sm text-muted">{setupStatus === "done" ? "Done. Your report-phish button is ready for this." : "Set up MFA, your password manager and the report-phish button first."}</p>
              </div>
            </div>
            {setupStatus === "done" ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 size={16} aria-hidden /> Complete
              </span>
            ) : setupStatus !== "locked" ? (
              <Link href={setupTask.href} className={buttonStyles({ variant: "secondary", size: "sm" })}>
                Open the checklist
              </Link>
            ) : (
              <TaskStatusBadge status={setupStatus} />
            )}
          </GlassCard>
        )}
        <PhishingSim email={phishingEmail} done={done} lastScore={row?.score} />
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Lab" title={task.title} description={task.summary} actions={<TaskStatusBadge status={status} />} />
      <p className="-mt-3 mb-6 flex flex-wrap gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Clock size={12} aria-hidden /> {task.estMinutes} min
        </span>
        <span className="inline-flex items-center gap-1">
          <Sparkles size={12} aria-hidden /> {task.xp} XP
        </span>
        {passScore !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Target size={12} aria-hidden /> {passScore === 100 ? "A pass is required" : `Pass mark ${passScore}`}
          </span>
        )}
        {done && row?.score !== undefined && (
          <span className="inline-flex items-center gap-1 text-success">
            <CheckCircle2 size={12} aria-hidden /> Recorded score {row.score}
          </span>
        )}
      </p>
      {body}
    </article>
  );
}
