import Link from "next/link";
import { CheckCircle2, Clock, Lock, Sparkles } from "lucide-react";
import { loadHireState } from "@/components/app/hire-state";
import { MISSION_DEFS } from "@/components/app/mission-defs";
import { MissionForm } from "@/components/app/MissionForm";
import { NotFoundPanel, PageHeader, Section, TaskStatusBadge } from "@/components/app/screen";
import { Badge, EmptyState, GlassCard, buttonStyles, type BadgeTone } from "@/components/ui";
import { sopById, sops, staffById, tasks } from "@/content";
import { getRepo, type SopSuggestion } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";

export const metadata = { title: "Mission · Beryll Onboard" };

const SUGGESTION_STATUS: Record<SopSuggestion["status"], { label: string; tone: BadgeTone }> = {
  submitted: { label: "With the owner", tone: "warn" },
  accepted: { label: "Accepted", tone: "success" },
  declined: { label: "Not this time", tone: "neutral" },
};

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const def = MISSION_DEFS[id];
  const task = def && tasks.find((t) => t.href === `/missions/${def.id}`);
  if (!def || !task) return <NotFoundPanel title="Mission not found" description="That mission is not on your roadmap." href="/roadmap" label="Back to Roadmap" />;

  const profile = await requireUser("hire");
  const repo = await getRepo();
  const [state, suggestions] = await Promise.all([loadHireState(repo, profile), repo.listSopSuggestions(profile.id)]);
  const status = state.taskStatuses[task.id];
  const progress = state.progress.find((p) => p.taskId === task.id);
  const submittedId = progress?.data?.suggestionId as string | undefined;
  const submitted = suggestions.find((s) => s.id === submittedId) ?? (status === "done" ? suggestions[0] : undefined);
  const sopOptions = sops.map((s) => ({ id: s.id, title: s.title, summary: s.summary, ownerName: staffById(s.owner)?.name ?? "the SOP owner" }));

  return (
    <article className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={def.eyebrow}
        title={task.title}
        description={def.intro}
        actions={<TaskStatusBadge status={status} />}
      />
      <p className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
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
          title={(task.unlockDay ?? 0) > state.programDay ? `Opens on day ${task.unlockDay}` : "Not open yet"}
          description={
            (task.unlockDay ?? 0) > state.programDay
              ? `You are on day ${state.programDay}. By then you will have used the SOPs enough to know what to fix.`
              : "Finish your certification and the earlier stages first."
          }
          action={
            <Link href="/roadmap" className={buttonStyles({ variant: "secondary" })}>
              Back to Roadmap
            </Link>
          }
        />
      ) : status === "done" ? (
        <GlassCard className="flex flex-col gap-3">
          <p className="flex items-center gap-1.5 font-medium text-success">
            <CheckCircle2 size={18} aria-hidden /> Mission complete
          </p>
          {submitted ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{sopById(submitted.sopId)?.title ?? submitted.sopId}</span>
                <Badge tone={SUGGESTION_STATUS[submitted.status].tone} dot>
                  {SUGGESTION_STATUS[submitted.status].label}
                </Badge>
              </div>
              <p className="rounded-md bg-surface-strong p-3 text-sm whitespace-pre-wrap">{submitted.suggestion}</p>
            </>
          ) : (
            <p className="text-sm text-muted">Your suggestion was recorded.</p>
          )}
          <p className="text-sm text-muted">The owner reviews suggestions at their next SOP review. Good fixes get your name in the changelog.</p>
          <Link href="/roadmap" className={buttonStyles({ variant: "secondary", size: "sm", className: "self-start" })}>
            Back to Roadmap
          </Link>
        </GlassCard>
      ) : (
        <>
          <Section title="How to do it">
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm">
              {def.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </Section>
          <GlassCard>
            <MissionForm missionId={def.id} sops={sopOptions} />
          </GlassCard>
        </>
      )}

      {suggestions.length > (submitted ? 1 : 0) && (
        <Section title="Your SOP suggestions" description="Everything you have sent to SOP owners.">
          <ul className="flex flex-col gap-2">
            {suggestions
              .filter((s) => s.id !== submitted?.id)
              .map((s) => (
                <li key={s.id}>
                  <GlassCard padding="sm" className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{sopById(s.sopId)?.title ?? s.sopId}</span>
                    <Badge tone={SUGGESTION_STATUS[s.status].tone} dot>
                      {SUGGESTION_STATUS[s.status].label}
                    </Badge>
                  </GlassCard>
                </li>
              ))}
          </ul>
        </Section>
      )}
    </article>
  );
}
