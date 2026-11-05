"use server";

import { revalidatePath } from "next/cache";
import { checklistById, jobPreview, lessonById, quizById, scorecardGoals, sopById, staffById, stages, tasks } from "@/content";
import { quizKeyById } from "@/content/server";
import { awardNewTrophies, demoJumpToStage, loadHireState, recordTaskResult, type RewardResult } from "@/components/app/hire-state";
import type { ActionResult } from "@/components/app/action-types";
import { MISSION_DEFS, SUGGESTION_LIMITS } from "@/components/app/mission-defs";
import { QUEST_TYPES, isQuestType } from "@/components/app/people-copy";
import { ASSESS_OPTIONS, REVIEW_DEFS } from "@/components/app/review-defs";
import { buildQuizFeedback, isReviewDue, newShadowLogItems, QUIZ_ATTEMPTS_PER_DAY, quizAttemptsToday, shouldRevealQuizAnswers, type QuizFeedback } from "@/components/app/quiz-rules";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";
import { isDemoMode } from "@/lib/supabase/env";
import { PULSE_DAYS, REVIEW_INTERVALS, scoreQuiz, type QuizAnswers, type QuizQuestion } from "@/lib/logic";
import type { StageId } from "@/lib/types";

const taskForHref = (href: string) => tasks.find((t) => t.href === href);

// ---------------------------------------------------------------- lessons + stories

export async function completeLesson(moduleId: string): Promise<RewardResult> {
  const profile = await requireUser("hire");
  if (!lessonById(moduleId) && moduleId !== jobPreview.id) return { ok: false, error: "Unknown lesson." };
  const task = taskForHref(`/learn/${moduleId}`);
  if (!task) return { ok: false, error: "This lesson is not part of your roadmap." };
  return recordTaskResult(await getRepo(), profile, task.id, { data: { moduleId } });
}

export async function completeJobPreview(endingKind: string, path: string[]): Promise<RewardResult> {
  const profile = await requireUser("hire");
  const task = taskForHref(`/learn/${jobPreview.id}`);
  if (!task) return { ok: false, error: "Job preview is not on your roadmap." };
  const ending = ["good", "mixed", "bad"].includes(endingKind) ? endingKind : "mixed";
  const nodes = new Set(jobPreview.nodes.map((n) => n.id));
  return recordTaskResult(await getRepo(), profile, task.id, {
    data: { ending, path: path.filter((p) => nodes.has(p)).slice(0, 50) },
  });
}

// ---------------------------------------------------------------- quizzes

export type QuizSubmitResult =
  | {
      ok: true;
      score: number;
      passScore: number;
      passed: boolean;
      /** Count of questions answered correctly; on a failed attempt this is all the feedback there is. */
      correctCount: number;
      /** True when feedback carries the answer key (passed, or the quiz was already done). */
      revealed: boolean;
      feedback: QuizFeedback[];
      reward: RewardResult | null;
      reviewsAdded: number;
    }
  | { ok: false; error: string };

export async function submitQuiz(quizId: string, rawAnswers: Record<string, string | string[]>): Promise<QuizSubmitResult> {
  const profile = await requireUser("hire");
  const quiz = quizById(quizId);
  const key = quizKeyById(quizId);
  if (!quiz || !key) return { ok: false, error: "Unknown quiz." };
  const repo = await getRepo();
  const task = taskForHref(`/quiz/${quizId}`);
  const state = await loadHireState(repo, profile);
  if (task && state.taskStatuses[task.id] === "locked") return { ok: false, error: "This quiz is still locked." };
  const alreadyDone = !!task && state.taskStatuses[task.id] === "done";
  if (quizAttemptsToday(await repo.listQuizAttempts(profile.id, quizId)) >= QUIZ_ATTEMPTS_PER_DAY) {
    return { ok: false, error: `That's ${QUIZ_ATTEMPTS_PER_DAY} tries at this quiz today. Re-read the lesson and come back tomorrow.` };
  }

  // Only accept known question ids and option ids.
  const answers: QuizAnswers = {};
  for (const q of quiz.questions) {
    const raw = rawAnswers?.[q.id];
    const opts = new Set(q.options.map((o) => o.id));
    if (typeof raw === "string" && opts.has(raw)) answers[q.id] = raw;
    else if (Array.isArray(raw)) answers[q.id] = raw.filter((r) => typeof r === "string" && opts.has(r)).slice(0, q.options.length);
  }

  const keyed: QuizQuestion[] = quiz.questions.map((q) => {
    const correct = key.items.find((i) => i.questionId === q.id)?.correct ?? [];
    return q.type === "single" ? { id: q.id, type: "single", correct: correct[0] ?? "" } : { id: q.id, type: q.type, correct };
  });
  const result = scoreQuiz(keyed, answers);

  await repo.addQuizAttempt({ hireId: profile.id, quizId, answers, score: result.score, missedItemIds: result.missedIds });

  // Missed items come back in 3 days (then +10, +30 from the miss).
  let reviewsAdded = 0;
  const existing = await repo.listReviewQueue(profile.id);
  for (const id of result.missedIds) {
    if (existing.some((r) => r.itemId === id && r.quizId === quizId)) continue;
    await repo.upsertReviewItem({ hireId: profile.id, itemId: id, quizId, dueDay: state.programDay + REVIEW_INTERVALS[0], step: 0, lastResult: "missed" });
    reviewsAdded++;
  }

  // Security (M1): a failed attempt gets right/wrong per question only, so a blank attempt can't read the key.
  const passed = result.score >= quiz.passScore;
  const revealed = shouldRevealQuizAnswers({ passed, alreadyDone });
  const feedback = buildQuizFeedback(result.perQuestion, key.items, revealed);
  const correctCount = result.perQuestion.filter((p) => p.correct).length;

  const reward = task ? await recordTaskResult(repo, profile, task.id, { score: result.score, data: { quizId } }) : null;
  if (!task) revalidatePath("/", "layout");
  return { ok: true, score: result.score, passScore: quiz.passScore, passed, correctCount, revealed, feedback, reward, reviewsAdded };
}

/** Mark a spaced-repetition review as done: schedule the next interval or retire it. */
export async function completeReview(quizId: string, itemId: string): Promise<{ ok: boolean }> {
  const profile = await requireUser("hire");
  const repo = await getRepo();
  const item = (await repo.listReviewQueue(profile.id)).find((r) => r.itemId === itemId && r.quizId === quizId);
  if (!item) return { ok: false };
  // Security (L2): same due check as answerSpacedReview, so a review can't be cleared early.
  const state = await loadHireState(repo, profile);
  if (!isReviewDue(item, state.programDay)) return { ok: false };
  const next = item.step + 1;
  if (next >= REVIEW_INTERVALS.length) await repo.removeReviewItem(profile.id, itemId);
  else
    await repo.upsertReviewItem({
      ...item,
      step: next,
      dueDay: item.dueDay + (REVIEW_INTERVALS[next] - REVIEW_INTERVALS[item.step]),
      lastResult: "correct",
    });
  revalidatePath("/today");
  return { ok: true };
}

// ---------------------------------------------------------------- Best Self story

export async function submitBestSelfStory(input: { title: string; story: string; strengths: string }): Promise<RewardResult> {
  const profile = await requireUser("hire");
  const title = String(input?.title ?? "").trim().slice(0, 120);
  const story = String(input?.story ?? "").trim().slice(0, 4000);
  const strengths = String(input?.strengths ?? "").trim().slice(0, 300);
  if (story.length < 80) return { ok: false, error: "Tell us a little more: at least a few sentences (80 characters)." };
  return recordTaskResult(await getRepo(), profile, "day1-best-self", { data: { title, story, strengths } });
}

// ---------------------------------------------------------------- pulse

export async function submitPulse(input: { day: number; clarity: number; confidence: number; belonging: number; comment?: string }): Promise<RewardResult> {
  const profile = await requireUser("hire");
  const day = Number(input?.day) as (typeof PULSE_DAYS)[number];
  if (!PULSE_DAYS.includes(day)) return { ok: false, error: "Unknown pulse." };
  const rate = (n: unknown) => {
    const v = Math.round(Number(n));
    return v >= 1 && v <= 5 ? v : null;
  };
  const clarity = rate(input.clarity);
  const confidence = rate(input.confidence);
  const belonging = rate(input.belonging);
  if (!clarity || !confidence || !belonging) return { ok: false, error: "Rate all three, from 1 to 5." };
  const repo = await getRepo();
  const state = await loadHireState(repo, profile);
  if (state.programDay < day) return { ok: false, error: `This pulse opens on day ${day}.` };
  const already = (await repo.listPulses(profile.id)).some((p) => p.day === day);
  if (!already) {
    const comment = String(input.comment ?? "").trim().slice(0, 1000) || undefined;
    await repo.submitPulse({ hireId: profile.id, day, clarity, confidence, belonging, comment, submittedAt: new Date().toISOString() });
  }
  const task = taskForHref(`/pulse/${day}`);
  if (!task) {
    revalidatePath("/", "layout");
    return { ok: true, passed: true, alreadyDone: already, xpGained: 0, trophies: [], stagesCompleted: [] };
  }
  return recordTaskResult(repo, profile, task.id, { data: { pulseDay: day } });
}

// ---------------------------------------------------------------- checklists

export async function saveChecklist(checklistId: string, checkedIds: string[]): Promise<RewardResult | { ok: true; saved: true; done: false }> {
  const profile = await requireUser("hire");
  const list = checklistById(checklistId);
  const task = taskForHref(`/checklist/${checklistId}`);
  if (!list || !task) return { ok: false, error: "Unknown checklist." };
  const valid = new Set(list.items.map((i) => i.id));
  const checked = [...new Set((checkedIds ?? []).filter((id) => valid.has(id)))];
  const repo = await getRepo();
  const state = await loadHireState(repo, profile);
  const status = state.taskStatuses[task.id];
  if (status === "locked") return { ok: false, error: "This checklist is still locked." };
  const prev = state.progress.find((p) => p.taskId === task.id);
  const prevChecked = (prev?.data?.checked as string[] | undefined) ?? [];

  // Shadow log items become shadow-log rows (they feed the Shadow Scholar trophy and the buddy debrief).
  // Security (L3): skip items that already have a row, so tick / untick / re-tick doesn't duplicate it.
  if (checklistId === "shadow-log") {
    const fresh = newShadowLogItems(checked.filter((c) => !prevChecked.includes(c)), list.items, await repo.listShadowLogs(profile.id));
    for (const item of fresh) await repo.addShadowLog({ hireId: profile.id, interaction: item.title, withWhom: "", notes: "" });
  }

  if (checked.length === list.items.length) {
    return recordTaskResult(repo, profile, task.id, { data: { checked } });
  }
  if (status !== "done") {
    await repo.upsertTaskProgress({
      hireId: profile.id,
      taskId: task.id,
      status: "in_progress",
      attempts: prev?.attempts ?? 0,
      data: { ...(prev?.data ?? {}), checked },
    });
  }
  revalidatePath("/", "layout");
  return { ok: true, saved: true, done: false };
}

// ---------------------------------------------------------------- demo time-skip

// requireUser runs outside try/catch so its redirect is never swallowed.
function assertDemo(profile: { isDemo: boolean }) {
  if (!isDemoMode() || !profile.isDemo) throw new Error("Time-skip is only available on demo accounts.");
}

export async function demoSkipDays(days: number): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireUser("hire");
  try {
    assertDemo(profile);
    const n = Math.max(1, Math.min(30, Math.trunc(Number(days) || 1)));
    await (await getRepo()).setDemoDayOffset(profile.id, profile.demoDayOffset + n);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not skip time." };
  }
}

export async function demoJump(stageId: string): Promise<RewardResult> {
  const profile = await requireUser("hire");
  try {
    assertDemo(profile);
    if (!stages.some((s) => s.id === stageId)) return { ok: false, error: "Unknown stage." };
    return await demoJumpToStage(await getRepo(), profile, stageId as StageId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not jump." };
  }
}

/** Demo only: back to day 0 and the seeded progress, XP, quiz attempts and trophies. */
export async function demoReset(): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireUser("hire");
  try {
    assertDemo(profile);
    await (await getRepo()).resetDemoHire(profile.id);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not reset." };
  }
}

// ---------------------------------------------------------------- people: quests, shadow log, matcher

const clipText = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const MAX_OPEN_QUESTS = 8;

/** The hire asks to meet a colleague. The buddy (or manager) confirms it later. */
export async function requestQuest(input: { staffId: string; type: string }): Promise<ActionResult> {
  const profile = await requireUser("hire");
  const person = staffById(String(input?.staffId ?? ""));
  if (!person) return { ok: false, error: "Pick a colleague from the list." };
  if (!isQuestType(input?.type)) return { ok: false, error: "Pick a type of quest." };
  const type = input.type;
  const repo = await getRepo();
  const quests = await repo.listQuests(profile.id);
  if (quests.some((q) => q.staffId === person.id && q.type === type)) return { ok: false, error: `That quest with ${person.name.split(" ")[0]} is already on your list.` };
  if (type === "buddy-intro" && quests.some((q) => q.type === "buddy-intro")) return { ok: false, error: "You already have a buddy intro." };
  if (quests.filter((q) => !q.confirmedAt).length >= MAX_OPEN_QUESTS) return { ok: false, error: `You have ${MAX_OPEN_QUESTS} open quests. Get a few confirmed first.` };
  await repo.createQuest({ hireId: profile.id, staffId: person.id, type, title: QUEST_TYPES[type].title(person.name) });
  revalidatePath("/people");
  return { ok: true, message: "Added. Your buddy confirms it once it has happened." };
}

/** Free-form shadow-log entry: who you shadowed and what you observed. */
export async function addShadowLogEntry(input: { interaction: string; withWhom: string; notes: string }): Promise<ActionResult> {
  const profile = await requireUser("hire");
  const interaction = clipText(input?.interaction, 120);
  const withWhom = clipText(input?.withWhom, 120);
  const notes = clipText(input?.notes, 1500);
  if (interaction.length < 3) return { ok: false, error: "Say what kind of interaction it was." };
  if (withWhom.length < 2) return { ok: false, error: "Say who you shadowed." };
  if (notes.length < 20) return { ok: false, error: "Write a little about what you observed (at least 20 characters)." };
  const repo = await getRepo();
  await repo.addShadowLog({ hireId: profile.id, interaction, withWhom, notes });
  const trophies = await awardNewTrophies(repo, await loadHireState(repo, profile));
  revalidatePath("/people");
  return { ok: true, message: trophies.length ? `Trophy earned: ${trophies.map((t) => t.name).join(", ")}` : "Logged. Bring it to your next buddy debrief." };
}

/** Save which parts of the matcher profile colleagues can see. Only keys the profile already has are accepted. */
export async function saveMatcherVisibility(visibility: Record<string, boolean>): Promise<ActionResult> {
  const profile = await requireUser("hire");
  const repo = await getRepo();
  const current = await repo.getMatcherProfile(profile.id);
  if (!current) return { ok: false, error: "Finish the matcher chat first." };
  const next: Record<string, boolean> = { ...current.visibility };
  for (const key of Object.keys(next)) if (typeof visibility?.[key] === "boolean") next[key] = visibility[key];
  await repo.saveMatcherProfile({ hireId: profile.id, interests: current.interests, suggestions: current.suggestions, visibility: next });
  revalidatePath("/people");
  revalidatePath("/people/matcher");
  const shown = Object.values(next).filter(Boolean).length;
  return { ok: true, message: shown ? `${shown} item${shown === 1 ? "" : "s"} visible to colleagues.` : "Everything is private." };
}

/** Called after /api/ai/matcher finish has saved a profile: completes the roadmap task. */
export async function completeMatcherTask(): Promise<RewardResult> {
  const profile = await requireUser("hire");
  const repo = await getRepo();
  const saved = await repo.getMatcherProfile(profile.id);
  if (!saved) return { ok: false, error: "Finish the matcher chat first." };
  return recordTaskResult(repo, profile, "day1-matcher", { data: { interests: saved.interests.length } });
}

// ---------------------------------------------------------------- missions

export async function submitMission(missionId: string, input: { sopId: string; section: string; problem: string; fix: string }): Promise<RewardResult> {
  const profile = await requireUser("hire");
  const def = MISSION_DEFS[String(missionId)];
  const task = def && taskForHref(`/missions/${def.id}`);
  if (!def || !task) return { ok: false, error: "Unknown mission." };
  const sop = sopById(String(input?.sopId ?? ""));
  if (!sop) return { ok: false, error: "Pick the SOP you want to improve." };
  const section = clipText(input?.section, SUGGESTION_LIMITS.section);
  const problem = clipText(input?.problem, SUGGESTION_LIMITS.problem);
  const fix = clipText(input?.fix, SUGGESTION_LIMITS.fix);
  if (problem.length < SUGGESTION_LIMITS.min) return { ok: false, error: "Describe what could be better (at least 20 characters)." };
  if (fix.length < SUGGESTION_LIMITS.min) return { ok: false, error: "Write your proposed fix (at least 20 characters)." };
  const repo = await getRepo();
  const state = await loadHireState(repo, profile);
  const status = state.taskStatuses[task.id];
  if (status === "locked") return { ok: false, error: "This mission is still locked." };
  if (status === "done") return recordTaskResult(repo, profile, task.id);
  const suggestion = [section && `Section: ${section}`, `What could be better: ${problem}`, `Proposed fix: ${fix}`].filter(Boolean).join("\n\n");
  const row = await repo.addSopSuggestion({ hireId: profile.id, sopId: sop.id, suggestion });
  return recordTaskResult(repo, profile, task.id, { data: { sopId: sop.id, suggestionId: row.id, section, problem, fix } });
}

// ---------------------------------------------------------------- reviews (task reviews + spaced repetition)

export async function submitReviewTask(
  reviewId: string,
  input: { answers?: Record<string, string>; ratings?: Record<string, number>; assessments?: Record<string, string>; confirmed?: boolean },
): Promise<RewardResult> {
  const profile = await requireUser("hire");
  const def = REVIEW_DEFS[String(reviewId)];
  const task = def && taskForHref(`/review/${def.id}`);
  if (!def || !task) return { ok: false, error: "Unknown review." };

  const answers: Record<string, string> = {};
  for (const p of def.prompts) {
    const v = clipText(input?.answers?.[p.id], 2000);
    if (p.required && v.length < 10) return { ok: false, error: `Answer "${p.label}" (at least 10 characters).` };
    if (v) answers[p.id] = v;
  }
  const ratings: Record<string, number> = {};
  for (const r of def.ratings ?? []) {
    const v = Math.round(Number(input?.ratings?.[r.id]));
    if (!(v >= 1 && v <= 5)) return { ok: false, error: "Rate every statement from 1 to 5." };
    ratings[r.id] = v;
  }
  if (def.confirm && input?.confirmed !== true) return { ok: false, error: "Tick the confirmation box first." };

  const repo = await getRepo();
  const state = await loadHireState(repo, profile);
  const status = state.taskStatuses[task.id];
  if (status === "locked") return { ok: false, error: "This review is still locked." };
  if (status === "done") return recordTaskResult(repo, profile, task.id);

  const assessments: Record<string, string> = {};
  if (def.scorecard === "assess") {
    const items = await repo.listScorecardItems(profile.id);
    const ids = items.length ? items.map((i) => i.id) : scorecardGoals.map((g) => g.id);
    const allowed = new Set<string>(ASSESS_OPTIONS.map((o) => o.v));
    for (const id of ids) {
      const v = String(input?.assessments?.[id] ?? "");
      if (!allowed.has(v)) return { ok: false, error: "Rate yourself on every goal." };
      assessments[id] = v;
    }
  }

  if (def.ratings?.length) {
    const comment = [answers.keep && `Keep: ${answers.keep}`, answers.change && `Change: ${answers.change}`].filter(Boolean).join("\n\n") || undefined;
    await repo.addProgramReview({ hireId: profile.id, ratings, comment });
  }
  return recordTaskResult(repo, profile, task.id, {
    data: { answers, ...(def.ratings?.length ? { ratings } : {}), ...(def.scorecard === "assess" ? { assessments } : {}), ...(def.confirm ? { confirmed: true } : {}) },
  });
}

export type SpacedAnswerResult =
  | { ok: true; correct: boolean; correctOptionIds: string[]; explanation: string; reviewModuleId?: string; retired: boolean; nextDueDay?: number }
  | { ok: false; error: string };

/**
 * Re-answer a missed quiz question. Correct: move to the next interval (or retire after +30).
 * Missed again: start over at +3 from today.
 */
export async function answerSpacedReview(quizId: string, itemId: string, raw: string | string[]): Promise<SpacedAnswerResult> {
  const profile = await requireUser("hire");
  const quiz = quizById(String(quizId));
  const key = quizKeyById(String(quizId));
  const q = quiz?.questions.find((x) => x.id === itemId);
  const keyItem = key?.items.find((i) => i.questionId === itemId);
  if (!quiz || !q || !keyItem) return { ok: false, error: "That review question no longer exists." };
  const repo = await getRepo();
  const state = await loadHireState(repo, profile);
  const item = (await repo.listReviewQueue(profile.id)).find((r) => r.itemId === itemId && r.quizId === quizId);
  if (!item) return { ok: false, error: "This review is already done." };
  if (!isReviewDue(item, state.programDay)) return { ok: false, error: `This one comes back on day ${item.dueDay}.` };

  const opts = new Set(q.options.map((o) => o.id));
  const answer = Array.isArray(raw) ? raw.filter((r) => typeof r === "string" && opts.has(r)).slice(0, q.options.length) : opts.has(String(raw)) ? String(raw) : "";
  const keyed: QuizQuestion = q.type === "single" ? { id: q.id, type: "single", correct: keyItem.correct[0] ?? "" } : { id: q.id, type: q.type, correct: keyItem.correct };
  const correct = scoreQuiz([keyed], { [q.id]: answer }).perQuestion[0]?.correct ?? false;

  let retired = false;
  let nextDueDay: number | undefined;
  if (correct) {
    const next = item.step + 1;
    if (next >= REVIEW_INTERVALS.length) {
      await repo.removeReviewItem(profile.id, itemId);
      retired = true;
    } else {
      nextDueDay = item.dueDay + (REVIEW_INTERVALS[next] - REVIEW_INTERVALS[item.step]);
      await repo.upsertReviewItem({ ...item, step: next, dueDay: nextDueDay, lastResult: "correct" });
    }
  } else {
    nextDueDay = state.programDay + REVIEW_INTERVALS[0];
    await repo.upsertReviewItem({ ...item, step: 0, dueDay: nextDueDay, lastResult: "missed" });
  }
  revalidatePath("/today");
  return { ok: true, correct, correctOptionIds: keyItem.correct, explanation: keyItem.explanation ?? "", reviewModuleId: keyItem.reviewModuleId, retired, nextDueDay };
}
