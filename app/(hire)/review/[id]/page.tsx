import Link from "next/link";
import { CheckCircle2, Clock, Lock, RefreshCcw, Sparkles, Users } from "lucide-react";
import { loadHireState } from "@/components/app/hire-state";
import { ReviewTaskForm, SpacedReviewRunner, type SpacedItemView } from "@/components/app/ReviewForms";
import { ASSESS_OPTIONS, REVIEW_DEFS, SPACED_REVIEW_ID, scorecardRows } from "@/components/app/review-defs";
import { NotFoundPanel, PageHeader, TaskStatusBadge } from "@/components/app/screen";
import { Badge, EmptyState, GlassCard, buttonStyles } from "@/components/ui";
import { quizById, scorecardGoals, tasks } from "@/content";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";

export const metadata = { title: "Review · Beryll Onboard" };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === SPACED_REVIEW_ID) return <SpacedReviews />;

  const def = REVIEW_DEFS[id];
  const task = def && tasks.find((t) => t.href === `/review/${def.id}`);
  if (!def || !task) return <NotFoundPanel title="Review not found" description="That review is not on your roadmap." href="/roadmap" label="Back to Roadmap" />;

  const profile = await requireUser("hire");
  const repo = await getRepo();
  const [state, items] = await Promise.all([loadHireState(repo, profile), def.scorecard ? repo.listScorecardItems(profile.id) : Promise.resolve([])]);
  const status = state.taskStatuses[task.id];
  const data = state.progress.find((p) => p.taskId === task.id)?.data ?? {};
  const rows = def.scorecard ? scorecardRows(items, scorecardGoals) : [];
  const unlockLater = (task.unlockDay ?? 0) > state.programDay;

  return (
    <article className="mx-auto max-w-2xl">
      <PageHeader eyebrow={def.eyebrow} title={task.title} description={def.intro} actions={<TaskStatusBadge status={status} />} />
      <p className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Users size={12} aria-hidden /> With {def.withWhom}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={12} aria-hidden /> About {task.estMinutes} min
        </span>
        <span className="inline-flex items-center gap-1">
          <Sparkles size={12} aria-hidden /> {task.xp} XP
        </span>
      </p>

      {status === "locked" ? (
        <EmptyState
          icon={<Lock size={24} aria-hidden />}
          title={unlockLater ? `Opens on day ${task.unlockDay}` : "Not open yet"}
          description={unlockLater ? `You are on day ${state.programDay}. It shows up on Today when it is time.` : "Finish the earlier stages of your roadmap first."}
          action={
            <Link href="/roadmap" className={buttonStyles({ variant: "secondary" })}>
              Back to Roadmap
            </Link>
          }
        />
      ) : status === "done" ? (
        <DoneSummary def={def} data={data} rows={rows} />
      ) : (
        <GlassCard>
          <ReviewTaskForm def={def} scorecard={rows} />
        </GlassCard>
      )}
    </article>
  );
}

function DoneSummary({ def, data, rows }: { def: (typeof REVIEW_DEFS)[string]; data: Record<string, unknown>; rows: ReturnType<typeof scorecardRows> }) {
  const answers = (data.answers ?? {}) as Record<string, string>;
  const ratings = (data.ratings ?? {}) as Record<string, number>;
  const assessments = (data.assessments ?? {}) as Record<string, string>;
  const hasDetail = Object.keys(answers).length + Object.keys(ratings).length + Object.keys(assessments).length > 0;
  return (
    <GlassCard className="flex flex-col gap-4">
      <p className="flex items-center gap-1.5 font-medium text-success">
        <CheckCircle2 size={18} aria-hidden /> {def.doneCopy}
      </p>
      {!hasDetail && <p className="text-sm text-muted">This was completed before your notes were kept here.</p>}
      {Object.keys(assessments).length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {rows.map((r) => {
            const v = assessments[r.id];
            const label = ASSESS_OPTIONS.find((o) => o.v === v)?.label ?? "Not rated";
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="min-w-0">{r.goal}</span>
                <Badge tone={v === "met" ? "success" : v === "partly" ? "warn" : "neutral"}>{label}</Badge>
              </li>
            );
          })}
        </ul>
      )}
      {def.ratings && Object.keys(ratings).length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {def.ratings.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{r.label}</span>
              <span className="font-semibold tabular-nums">{ratings[r.id] ?? "-"}/5</span>
            </li>
          ))}
        </ul>
      )}
      {def.prompts
        .filter((p) => answers[p.id])
        .map((p) => (
          <div key={p.id}>
            <p className="text-xs font-semibold text-muted">{p.label}</p>
            <p className="mt-0.5 rounded-md bg-surface-strong p-3 text-sm whitespace-pre-wrap">{answers[p.id]}</p>
          </div>
        ))}
      <Link href="/roadmap" className={buttonStyles({ variant: "secondary", size: "sm", className: "self-start" })}>
        Back to Roadmap
      </Link>
    </GlassCard>
  );
}

async function SpacedReviews() {
  const profile = await requireUser("hire");
  const repo = await getRepo();
  const state = await loadHireState(repo, profile);
  const queue = await repo.listReviewQueue(profile.id);
  const due = queue.filter((r) => r.dueDay <= state.programDay);
  const later = queue.filter((r) => r.dueDay > state.programDay).sort((a, b) => a.dueDay - b.dueDay);

  const items: SpacedItemView[] = [];
  for (const r of due) {
    const quiz = quizById(r.quizId);
    const q = quiz?.questions.find((x) => x.id === r.itemId);
    if (!quiz || !q) continue;
    items.push({ quizId: quiz.id, quizTitle: quiz.title, itemId: q.id, type: q.type, scenario: q.scenario, prompt: q.prompt, options: q.options.map((o) => ({ id: o.id, text: o.text })), step: r.step });
  }

  return (
    <article className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Spaced repetition"
        title="Quick reviews"
        description="Questions you missed come back after 3, 10 and 30 days. Get one right three times and it is retired."
      />
      {items.length ? (
        <SpacedReviewRunner items={items} />
      ) : (
        <EmptyState
          icon={<RefreshCcw size={24} aria-hidden />}
          title="Nothing to review today"
          description={
            later.length
              ? `${later.length} question${later.length === 1 ? "" : "s"} coming back, the next on day ${later[0].dueDay}.`
              : "Any quiz question you miss will come back here a few days later."
          }
          action={
            <Link href="/today" className={buttonStyles({ variant: "secondary" })}>
              Back to Today
            </Link>
          }
        />
      )}
    </article>
  );
}
