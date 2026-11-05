import Link from "next/link";
import { Clock, Lock, Sparkles } from "lucide-react";
import { ChecklistForm } from "@/components/app/ChecklistForm";
import { loadHireState } from "@/components/app/hire-state";
import { NotFoundPanel, PageHeader, TaskStatusBadge } from "@/components/app/screen";
import { EmptyState, GlassCard, buttonStyles } from "@/components/ui";
import { checklistById, tasks } from "@/content";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";

export const metadata = { title: "Checklist · Beryll Onboard" };

export default async function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = checklistById(id);
  const task = tasks.find((t) => t.href === `/checklist/${id}`);
  if (!list || !task) {
    return <NotFoundPanel title="Checklist not found" description="This checklist does not exist or has moved. Pick another from your roadmap." href="/roadmap" label="Open the roadmap" />;
  }
  const profile = await requireUser("hire");
  const state = await loadHireState(await getRepo(), profile);
  const status = state.taskStatuses[task.id];
  const row = state.progress.find((p) => p.taskId === task.id);
  const checked = Array.isArray(row?.data?.checked) ? (row.data.checked as string[]) : [];

  return (
    <article className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Checklist" title={list.title} description={list.intro} actions={<TaskStatusBadge status={status} />} />
      <p className="-mt-3 mb-6 flex gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Clock size={12} aria-hidden /> {task.estMinutes} min
        </span>
        <span className="inline-flex items-center gap-1">
          <Sparkles size={12} aria-hidden /> {task.xp} XP
        </span>
      </p>
      {status === "locked" ? (
        <EmptyState
          icon={<Lock size={24} aria-hidden />}
          title="Not open yet"
          description={task.unlockDay && task.unlockDay > state.programDay ? `This checklist opens on day ${task.unlockDay}.` : "Finish the earlier steps on your roadmap first."}
          action={
            <Link href="/roadmap" className={buttonStyles({ variant: "secondary" })}>
              Open the roadmap
            </Link>
          }
        />
      ) : (
        <GlassCard>
          <ChecklistForm
            checklistId={list.id}
            items={list.items.map((i) => ({ id: i.id, title: i.title, detail: i.detail, why: i.why }))}
            initialChecked={checked}
            done={status === "done"}
          />
        </GlassCard>
      )}
    </article>
  );
}
