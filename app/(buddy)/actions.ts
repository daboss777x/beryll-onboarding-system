"use server";

import { revalidatePath } from "next/cache";
import { awardNewTrophies, loadHireState, recordTaskResult } from "@/components/app/hire-state";
import { QUEST_TASK, isQuestType } from "@/components/app/people-copy";
import type { ActionResult } from "@/components/app/action-types";
import { getRepo, getSystemRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";

/**
 * XP the hire earns when a buddy confirms a quest (on top of any roadmap task the quest completes).
 * TODO(Natalie): own this as QUEST_CONFIRMED_XP in lib/logic/xp.ts and import it here. Value unchanged.
 */
const QUEST_CONFIRMED_XP = 20;

async function buddyAndHire() {
  const buddy = await requireUser("buddy");
  const repo = await getRepo();
  const hire = await repo.getBuddyHire(buddy.id);
  return { buddy, repo, hire };
}

export async function confirmQuestAction(questId: string): Promise<ActionResult> {
  const { buddy, repo, hire } = await buddyAndHire();
  if (!hire) return { ok: false, error: "You do not have a hire assigned." };
  const quest = (await repo.listQuests(hire.hireId)).find((q) => q.id === String(questId));
  if (!quest) return { ok: false, error: "That quest is not on your hire's list." };
  if (quest.confirmedAt) return { ok: true, message: "Already confirmed." };
  await repo.confirmQuest(quest.id, buddy.id);

  // Authorised above (the quest belongs to this buddy's hire), so the hire's XP, trophies and
  // roadmap task are written with the system repo: buddies can't write hire progress under RLS.
  try {
    const sys = await getSystemRepo();
    await sys.addXpEvent({ hireId: hire.hireId, source: `quest:${quest.id}`, amount: QUEST_CONFIRMED_XP });
    const profile = await sys.getProfile(hire.hireId);
    // A confirmed buddy intro / cross-team quest completes its roadmap task (a locked task is left alone).
    const taskId = isQuestType(quest.type) ? QUEST_TASK[quest.type] : undefined;
    if (profile && taskId) {
      const res = await recordTaskResult(sys, profile, taskId, { data: { questId: quest.id } });
      if (!res.ok) console.warn("[buddy] quest task not completed:", res.error);
    } else if (profile) await awardNewTrophies(sys, await loadHireState(sys, profile));
  } catch (e) {
    console.warn("[buddy] quest XP skipped:", e instanceof Error ? e.message : e);
  }
  revalidatePath("/buddy");
  return { ok: true, message: `${hire.name.split(" ")[0]} gets +${QUEST_CONFIRMED_XP} XP.` };
}

export async function sendKudosAction(message: string): Promise<ActionResult> {
  const { buddy, repo, hire } = await buddyAndHire();
  if (!hire) return { ok: false, error: "You do not have a hire assigned." };
  const text = String(message ?? "").trim().slice(0, 500);
  if (text.length < 5) return { ok: false, error: "Write a few words (at least 5 characters)." };
  await repo.addKudos(buddy.id, hire.hireId, text);
  revalidatePath("/buddy");
  return { ok: true, message: `Sent to ${hire.name.split(" ")[0]}.` };
}
