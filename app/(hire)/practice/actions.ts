"use server";

import { tasks } from "@/content";
import { recordTaskResult } from "@/components/app/hire-state";
import type { RewardResult } from "@/components/app/reward-types";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";

/**
 * Records a finished practice call against its roadmap task.
 * The score is read from the session the role-play route graded and saved, never from the browser.
 */
export async function recordRoleplayPractice(sessionId: string): Promise<RewardResult> {
  const profile = await requireUser("hire");
  const repo = await getRepo();
  const session = (await repo.listRoleplaySessions(profile.id)).find((s) => s.id === String(sessionId));
  if (!session) return { ok: false, error: "We couldn't find that call." };
  if (session.isCertification) return { ok: false, error: "Certification calls are recorded by the certification flow." };
  if (typeof session.overall !== "number") return { ok: false, error: "This call has not been scored yet. End the call first." };
  const task = tasks.find((t) => t.kind === "roleplay" && t.href === `/practice/roleplay?persona=${session.personaId}`);
  if (!task) return { ok: false, error: "This practice client is not on your roadmap." };
  return recordTaskResult(repo, profile, task.id, { score: session.overall, data: { sessionId: session.id, passed: session.passed } });
}
