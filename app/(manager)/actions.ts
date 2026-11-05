"use server";

import { revalidatePath } from "next/cache";
import { tasks } from "@/content";
import { rubric } from "@/content/server";
import { awardNewTrophies, getManagedHire, loadHireState, syncStages } from "@/components/app/hire-state";
import type { ActionResult } from "@/components/app/action-types";
import { getRepo, type Repository } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";
import { certificationDecision, checkinLabel, getProgramDay } from "@/lib/logic";
import type { Profile } from "@/lib/types";

const CERT_TASK = tasks.find((t) => t.kind === "certification");
const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

async function guard(hireId: string) {
  const manager = await requireUser("manager");
  const repo = await getRepo();
  const hire = await getManagedHire(repo, manager, String(hireId));
  return { manager, repo, hire };
}

function done(hireId: string, message?: string): ActionResult {
  revalidatePath("/team");
  revalidatePath(`/team/${hireId}`);
  return { ok: true, message };
}

/**
 * XP, stage rows and trophies for a milestone the manager decides.
 * In Supabase mode the repo writes these with the service role after checking that the caller
 * is the hire's manager (lib/data/supabase.ts awards()/progress()).
 */
async function settleMilestone(repo: Repository, hire: Profile, before: Awaited<ReturnType<typeof loadHireState>>, xp?: { source: string; amount: number }) {
  try {
    if (xp && xp.amount > 0) await repo.addXpEvent({ hireId: hire.id, source: xp.source, amount: xp.amount });
    const after = await loadHireState(repo, hire);
    await syncStages(repo, before, after);
    await awardNewTrophies(repo, after);
  } catch (e) {
    console.warn("[manager] milestone awards skipped:", e instanceof Error ? e.message : e);
  }
}

// ---------------------------------------------------------------- check-ins

export async function saveCheckin(hireId: string, dueDay: number, input: { held: boolean; notes: string }): Promise<ActionResult> {
  const { repo, hire } = await guard(hireId);
  if (!hire) return { ok: false, error: "This hire is not on your team." };
  const day = Math.trunc(Number(dueDay));
  if (!Number.isFinite(day) || day < 0 || day > 400) return { ok: false, error: "Unknown check-in." };
  const existing = (await repo.listCheckins(hire.id)).find((c) => c.dueDay === day);
  const notes = clip(input?.notes, 4000) || undefined;
  await repo.upsertCheckin({
    id: existing?.id,
    hireId: hire.id,
    dueDay: day,
    label: existing?.label ?? checkinLabel(day),
    agenda: existing?.agenda,
    notes,
    heldAt: input?.held ? existing?.heldAt ?? new Date().toISOString() : undefined,
  });
  return done(hire.id, input?.held ? "Check-in marked as held." : "Notes saved.");
}

// ---------------------------------------------------------------- certification (manager observation)

export async function saveObservation(hireId: string, input: { scores: Record<string, number>; notes: string }): Promise<ActionResult> {
  const { manager, repo, hire } = await guard(hireId);
  if (!hire) return { ok: false, error: "This hire is not on your team." };
  const before = await loadHireState(repo, hire);
  if (before.certificationPassed) return { ok: false, error: "Already certified." };
  if (before.stageStatuses["days8-30"] === "locked") return { ok: false, error: "Certification opens in the days 8-30 stage." };

  const scores: { criterion: string; id: string; score: number }[] = [];
  for (const c of rubric.criteria) {
    const v = Math.round(Number(input?.scores?.[c.id]));
    if (!(v >= 1 && v <= 5)) return { ok: false, error: `Score "${c.label}" from 1 to 5.` };
    scores.push({ id: c.id, criterion: c.label, score: v });
  }

  const prev = before.certification;
  let aiScore = prev?.aiScore;
  let roleplaySessionId = prev?.roleplaySessionId;
  if (aiScore === undefined) {
    const latest = (await repo.listRoleplaySessions(hire.id)).filter((s) => s.isCertification && typeof s.overall === "number").sort((a, b) => b.at.localeCompare(a.at))[0];
    aiScore = latest?.overall;
    roleplaySessionId = latest?.id;
  }

  const prevObs = (prev?.managerObservation ?? {}) as { failedCount?: number };
  const failedSoFar = Number(prevObs.failedCount ?? 0);
  const observation = { scores, notes: clip(input?.notes, 2000), observedBy: manager.id, observedAt: new Date().toISOString() };

  if (aiScore === undefined) {
    await repo.saveCertification({
      hireId: hire.id,
      stageId: "days8-30",
      managerObservation: { ...observation, failedCount: failedSoFar },
      status: "pending",
      attempts: prev?.attempts ?? 0,
    });
    return done(hire.id, "Observation saved. The decision is made once the AI role-play is done.");
  }

  const decision = certificationDecision({ overall: aiScore, coaching: [] }, { scores });
  const passed = decision.decision === "passed";
  const now = new Date().toISOString();
  await repo.saveCertification({
    hireId: hire.id,
    stageId: "days8-30",
    aiScore,
    roleplaySessionId,
    managerObservation: { ...observation, failedCount: passed ? failedSoFar : failedSoFar + 1, coaching: decision.coaching },
    status: passed ? "passed" : "retest",
    attempts: Math.max(1, prev?.attempts ?? 1),
    signedBy: passed ? manager.id : undefined,
    signedAt: passed ? now : undefined,
  });
  if (passed) await settleMilestone(repo, hire, before, CERT_TASK ? { source: CERT_TASK.id, amount: CERT_TASK.xp } : undefined);
  return done(hire.id, passed ? `${hire.name.split(" ")[0]} is certified for solo client contact.` : "Saved as a retest. The coaching plan is on the page.");
}

// ---------------------------------------------------------------- QA sampling

export async function saveQa(hireId: string, taskId: string, input: { score: number; notes: string }): Promise<ActionResult> {
  const { repo, hire } = await guard(hireId);
  if (!hire) return { ok: false, error: "This hire is not on your team." };
  const score = Math.round(Number(input?.score));
  if (!(score >= 0 && score <= 100)) return { ok: false, error: "Score from 0 to 100." };
  const row = (await repo.getTaskProgress(hire.id)).find((p) => p.taskId === String(taskId) && p.status === "done");
  if (!row) return { ok: false, error: "There is no finished work to score for this task." };
  await repo.setTaskQa(hire.id, row.taskId, score, clip(input?.notes, 1000) || undefined);
  return done(hire.id, "QA score saved.");
}

// ---------------------------------------------------------------- day-90 sign-off

export async function signOffDay90(hireId: string, input: { note: string }): Promise<ActionResult> {
  const { manager, repo, hire } = await guard(hireId);
  if (!hire) return { ok: false, error: "This hire is not on your team." };
  const before = await loadHireState(repo, hire);
  if (before.day90SignedOff) return { ok: true, message: "Already signed off." };
  if (!before.certificationPassed) return { ok: false, error: "Certification must be passed first." };
  if (getProgramDay(hire, new Date()) < 61) return { ok: false, error: "Sign-off opens in the days 61-90 stage." };
  const now = new Date().toISOString();
  await repo.saveCertification({
    hireId: hire.id,
    stageId: "days61-90",
    managerObservation: { note: clip(input?.note, 2000), signedOffBy: manager.id },
    status: "passed",
    attempts: 1,
    signedBy: manager.id,
    signedAt: now,
  });
  await settleMilestone(repo, hire, before);
  return done(hire.id, `${hire.name.split(" ")[0]} is now Independent.`);
}
