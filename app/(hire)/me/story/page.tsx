import Link from "next/link";
import { BookOpenText, CheckCircle2, Lock } from "lucide-react";
import { BestSelfForm } from "@/components/app/BestSelfForm";
import { loadHireState } from "@/components/app/hire-state";
import { Callout, PageHeader, Section, TaskStatusBadge } from "@/components/app/screen";
import { Badge, EmptyState, GlassCard, buttonStyles } from "@/components/ui";
import { jobPreview, taskById } from "@/content";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";

export const metadata = { title: "Your story · Beryll Onboard" };

const PROMPTS = [
  "Think of a time at work, or outside it, when you felt fully yourself and did something you were proud of.",
  "What was the situation? Who was there? What did you actually do?",
  "Which of your strengths showed up? How did others react?",
];

export default async function StoryPage() {
  const profile = await requireUser("hire");
  const state = await loadHireState(await getRepo(), profile);
  const task = taskById("day1-best-self");
  const previewTask = taskById("pre-job-preview");
  const status = task ? state.taskStatuses[task.id] : "available";
  const previewStatus = previewTask ? state.taskStatuses[previewTask.id] : "available";
  const row = state.progress.find((p) => p.taskId === "day1-best-self" && p.status === "done");
  const data = (row?.data ?? {}) as { title?: string; story?: string; strengths?: string; synthetic?: boolean; demoSkipped?: boolean };
  const strengths = String(data.strengths ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Your story"
        title="Your Best Self story"
        description="Write about a moment you were at your best. Your manager and buddy read it, so they know what you bring from day one."
        actions={task ? <TaskStatusBadge status={status} /> : undefined}
      />

      {status === "locked" ? (
        <EmptyState
          icon={<Lock size={24} aria-hidden />}
          title="Opens on day 1"
          description="Your Best Self story is part of your first day. Until then, try the job preview below so you know what a real week looks like."
          action={
            <Link href="/today" className={buttonStyles({ variant: "secondary" })}>
              Back to Today
            </Link>
          }
        />
      ) : row ? (
        <GlassCard variant="prism" className="flex flex-col gap-3">
          <p className="flex items-center gap-1.5 text-sm font-medium text-success">
            <CheckCircle2 size={16} aria-hidden /> Shared with your team
          </p>
          {data.story ? (
            <>
              {data.title && <h2 className="font-display text-xl font-semibold">{data.title}</h2>}
              <p className="text-sm whitespace-pre-line">{data.story}</p>
              {strengths.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="Strengths">
                  {strengths.map((s) => (
                    <li key={s}>
                      <Badge tone="aqua">{s}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">Your story was recorded before this demo started, so the text is not shown here.</p>
          )}
        </GlassCard>
      ) : (
        <GlassCard className="flex flex-col gap-4">
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-muted">
            {PROMPTS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
          <Callout tone="tip">
            <p>It does not have to be about sales or security. Short and honest beats polished.</p>
          </Callout>
          <BestSelfForm />
        </GlassCard>
      )}

      <div className="mt-8" />
      <Section title="Before you write" description="The realistic job preview you met in pre-boarding.">
        <GlassCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
              <BookOpenText size={18} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-medium">{jobPreview.title}</p>
              <p className="text-sm text-muted">{jobPreview.intro}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <TaskStatusBadge status={previewStatus} />
            {previewStatus !== "locked" && (
              <Link href={`/learn/${jobPreview.id}`} className={buttonStyles({ variant: "secondary", size: "sm" })}>
                {previewStatus === "done" ? "Replay" : "Start"}
              </Link>
            )}
          </div>
        </GlassCard>
      </Section>
    </article>
  );
}
