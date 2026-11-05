// Pure lab-scoring helpers. Framework-free and key-agnostic: answer keys are passed in by server code,
// so importing this file from a client component never ships a key.
import type { Story } from "@/content/schema";

const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// ---------------------------------------------------------------- branching story

export interface StoryPathResult {
  valid: boolean;
  endingKind?: "good" | "mixed" | "bad";
  /** Node ids visited, starting with the start node. */
  nodeIds: string[];
  /** 100 for the good ending, 0 otherwise. */
  score: number;
}

/** Replays a list of choice ids from the story's start node. Invalid if any choice is not offered or the path does not end on an ending. */
export function evaluateStoryPath(story: Story, choiceIds: readonly string[]): StoryPathResult {
  const byId = new Map(story.nodes.map((n) => [n.id, n]));
  let node = byId.get(story.startNodeId);
  const nodeIds: string[] = node ? [node.id] : [];
  if (!node || choiceIds.length > story.nodes.length) return { valid: false, nodeIds, score: 0 };
  for (const cid of choiceIds) {
    const choice = node.choices.find((c) => c.id === cid);
    if (!choice) return { valid: false, nodeIds, score: 0 };
    node = byId.get(choice.nextId);
    if (!node) return { valid: false, nodeIds, score: 0 };
    nodeIds.push(node.id);
  }
  if (!node.ending) return { valid: false, nodeIds, score: 0 };
  return { valid: true, endingKind: node.ending.kind, nodeIds, score: node.ending.kind === "good" ? 100 : 0 };
}

// ---------------------------------------------------------------- multiple-choice drills

export interface DrillKeyLike {
  drillId: string;
  correctOptionId: string;
}

export interface DrillScore {
  score: number;
  correct: number;
  total: number;
  missedIds: string[];
  unansweredIds: string[];
}

/** Scores drill answers against the key. Unanswered drills count as wrong. */
export function scoreDrillAnswers(answers: Readonly<Record<string, string>>, keys: readonly DrillKeyLike[]): DrillScore {
  let correct = 0;
  const missedIds: string[] = [];
  const unansweredIds: string[] = [];
  for (const k of keys) {
    const a = answers[k.drillId];
    if (a === undefined) unansweredIds.push(k.drillId);
    if (a === k.correctOptionId) correct++;
    else missedIds.push(k.drillId);
  }
  const total = keys.length;
  return { score: total ? clamp100((correct / total) * 100) : 0, correct, total, missedIds, unansweredIds };
}

// ---------------------------------------------------------------- phishing simulation

export const PHISH_ACTIONS = ["report", "click", "reply", "delete", "forward"] as const;
export type PhishAction = (typeof PHISH_ACTIONS)[number];

export interface PhishScore {
  score: number;
  actionCorrect: boolean;
  foundFlagIds: string[];
  missedFlagIds: string[];
  /** Hotspots marked suspicious that are not red flags. */
  falseAlarms: string[];
}

export const PHISH_ACTION_POINTS = 50;
export const PHISH_FALSE_ALARM_PENALTY = 5;

/**
 * Half the score for the right action (report), half for the share of red flags found.
 * `hotspotFlags` maps each hotspot id to the red-flag id it reveals, or null for a harmless part of the email.
 */
export function scorePhishing(
  input: { hotspots: readonly string[]; action: string },
  hotspotFlags: Readonly<Record<string, string | null>>,
  allFlagIds: readonly string[],
  correctAction: PhishAction = "report",
): PhishScore {
  const found = new Set<string>();
  const falseAlarms: string[] = [];
  for (const h of new Set(input.hotspots)) {
    if (!(h in hotspotFlags)) continue;
    const flag = hotspotFlags[h];
    if (flag) found.add(flag);
    else falseAlarms.push(h);
  }
  const foundFlagIds = allFlagIds.filter((f) => found.has(f));
  const missedFlagIds = allFlagIds.filter((f) => !found.has(f));
  const actionCorrect = input.action === correctAction;
  const flagPoints = allFlagIds.length ? ((100 - PHISH_ACTION_POINTS) * foundFlagIds.length) / allFlagIds.length : 100 - PHISH_ACTION_POINTS;
  const score = (actionCorrect ? PHISH_ACTION_POINTS : 0) + flagPoints - falseAlarms.length * PHISH_FALSE_ALARM_PENALTY;
  return { score: clamp100(score), actionCorrect, foundFlagIds, missedFlagIds, falseAlarms };
}

// ---------------------------------------------------------------- multi-item labs (redline, translator)

/** Keeps the best score per item. Returns a new record. */
export function withBestScore(prev: Readonly<Record<string, number>> | undefined, itemId: string, score: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(prev ?? {})) if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  out[itemId] = Math.max(out[itemId] ?? 0, clamp100(score));
  return out;
}

/**
 * The lab score once enough items are graded: the mean of the best score per known item.
 * Returns null while fewer than `minItems` known items have a score.
 */
export function combinedLabScore(best: Readonly<Record<string, number>>, itemIds: readonly string[], minItems = itemIds.length): number | null {
  const scores = itemIds.map((id) => best[id]).filter((s): s is number => typeof s === "number" && Number.isFinite(s));
  if (scores.length === 0 || scores.length < minItems) return null;
  return clamp100(scores.reduce((a, s) => a + s, 0) / scores.length);
}

/** Text sent to the grader for one redline flag: category + note, with the escalation decision spelled out. */
export function redlineNote(note: string, escalate: boolean, max = 600): string {
  const suffix = escalate ? " Escalate to legal review." : "";
  return `${note.trim().slice(0, Math.max(0, max - suffix.length))}${suffix}`.trim();
}

// ---------------------------------------------------------------- phishing reveal rule (security M1)

export interface PhishFlagKeyLike {
  id: string;
  where: string;
  description: string;
}

export interface PhishView {
  score: number;
  actionCorrect: boolean;
  foundCount: number;
  missedCount: number;
  falseAlarmCount: number;
  /** The full answer (every red flag and the correct action). Null until the hire passes or the task is done. */
  reveal: { flags: (PhishFlagKeyLike & { found: boolean })[]; correctAction: string } | null;
}

/**
 * What a phishing submission may show. A wrong action only gets counts, so a retry can't replay the key;
 * the flags and the correct action are revealed on a pass, or when the task is already done.
 */
export function phishingView(r: PhishScore, key: { redFlags: readonly PhishFlagKeyLike[]; correctAction: string }, opts: { passed: boolean; taskDone: boolean }): PhishView {
  const show = opts.taskDone || (opts.passed && r.actionCorrect);
  return {
    score: r.score,
    actionCorrect: r.actionCorrect,
    foundCount: r.foundFlagIds.length,
    missedCount: r.missedFlagIds.length,
    falseAlarmCount: r.falseAlarms.length,
    reveal: show ? { flags: key.redFlags.map((f) => ({ id: f.id, where: f.where, description: f.description, found: r.foundFlagIds.includes(f.id) })), correctAction: key.correctAction } : null,
  };
}

// ---------------------------------------------------------------- drill option order (security M1)

/** Small deterministic string hash (FNV-1a), used to seed the option shuffle. */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Shuffles each drill's options with a seed (e.g. hire id + attempt number), so every attempt shows a new
 * order and a retake can't replay the positions revealed by the last attempt's feedback. Deterministic:
 * the server computes it and the page renders the same order on the server and the client.
 */
export function shuffleDrillOptions<T extends { id: string; options: readonly { id: string }[] }>(drills: readonly T[], seed: string): T[] {
  return drills.map((d) => {
    const opts = [...d.options];
    let state = hash32(`${seed}:${d.id}`) || 1;
    for (let i = opts.length - 1; i > 0; i--) {
      // xorshift32
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      const j = (state >>> 0) % (i + 1);
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return { ...d, options: opts };
  });
}
