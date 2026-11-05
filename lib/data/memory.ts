import "server-only";
import type { Profile, Pulse, TaskProgress, XpEvent } from "../types";
import type { Repository } from "./repo";
import { PRIVATE_OBSERVATION_KEYS, splitObservation, stripCertificationNotes, stripCheckinNotes, stripTaskQaNotes } from "./private-notes";
import { buildSeed, type SeedData } from "./seed";
import {
  isContractStatus,
  type Certification,
  type CheckInRecord,
  type Contract,
  type MatcherProfile,
  type RoleplaySession,
  type SessionUser,
} from "./types";

/**
 * In-memory repository (no Supabase env). State is a module-level singleton
 * pinned on globalThis so it survives hot reloads within one dev server
 * process. Restarting the server resets to seed data.
 */

const GLOBAL_KEY = "__beryllMemoryStore__";
type G = typeof globalThis & { [GLOBAL_KEY]?: SeedData };

export function getMemoryStore(): SeedData {
  const g = globalThis as G;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = buildSeed();
  return g[GLOBAL_KEY]!;
}

export function resetMemoryStore(now?: Date): SeedData {
  const g = globalThis as G;
  g[GLOBAL_KEY] = buildSeed(now);
  return g[GLOBAL_KEY]!;
}

const nowIso = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const clone = <T>(v: T): T => structuredClone(v);
const byAtDesc = <T extends { at: string }>(a: T, b: T) => b.at.localeCompare(a.at);

/** Find the user's profile id from an email (memory-mode sign-in). */
export function memoryFindUserByEmail(state: SeedData, email: string): Profile | null {
  const id = state.credentials[email.trim().toLowerCase()];
  return id ? clone(state.profiles.find((p) => p.id === id) ?? null) : null;
}

export function createMemoryRepo(
  state: SeedData,
  getSession: () => Promise<SessionUser | null>,
): Repository {
  const profile = (id: string) => state.profiles.find((p) => p.id === id);
  /**
   * Manager-only notes (check-in notes, QA notes, certification observation notes) are
   * returned only to the hire's manager, like RLS on public.manager_notes in Supabase.
   */
  const isManagerOf = async (hireId: string) => {
    const s = await getSession();
    return !!s && profile(hireId)?.managerId === s.id;
  };
  const needContract = (hireId: string, id: string): Contract => {
    const c = state.contracts.find((x) => x.id === id && x.hireId === hireId);
    if (!c) throw new Error(`Contract ${id} not found`);
    return c;
  };

  const repo: Repository = {
    mode: "memory",

    async getSessionProfile() {
      const s = await getSession();
      if (!s) return null;
      const p = profile(s.id);
      return p ? clone(p) : null;
    },
    async getProfile(id) {
      const p = profile(id);
      return p ? clone(p) : null;
    },
    async listHiresForManager(managerId) {
      return clone(state.profiles.filter((p) => p.role === "hire" && p.managerId === managerId));
    },
    async getBuddyHire(buddyId) {
      const p = state.profiles.find((x) => x.role === "hire" && x.buddyId === buddyId);
      if (!p) return null;
      return {
        hireId: p.id,
        name: p.name,
        title: p.title,
        avatarUrl: p.avatarUrl,
        startDate: p.startDate,
        demoDayOffset: p.demoDayOffset,
        tasksDone: state.taskProgress.filter((t) => t.hireId === p.id && t.status === "done").length,
        questsOpen: state.quests.filter((q) => q.hireId === p.id && !q.confirmedAt).length,
      };
    },
    async setDemoDayOffset(hireId, offset) {
      const p = profile(hireId);
      if (!p) throw new Error(`Profile ${hireId} not found`);
      if (!p.isDemo) throw new Error("Time-skip is only available on demo profiles");
      p.demoDayOffset = Math.max(0, Math.trunc(offset));
    },
    async resetDemoHire(hireId) {
      const p = profile(hireId);
      if (!p) throw new Error(`Profile ${hireId} not found`);
      if (!p.isDemo || p.role !== "hire") throw new Error("Reset is only available on demo hires");
      const seed = buildSeed();
      p.demoDayOffset = seed.profiles.find((x) => x.id === hireId)?.demoDayOffset ?? 0;
      const reseed = <T extends { hireId: string }>(cur: T[], fresh: T[]) => [...cur.filter((r) => r.hireId !== hireId), ...fresh.filter((r) => r.hireId === hireId)];
      state.stageProgress = reseed(state.stageProgress, seed.stageProgress);
      state.taskProgress = reseed(state.taskProgress, seed.taskProgress);
      state.quizAttempts = reseed(state.quizAttempts, seed.quizAttempts);
      state.reviewQueue = reseed(state.reviewQueue, seed.reviewQueue);
      state.walkthroughRuns = reseed(state.walkthroughRuns, seed.walkthroughRuns);
      state.xpEvents = reseed(state.xpEvents, seed.xpEvents);
      state.trophies = reseed(state.trophies, seed.trophies);
    },
    async listStaff() {
      return clone(state.staff);
    },

    async listStageProgress(hireId) {
      return clone(state.stageProgress.filter((s) => s.hireId === hireId));
    },
    async upsertStageProgress(p) {
      const i = state.stageProgress.findIndex((s) => s.hireId === p.hireId && s.stageId === p.stageId);
      if (i >= 0) state.stageProgress[i] = clone(p);
      else state.stageProgress.push(clone(p));
      return clone(p);
    },
    async getTaskProgress(hireId) {
      const rows = clone(state.taskProgress.filter((t) => t.hireId === hireId));
      return (await isManagerOf(hireId)) ? rows : rows.map(stripTaskQaNotes);
    },
    async upsertTaskProgress(p: TaskProgress) {
      const i = state.taskProgress.findIndex((t) => t.hireId === p.hireId && t.taskId === p.taskId);
      // QA fields (data.qa*) are manager-only: drop incoming ones, keep stored ones.
      const prevQa = i >= 0 ? pickQa(state.taskProgress[i].data) : {};
      const row: TaskProgress = { ...clone(p), data: { ...omitQa(p.data), ...prevQa } };
      if (i >= 0) state.taskProgress[i] = row;
      else state.taskProgress.push(row);
      const saved = clone(state.taskProgress.find((t) => t.hireId === p.hireId && t.taskId === p.taskId)!);
      return (await isManagerOf(p.hireId)) ? saved : stripTaskQaNotes(saved);
    },
    async setTaskQa(hireId, taskId, score, notes) {
      const t = state.taskProgress.find((x) => x.hireId === hireId && x.taskId === taskId);
      if (!t) throw new Error(`No progress for ${taskId}`);
      t.data = { ...(t.data ?? {}), qaScore: score, qaNotes: notes ?? null, qaAt: nowIso() };
    },

    async addQuizAttempt(a) {
      const row = { ...clone(a), id: uid(), at: nowIso() };
      state.quizAttempts.push(row);
      return clone(row);
    },
    async listQuizAttempts(hireId, quizId) {
      return clone(state.quizAttempts.filter((q) => q.hireId === hireId && (!quizId || q.quizId === quizId)).sort(byAtDesc));
    },
    async listReviewQueue(hireId, dueByDay) {
      return clone(
        state.reviewQueue
          .filter((r) => r.hireId === hireId && (dueByDay === undefined || r.dueDay <= dueByDay))
          .sort((a, b) => a.dueDay - b.dueDay),
      );
    },
    async upsertReviewItem(item) {
      const i = state.reviewQueue.findIndex((r) => r.hireId === item.hireId && r.itemId === item.itemId);
      if (i >= 0) state.reviewQueue[i] = clone(item);
      else state.reviewQueue.push(clone(item));
      return clone(item);
    },
    async removeReviewItem(hireId, itemId) {
      state.reviewQueue = state.reviewQueue.filter((r) => !(r.hireId === hireId && r.itemId === itemId));
    },

    async saveWalkthroughRun(r) {
      const row = { ...clone(r), id: uid(), at: nowIso() };
      state.walkthroughRuns.push(row);
      return clone(row);
    },
    async listWalkthroughRuns(hireId, walkthroughId) {
      return clone(
        state.walkthroughRuns.filter((w) => w.hireId === hireId && (!walkthroughId || w.walkthroughId === walkthroughId)).sort(byAtDesc),
      );
    },

    async listContracts(hireId) {
      return clone(state.contracts.filter((c) => c.hireId === hireId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    },
    async getContract(hireId, id) {
      const c = state.contracts.find((x) => x.id === id && x.hireId === hireId);
      return c ? clone(c) : null;
    },
    async createContract(hireId, t) {
      if (t.status !== undefined && !isContractStatus(t.status)) throw new Error(`Unknown contract status ${String(t.status)}`);
      const ts = nowIso();
      const row: Contract = {
        id: uid(),
        hireId,
        templateId: t.templateId,
        client: t.client,
        type: t.type,
        title: t.title,
        status: t.status ?? "draft",
        valueEur: t.valueEur,
        clauses: clone(t.clauses),
        createdAt: ts,
        updatedAt: ts,
      };
      state.contracts.push(row);
      return clone(row);
    },
    async updateContractClauses(hireId, id, clauses) {
      const c = needContract(hireId, id);
      c.clauses = clone(clauses);
      c.updatedAt = nowIso();
      return clone(c);
    },
    async moveContractStatus(hireId, id, status) {
      if (!isContractStatus(status)) throw new Error(`Unknown contract status ${String(status)}`);
      const c = needContract(hireId, id);
      c.status = status;
      c.updatedAt = nowIso();
      return clone(c);
    },
    async deleteContract(hireId, id) {
      state.contracts = state.contracts.filter((c) => !(c.id === id && c.hireId === hireId));
    },

    async saveRoleplaySession(s) {
      const row = { ...clone(s), id: uid(), at: nowIso() };
      state.roleplaySessions.push(row);
      return clone(row);
    },
    async listRoleplaySessions(hireId) {
      return clone(state.roleplaySessions.filter((s) => s.hireId === hireId && s.status !== "active").sort(byAtDesc));
    },
    async createRoleplaySession(s) {
      const row: RoleplaySession = {
        id: uid(), hireId: s.hireId, personaId: s.personaId, isCertification: s.isCertification,
        transcript: [], rubricScores: [], passed: false, at: nowIso(), status: "active",
      };
      state.roleplaySessions.push(row);
      return clone(row);
    },
    async getRoleplaySession(hireId, id) {
      const r = state.roleplaySessions.find((s) => s.id === id && s.hireId === hireId);
      return r ? clone(r) : null;
    },
    async appendRoleplayTurns(hireId, id, turns, opts) {
      const r = state.roleplaySessions.find((s) => s.id === id && s.hireId === hireId);
      if (!r || r.status !== "active") return null;
      if (opts?.maxUserTurns !== undefined && r.transcript.filter((t) => t.role === "user").length >= opts.maxUserTurns) return null;
      r.transcript.push(...clone(turns));
      return clone(r);
    },
    async endRoleplaySession(hireId, id, o) {
      const r = state.roleplaySessions.find((s) => s.id === id && s.hireId === hireId);
      if (!r || r.status !== "active") return null;
      Object.assign(r, {
        status: "ended", endedAt: nowIso(), rubricScores: clone(o.rubricScores), overall: o.overall,
        aiSummary: o.aiSummary, passed: o.passed, endResponse: clone(o.endResponse),
      });
      return clone(r);
    },
    async getCertification(hireId, stageId = "days8-30") {
      const c = state.certifications.find((x) => x.hireId === hireId && x.stageId === stageId);
      if (!c) return null;
      return (await isManagerOf(hireId)) ? clone(c) : stripCertificationNotes(clone(c));
    },
    async saveCertification(c) {
      const i = state.certifications.findIndex((x) => x.hireId === c.hireId && x.stageId === c.stageId);
      // A write that doesn't carry a manager-only key (e.g. the hire's role-play grading
      // passing back the observation it read) keeps the stored one, as in Supabase.
      const prevPrivate = i >= 0 ? splitObservation(state.certifications[i].managerObservation).privateKeys : {};
      const obs = c.managerObservation ? clone(c.managerObservation) : undefined;
      if (obs) for (const k of PRIVATE_OBSERVATION_KEYS) if (!(k in obs) && k in prevPrivate) obs[k] = prevPrivate[k];
      const row: Certification = { ...clone(c), managerObservation: obs, updatedAt: nowIso() };
      if (i >= 0) state.certifications[i] = row;
      else state.certifications.push(row);
      return (await isManagerOf(c.hireId)) ? clone(row) : stripCertificationNotes(clone(row));
    },

    async listCheckins(hireId) {
      const rows = clone(state.checkins.filter((c) => c.hireId === hireId).sort((a, b) => a.dueDay - b.dueDay));
      return (await isManagerOf(hireId)) ? rows : rows.map(stripCheckinNotes);
    },
    async upsertCheckin(c) {
      const i = state.checkins.findIndex((x) => (c.id ? x.id === c.id : x.hireId === c.hireId && x.dueDay === c.dueDay));
      const row: CheckInRecord = { ...clone(c), id: c.id ?? (i >= 0 ? state.checkins[i].id : uid()) };
      if (i >= 0) state.checkins[i] = { ...state.checkins[i], ...row };
      else state.checkins.push(row);
      const saved = clone(i >= 0 ? state.checkins[i] : row);
      return (await isManagerOf(c.hireId)) ? saved : stripCheckinNotes(saved);
    },
    async listPulses(hireId) {
      return clone(state.pulses.filter((p) => p.hireId === hireId).sort((a, b) => a.day - b.day));
    },
    async submitPulse(p: Pulse) {
      if (state.pulses.some((x) => x.hireId === p.hireId && x.day === p.day)) {
        throw new Error(`Pulse for day ${p.day} already submitted`);
      }
      state.pulses.push(clone(p));
      return clone(p);
    },
    async listScorecardItems(hireId) {
      return clone(state.scorecardItems.filter((s) => s.hireId === hireId).sort((a, b) => a.horizon - b.horizon));
    },
    async upsertScorecardItem(item) {
      const row = { ...clone(item), id: item.id ?? uid(), updatedAt: nowIso() };
      const i = state.scorecardItems.findIndex((s) => s.id === row.id);
      if (i >= 0) state.scorecardItems[i] = row;
      else state.scorecardItems.push(row);
      return clone(row);
    },
    async addSopSuggestion(s) {
      const row = { ...clone(s), id: uid(), status: "submitted" as const, at: nowIso() };
      state.sopSuggestions.push(row);
      return clone(row);
    },
    async listSopSuggestions(hireId) {
      return clone(state.sopSuggestions.filter((s) => s.hireId === hireId).sort(byAtDesc));
    },
    async addProgramReview(r) {
      const row = { ...clone(r), id: uid(), at: nowIso() };
      state.programReviews.push(row);
      return clone(row);
    },
    async listProgramReviews(hireId) {
      return clone(state.programReviews.filter((r) => r.hireId === hireId).sort(byAtDesc));
    },

    async listQuests(hireId) {
      return clone(state.quests.filter((q) => q.hireId === hireId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    },
    async createQuest(q) {
      // Never accept confirmation fields from the creator (mirrors quests_insert_own in SQL).
      const { confirmedAt: _a, confirmedBy: _b, ...rest } = clone(q) as typeof q & { confirmedAt?: string; confirmedBy?: string };
      void _a;
      void _b;
      const row = { ...rest, id: uid(), createdAt: nowIso() };
      state.quests.push(row);
      return clone(row);
    },
    async confirmQuest(questId, confirmerId) {
      const q = state.quests.find((x) => x.id === questId);
      if (!q) throw new Error(`Quest ${questId} not found`);
      const hire = profile(q.hireId);
      if (!hire || (hire.buddyId !== confirmerId && hire.managerId !== confirmerId)) {
        throw new Error("Only the hire's buddy or manager can confirm this quest");
      }
      if (!q.confirmedAt) {
        q.confirmedBy = confirmerId;
        q.confirmedAt = nowIso();
      }
      return clone(q);
    },
    async listKudos(profileId) {
      return clone(state.kudos.filter((k) => k.fromId === profileId || k.toId === profileId).sort(byAtDesc));
    },
    async addKudos(fromId, toId, message) {
      if (fromId === toId) throw new Error("You can't send kudos to yourself");
      // Mirrors kudos_insert in SQL: buddy/manager -> their hire, or hire -> their own manager/buddy.
      const from = profile(fromId);
      const to = profile(toId);
      const related =
        !!from && !!to &&
        (to.buddyId === fromId || to.managerId === fromId || from.managerId === toId || from.buddyId === toId);
      if (!related) throw new Error("Kudos can only go to your hire, or to your own manager or buddy");
      const row = { id: uid(), fromId, toId, message: message.slice(0, 500), at: nowIso() };
      state.kudos.push(row);
      return clone(row);
    },
    async listShadowLogs(hireId) {
      return clone(state.shadowLogs.filter((l) => l.hireId === hireId).sort(byAtDesc));
    },
    async addShadowLog(l) {
      const row = { ...clone(l), id: uid(), at: nowIso() };
      state.shadowLogs.push(row);
      return clone(row);
    },
    async getMatcherProfile(hireId) {
      const m = state.matcherProfiles.find((x) => x.hireId === hireId);
      return m ? clone(m) : null;
    },
    async getBuddyMatcherView(buddyId) {
      const hire = state.profiles.find((p) => p.role === "hire" && p.buddyId === buddyId);
      const m = hire && state.matcherProfiles.find((x) => x.hireId === hire.id);
      return m ? { hireId: m.hireId, interests: visibleInterests(m), updatedAt: m.updatedAt } : null;
    },
    async saveMatcherProfile(m) {
      const row = { ...clone(m), updatedAt: nowIso() };
      const i = state.matcherProfiles.findIndex((x) => x.hireId === m.hireId);
      if (i >= 0) state.matcherProfiles[i] = row;
      else state.matcherProfiles.push(row);
      return clone(row);
    },

    async addXpEvent(e) {
      if (state.xpEvents.some((x) => x.hireId === e.hireId && x.source === e.source)) return false;
      const row: XpEvent = { hireId: e.hireId, source: e.source, amount: e.amount, at: e.at ?? nowIso() };
      state.xpEvents.push(row);
      return true;
    },
    async listXpEvents(hireId) {
      return clone(state.xpEvents.filter((x) => x.hireId === hireId).sort((a, b) => a.at.localeCompare(b.at)));
    },
    async listTrophies(hireId) {
      return clone(state.trophies.filter((t) => t.hireId === hireId));
    },
    async awardTrophy(hireId, trophyId) {
      if (state.trophies.some((t) => t.hireId === hireId && t.trophyId === trophyId)) return false;
      state.trophies.push({ hireId, trophyId, at: nowIso() });
      return true;
    },

    async incrementAiUsage(userId, feature) {
      const day = new Date().toISOString().slice(0, 10);
      const k = `${userId}|${feature}|${day}`;
      const counts = aiUsage(state);
      counts.set(k, (counts.get(k) ?? 0) + 1);
      return counts.get(k)!;
    },
  };
  return repo;
}

/** Interests a buddy may see: all of them when `interests` is visible, else only the individually visible ones. */
export function visibleInterests(m: Pick<MatcherProfile, "interests" | "visibility">): string[] {
  if (m.visibility.interests === true) return [...m.interests];
  return m.interests.filter((i) => m.visibility[`interest:${i}`] === true);
}

const isQa = (k: string) => /^qa[A-Z]/.test(k);
function pickQa(d?: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(d ?? {}).filter(([k]) => isQa(k)));
}
function omitQa(d?: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(clone(d ?? {})).filter(([k]) => !isQa(k)));
}

const AI_USAGE = new WeakMap<SeedData, Map<string, number>>();
function aiUsage(state: SeedData): Map<string, number> {
  let m = AI_USAGE.get(state);
  if (!m) AI_USAGE.set(state, (m = new Map()));
  return m;
}
