import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { loadHireState } from "@/components/app/hire-state";
import { MatcherChat, type MatcherResultView } from "@/components/app/MatcherChat";
import { PageHeader } from "@/components/app/screen";
import { EmptyState, buttonStyles } from "@/components/ui";
import { staff as contentStaff, taskById } from "@/content";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";

export const metadata = { title: "People matcher · Beryll Onboard" };

export default async function MatcherPage() {
  const profile = await requireUser("hire");
  const repo = await getRepo();
  const [state, saved, staffRows] = await Promise.all([loadHireState(repo, profile), repo.getMatcherProfile(profile.id), repo.listStaff().catch(() => [])]);
  const staff = staffRows.length ? staffRows : contentStaff;
  const byId = new Map(staff.map((s) => [s.id, s]));
  const task = taskById("day1-matcher");
  const locked = !saved && task && state.taskStatuses[task.id] === "locked";

  const initial: MatcherResultView | null = saved
    ? {
        interests: saved.interests,
        visibility: saved.visibility,
        suggestions: saved.suggestions.map((s) => {
          const p = byId.get(s.staffId);
          return { ...s, name: p?.name ?? s.staffId, title: p?.title ?? "", team: p?.team ?? "", avatarSeed: p?.avatarSeed };
        }),
      }
    : null;
  const plannedCoffee = state.quests.filter((q) => q.type === "coffee" && q.staffId).map((q) => q.staffId!);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/people" className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted hover:text-text">
        <ArrowLeft size={16} aria-hidden /> People
      </Link>
      <PageHeader
        eyebrow="People matcher"
        title={saved ? "Your matches" : "Who should you meet first?"}
        description="A short chat about you. We suggest three colleagues, each with a reason and an icebreaker. You decide what anyone else sees."
      />
      {locked ? (
        <EmptyState
          icon={<Lock size={24} aria-hidden />}
          title={`Opens on day ${task?.unlockDay ?? 1}`}
          description={`You are on day ${state.programDay}. The matcher opens on your first day, when you can actually go for that coffee.`}
          action={
            <Link href="/people" className={buttonStyles({ variant: "secondary" })}>
              Back to People
            </Link>
          }
        />
      ) : (
        <MatcherChat initial={initial} plannedCoffee={plannedCoffee} />
      )}
    </div>
  );
}
