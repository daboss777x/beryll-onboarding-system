import { Clock, Sparkles } from "lucide-react";
import { CompleteLessonButton } from "@/components/app/CompleteLessonButton";
import { ExplainerEmbed } from "@/components/app/ExplainerEmbed";
import { loadHireState } from "@/components/app/hire-state";
import { Markdown } from "@/components/app/Markdown";
import { Callout, NotFoundPanel, PageHeader, TaskStatusBadge } from "@/components/app/screen";
import { StoryPlayer } from "@/components/app/StoryPlayer";
import { GlassCard } from "@/components/ui";
import { jobPreview, lessonById, tasks } from "@/content";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";

export default async function LessonPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const profile = await requireUser("hire");
  const state = await loadHireState(await getRepo(), profile);
  const task = tasks.find((t) => t.href === `/learn/${moduleId}`);
  const status = task ? state.taskStatuses[task.id] : "available";
  const isStory = moduleId === jobPreview.id;
  const lesson = isStory ? null : lessonById(moduleId);

  if (!isStory && !lesson) {
    return <NotFoundPanel title="Lesson not found" description="This lesson does not exist or has moved. Pick another from your roadmap." href="/roadmap" label="Open the roadmap" />;
  }
  if (status === "locked") {
    return (
      <NotFoundPanel
        title="Not open yet"
        description={task?.unlockDay && task.unlockDay > state.programDay ? `This lesson opens on day ${task.unlockDay}.` : "Finish the earlier steps on your roadmap first."}
        href="/roadmap"
        label="Open the roadmap"
      />
    );
  }

  const title = isStory ? jobPreview.title : lesson!.title;
  const summary = isStory ? jobPreview.intro : lesson!.summary;
  const minutes = task?.estMinutes ?? lesson?.estMinutes;

  return (
    <article className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={isStory ? "Job preview" : "Lesson"}
        title={title}
        description={summary}
        actions={task ? <TaskStatusBadge status={status} /> : undefined}
      />
      <p className="-mt-3 mb-6 flex gap-4 text-xs text-muted">
        {minutes && (
          <span className="inline-flex items-center gap-1">
            <Clock size={12} aria-hidden /> {minutes} min
          </span>
        )}
        {task && (
          <span className="inline-flex items-center gap-1">
            <Sparkles size={12} aria-hidden /> {task.xp} XP
          </span>
        )}
      </p>

      {isStory ? (
        <StoryPlayer story={jobPreview} done={status === "done"} />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {lesson!.sections.map((s, i) => (
              <GlassCard key={i}>
                <h2 className="mb-3 font-display text-xl font-semibold">{s.heading}</h2>
                <Markdown source={s.body} />
                {s.callout && (
                  <Callout tone={s.callout.tone}>
                    <p>{s.callout.text}</p>
                  </Callout>
                )}
                {s.explainer && <ExplainerEmbed id={s.explainer} />}
              </GlassCard>
            ))}
          </div>
          <div className="mt-6">
            {task ? (
              <CompleteLessonButton moduleId={moduleId} done={status === "done"} />
            ) : (
              <p className="text-sm text-muted">This is a reference lesson. It is not tracked on your roadmap.</p>
            )}
          </div>
        </>
      )}
    </article>
  );
}
