import { loadHireState } from "@/components/app/hire-state";
import { QuizRunner } from "@/components/app/QuizRunner";
import { NotFoundPanel, PageHeader, TaskStatusBadge } from "@/components/app/screen";
import { quizById, tasks } from "@/content";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";

export default async function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const profile = await requireUser("hire");
  const repo = await getRepo();
  const quiz = quizById(quizId); // public shape only: no answer keys reach the client
  if (!quiz) return <NotFoundPanel title="Quiz not found" description="This quiz does not exist or has moved." href="/roadmap" label="Open the roadmap" />;
  const state = await loadHireState(repo, profile);
  const task = tasks.find((t) => t.href === `/quiz/${quizId}`);
  const status = task ? state.taskStatuses[task.id] : "available";
  if (status === "locked") {
    return (
      <NotFoundPanel
        title="Not open yet"
        description={task?.unlockDay && task.unlockDay > state.programDay ? `This quiz opens on day ${task.unlockDay}.` : "Finish the earlier steps on your roadmap first."}
        href="/roadmap"
        label="Open the roadmap"
      />
    );
  }
  const attempts = await repo.listQuizAttempts(profile.id, quizId);
  const best = attempts.reduce((m, a) => Math.max(m, a.score), 0);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Quiz"
        title={quiz.title}
        description={quiz.intro}
        actions={task ? <TaskStatusBadge status={status} /> : undefined}
      />
      {attempts.length > 0 && (
        <p className="-mt-3 mb-4 text-sm text-muted">
          {attempts.length} attempt{attempts.length === 1 ? "" : "s"} so far · best {best}% · pass mark {quiz.passScore}%
        </p>
      )}
      <QuizRunner quiz={quiz} />
    </div>
  );
}
