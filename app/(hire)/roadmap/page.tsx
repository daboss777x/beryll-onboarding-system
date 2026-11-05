import { Target } from "lucide-react";
import { FacetNode } from "@/components/brand";
import { loadHireState, requiredPercent } from "@/components/app/hire-state";
import { PageHeader, TaskRow } from "@/components/app/screen";
import { Badge, GlassCard, ProgressBar, cn } from "@/components/ui";
import { stages, tasksByStage } from "@/content";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";

export const metadata = { title: "Roadmap · Beryll Onboard" };

const STATE_LABEL = { locked: "Locked", active: "In progress", done: "Done" } as const;

export default async function RoadmapPage() {
  const profile = await requireUser("hire");
  const state = await loadHireState(await getRepo(), profile);
  const sorted = [...stages].sort((a, b) => a.order - b.order);

  return (
    <>
      <PageHeader
        eyebrow="Your journey"
        title="Roadmap"
        description="Seven stages from before day one to month twelve. Each opens when the one before is done and its day arrives."
      />
      <GlassCard className="mb-6">
        <ProgressBar value={requiredPercent(state)} label="Required steps complete" showValue />
      </GlassCard>

      <ol className="relative flex flex-col gap-4">
        {sorted.map((s, i) => {
          const st = state.stageStatuses[s.id];
          const list = tasksByStage(s.id);
          const done = list.filter((t) => state.taskStatuses[t.id] === "done").length;
          const days = s.endDay > 365 || s.id === "months4-12" ? `Months 4-12` : s.startDay === s.endDay ? `Day ${s.startDay}` : `Days ${s.startDay}-${s.endDay}`;
          return (
            <li key={s.id} className="relative flex gap-3 sm:gap-4">
              {i < sorted.length - 1 && (
                <span aria-hidden className={cn("absolute top-14 bottom-[-1rem] left-[27px] w-0.5", st === "done" ? "bg-accent" : "bg-border-strong")} />
              )}
              <FacetNode state={st} label={`${s.title}: ${STATE_LABEL[st]}`} className="shrink-0">
                {s.order}
              </FacetNode>
              <GlassCard className={cn("min-w-0 flex-1", st === "locked" && "opacity-90")} variant={st === "active" ? "strong" : "default"}>
                <details open={st === "active"} className="group">
                  <summary className="flex cursor-pointer list-none flex-col gap-1 [&::-webkit-details-marker]:hidden">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold">{s.title}</h2>
                      <Badge tone={st === "done" ? "success" : st === "active" ? "aqua" : "neutral"}>{STATE_LABEL[st]}</Badge>
                      {s.playable === "light" && <Badge tone="neutral">Light demo</Badge>}
                      {s.playable === "cards" && <Badge tone="neutral">Check-in cards</Badge>}
                    </div>
                    <p className="text-sm text-muted">
                      {days} · {s.subtitle}
                    </p>
                    <p className="text-xs text-muted">
                      {done} of {list.length} steps done <span className="text-accent group-open:hidden">· Show steps</span>
                    </p>
                  </summary>
                  <div className="mt-4 rounded-lg bg-accent-soft p-3 text-sm">
                    <p className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-accent uppercase">
                      <Target size={14} aria-hidden /> Done means
                    </p>
                    <p>{s.doneMeans}</p>
                  </div>
                  {st === "locked" && s.playable !== "full" && (
                    <p className="mt-3 text-xs text-muted">Opens after certification and day {s.startDay}.</p>
                  )}
                  <div className="mt-3 flex flex-col divide-y divide-border">
                    {list.map((t) => (
                      <TaskRow key={t.id} task={t} status={state.taskStatuses[t.id]} programDay={state.programDay} compact />
                    ))}
                  </div>
                </details>
              </GlassCard>
            </li>
          );
        })}
      </ol>
    </>
  );
}
