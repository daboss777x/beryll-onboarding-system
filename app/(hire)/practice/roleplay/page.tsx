import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock, MessagesSquare } from "lucide-react";
import { loadHireState } from "@/components/app/hire-state";
import { NotFoundPanel, PageHeader, TaskStatusBadge } from "@/components/app/screen";
import { RoleplayChat } from "@/components/practice/RoleplayChat";
import { Avatar, Badge, EmptyState, GlassCard, buttonStyles, cn } from "@/components/ui";
import { personaCards, tasks } from "@/content";
import { rubric } from "@/content/server";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";

export const metadata = { title: "Role-play practice · Beryll Onboard" };

const taskFor = (personaId: string) => tasks.find((t) => t.kind === "roleplay" && t.href === `/practice/roleplay?persona=${personaId}`);
const DIFFICULTY_TONE = { gentle: "success", firm: "aqua", tough: "warn" } as const;

export default async function RoleplayPage({ searchParams }: { searchParams: Promise<{ persona?: string | string[] }> }) {
  const sp = await searchParams;
  const personaId = typeof sp.persona === "string" ? sp.persona : undefined;
  const profile = await requireUser("hire");
  const state = await loadHireState(await getRepo(), profile);
  const practice = personaCards.filter((p) => p.kind === "practice");
  const rows = practice.map((p) => {
    const task = taskFor(p.id);
    return { persona: p, task, status: task ? state.taskStatuses[task.id] : ("available" as const) };
  });

  if (personaId) {
    const row = rows.find((r) => r.persona.id === personaId);
    if (!row) return <NotFoundPanel title="Client not found" description="That practice client doesn't exist. Pick one from the list." href="/practice/roleplay" label="Choose a client" />;
    const { persona, task, status } = row;
    return (
      <article className="mx-auto max-w-3xl">
        <Link href="/practice/roleplay" className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-text">
          <ArrowLeft size={14} aria-hidden /> All practice clients
        </Link>
        <PageHeader eyebrow={`Practice call · ${persona.channel}`} title={`${persona.name}, ${persona.role}`} description={persona.company} actions={task ? <TaskStatusBadge status={status} /> : undefined} />
        {status === "locked" ? (
          <EmptyState
            icon={<Lock size={24} aria-hidden />}
            title="Not open yet"
            description={task?.unlockDay && task.unlockDay > state.programDay ? `This practice call opens on day ${task.unlockDay}. You're on day ${state.programDay}.` : "Finish the earlier steps on your roadmap first."}
            action={
              <Link href="/roadmap" className={buttonStyles({ variant: "secondary" })}>
                Open the roadmap
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-5">
            <GlassCard className="flex flex-col gap-2 text-sm">
              <p>
                <span className="font-medium">The situation: </span>
                {persona.situation}
              </p>
              <p>
                <span className="font-medium">Your goal: </span>
                {persona.goalForHire}
              </p>
              <p className="text-xs text-muted">Up to 12 replies. End the call whenever you&rsquo;re ready to be scored on the six criteria. Pass mark {rubric.passThreshold}.</p>
              {status === "done" && (
                <p className="inline-flex items-center gap-1.5 text-xs text-success">
                  <CheckCircle2 size={12} aria-hidden /> You&rsquo;ve completed this practice call. Extra calls are for practice.
                </p>
              )}
            </GlassCard>
            <RoleplayChat key={persona.id} persona={persona} passMark={rubric.passThreshold} />
          </div>
        )}
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Practice"
        title="Client role-play"
        description="Practise real conversations with AI clients. Each one has hidden goals and objections. You're scored on accuracy, tone, escalation, data handling, not over-promising and a clear next step."
      />
      {rows.length === 0 ? (
        <EmptyState icon={<MessagesSquare size={24} aria-hidden />} title="No practice clients yet" description="Practice clients will appear here." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map(({ persona, task, status }) => {
            const locked = status === "locked";
            const card = (
              <GlassCard interactive={!locked} className={cn("flex h-full flex-col gap-3", locked && "opacity-70")}>
                <div className="flex items-center gap-3">
                  <Avatar name={persona.name} seed={persona.avatarSeed} size={44} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{persona.name}</p>
                    <p className="truncate text-xs text-muted">{persona.role}</p>
                  </div>
                </div>
                <p className="text-sm text-muted">{persona.company}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <Badge tone={DIFFICULTY_TONE[persona.difficulty]}>{persona.difficulty}</Badge>
                  {task && <TaskStatusBadge status={status} />}
                  {locked && task?.unlockDay && task.unlockDay > state.programDay && <span className="text-xs text-muted">Opens day {task.unlockDay}</span>}
                </div>
              </GlassCard>
            );
            return (
              <li key={persona.id}>
                {locked ? (
                  <div aria-disabled="true">{card}</div>
                ) : (
                  <Link href={`/practice/roleplay?persona=${persona.id}`} className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-accent">
                    {card}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
