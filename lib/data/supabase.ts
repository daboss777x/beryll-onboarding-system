import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, Pulse, StaffMember, TaskProgress, XpEvent } from "../types";
import { createSupabaseAdminClient } from "../supabase/admin";
import { noteSubject, PRIVATE_OBSERVATION_KEYS, splitObservation } from "./private-notes";
import { buildSeed } from "./seed";
import type { Repository } from "./repo";
import type {
  Certification,
  CheckInRecord,
  Contract,
  Kudos,
  MatcherProfile,
  ProgramReview,
  Quest,
  QuizAttempt,
  ReviewItem,
  RoleplaySession,
  ScorecardItem,
  ShadowLog,
  SopSuggestion,
  StageProgress,
  TrophyEarned,
  WalkthroughRun,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const u = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);
const num = (v: unknown): number | undefined => (v === null || v === undefined ? undefined : Number(v));

async function q<T = Row[]>(p: PromiseLike<{ data: any; error: any }>, what: string): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(`[repo:${what}] ${error.message ?? String(error)}`);
  return data as T;
}

// ---- row mappers ----------------------------------------------------------
const toProfile = (r: Row): Profile => ({
  id: r.id,
  name: r.name,
  email: r.email,
  role: r.role,
  title: r.title ?? "",
  avatarUrl: u(r.avatar_url),
  managerId: u(r.manager_id),
  buddyId: u(r.buddy_id),
  startDate: r.start_date,
  demoDayOffset: r.demo_day_offset ?? 0,
  isDemo: !!r.is_demo,
});
const toStaff = (r: Row): StaffMember => ({
  id: r.id,
  name: r.name,
  title: r.title,
  team: r.team,
  bio: r.bio,
  interests: r.interests ?? [],
  availabilityNote: r.availability_note,
  avatarSeed: r.avatar_seed,
});
const toStage = (r: Row): StageProgress => ({ hireId: r.hire_id, stageId: r.stage_id, status: r.status, completedAt: u(r.completed_at) });
const toTask = (r: Row): TaskProgress => {
  const data: Record<string, unknown> = { ...(r.data ?? {}) };
  for (const k of Object.keys(data)) if (/^qa[A-Z]/.test(k)) delete data[k];
  if (r.qa_score !== null && r.qa_score !== undefined) {
    data.qaScore = Number(r.qa_score);
    data.qaAt = r.qa_at ?? null;
    // qaNotes is manager-only: merged from manager_notes in getTaskProgress.
  }
  return {
    hireId: r.hire_id,
    taskId: r.task_id,
    status: r.status,
    score: num(r.score),
    attempts: r.attempts ?? 0,
    data,
    completedAt: u(r.completed_at),
  };
};
const toQuiz = (r: Row): QuizAttempt => ({
  id: r.id, hireId: r.hire_id, quizId: r.quiz_id, answers: r.answers ?? {}, score: Number(r.score), missedItemIds: r.missed_item_ids ?? [], at: r.created_at,
});
const toReview = (r: Row): ReviewItem => ({
  hireId: r.hire_id, itemId: r.item_id, quizId: r.quiz_id, dueDay: r.due_day, step: r.step, lastResult: u(r.last_result),
});
const toWalk = (r: Row): WalkthroughRun => ({
  id: r.id, hireId: r.hire_id, walkthroughId: r.walkthrough_id, mode: r.mode, errors: r.errors, durationMs: r.duration_ms, passed: r.passed, at: r.created_at,
});
const toContract = (r: Row): Contract => ({
  id: r.id, hireId: r.hire_id, templateId: u(r.template_id), client: r.client, type: r.type, title: r.title, status: r.status,
  valueEur: num(r.value_eur), clauses: r.clauses ?? [], clientId: u(r.client_id), owner: u(r.owner),
  createdAt: r.created_at, updatedAt: r.updated_at,
});
const toRoleplay = (r: Row): RoleplaySession => ({
  id: r.id, hireId: r.hire_id, personaId: r.persona_id, isCertification: r.is_certification, transcript: r.transcript ?? [],
  rubricScores: r.rubric_scores ?? [], overall: num(r.overall), aiSummary: u(r.ai_summary), passed: r.passed, at: r.created_at,
  status: r.status ?? "ended", endedAt: u(r.ended_at), endResponse: u(r.end_response),
});
const toCert = (r: Row): Certification => ({
  hireId: r.hire_id, stageId: r.stage_id, aiScore: num(r.ai_score), roleplaySessionId: u(r.roleplay_session_id),
  managerObservation: u(r.manager_observation), status: r.status, attempts: r.attempts ?? 0, signedBy: u(r.signed_by),
  signedAt: u(r.signed_at), updatedAt: r.updated_at,
});
const toCheckin = (r: Row): CheckInRecord => ({
  id: r.id, hireId: r.hire_id, dueDay: r.due_day, label: r.label, heldAt: u(r.held_at), notes: u(r.notes), agenda: r.agenda ?? [],
});
const toPulse = (r: Row): Pulse => ({
  hireId: r.hire_id, day: r.day, clarity: r.clarity, confidence: r.confidence, belonging: r.belonging, comment: u(r.comment), submittedAt: r.submitted_at,
});
const toScore = (r: Row): ScorecardItem => ({
  id: r.id, hireId: r.hire_id, horizon: r.horizon, goal: r.goal, target: r.target, status: r.status, note: u(r.note), updatedAt: r.updated_at,
});
const toQuest = (r: Row): Quest => ({
  id: r.id, hireId: r.hire_id, staffId: u(r.staff_id), type: r.type, title: r.title, confirmedBy: u(r.confirmed_by), confirmedAt: u(r.confirmed_at), createdAt: r.created_at,
});
const toKudos = (r: Row): Kudos => ({
  id: r.id, fromId: r.from_id ?? r.from_staff_id, fromName: u(r.from_name), kind: u(r.kind), toId: r.to_id, message: r.message, at: r.created_at,
});
const toShadow = (r: Row): ShadowLog => ({ id: r.id, hireId: r.hire_id, interaction: r.interaction, withWhom: r.with_whom, notes: r.notes, at: r.created_at });
const toSop = (r: Row): SopSuggestion => ({ id: r.id, hireId: r.hire_id, sopId: r.sop_id, suggestion: r.suggestion, status: r.status, at: r.created_at });
const toReviewP = (r: Row): ProgramReview => ({ id: r.id, hireId: r.hire_id, ratings: r.ratings ?? {}, comment: u(r.comment), at: r.created_at });
const toXp = (r: Row): XpEvent => ({ hireId: r.hire_id, source: r.source, amount: r.amount, at: r.created_at });
const toTrophy = (r: Row): TrophyEarned => ({ hireId: r.hire_id, trophyId: r.trophy_id, at: r.earned_at });
const toMatcher = (r: Row): MatcherProfile => ({
  hireId: r.hire_id, interests: r.interests ?? [], visibility: r.visibility ?? {}, suggestions: r.suggestions ?? [], updatedAt: r.updated_at,
});

const UNIQUE_VIOLATION = "23505";
const UUID = /^[0-9a-f-]{36}$/i;

export interface SupabaseRepoOptions {
  /**
   * Service-role client factory, used ONLY for server-computed writes that RLS
   * gives users no write on: XP + trophy awards, and the scored/completion tables
   * (stage_progress, task_progress, quiz_attempts, review_queue, walkthrough_runs,
   * roleplay_sessions, certifications, scorecard_items). Each use is preceded by an RLS-backed
   * check of who the caller is. Defaults to createSupabaseAdminClient()
   * (needs SUPABASE_SERVICE_ROLE_KEY).
   */
  awardsClient?: () => SupabaseClient;
  /**
   * `db` is the service-role client and the CALLER has already authorised the write
   * (see getSystemRepo in ./index.ts). Skips the per-caller checks in awards()/progress().
   */
  system?: boolean;
}

/** Supabase-backed repository. `db` must be a per-request client so RLS applies. */
export function createSupabaseRepo(db: SupabaseClient, opts: SupabaseRepoOptions = {}): Repository {
  let awardsDb: SupabaseClient | undefined;
  /**
   * Service-role client for awards, after checking (through RLS on the user's
   * client) that the caller can see this hire: the hire, their manager or buddy.
   */
  const awards = async (hireId: string) => {
    if (opts.system) return db;
    const visible = await q<Row | null>(
      db.from("profiles").select("id").eq("id", hireId).eq("role", "hire").maybeSingle(),
      "awards.check",
    );
    if (!visible) throw new Error("[repo:awards] not allowed to award this hire");
    return (awardsDb ??= (opts.awardsClient ?? createSupabaseAdminClient)());
  };
  /**
   * Service-role client for progress/score writes, after checking that the caller
   * is the hire themself or (through RLS on profiles) the hire's manager. Buddies
   * cannot write progress. Callers must pass values the server computed.
   */
  const progress = async (hireId: string) => {
    if (opts.system) return db;
    const { data } = await db.auth.getUser();
    const uid = data.user?.id;
    if (!uid) throw new Error("[repo:progress] not signed in");
    if (uid !== hireId) {
      const managed = await q<Row | null>(
        db.from("profiles").select("id").eq("id", hireId).eq("role", "hire").eq("manager_id", uid).maybeSingle(),
        "progress.check",
      );
      if (!managed) throw new Error("[repo:progress] not allowed to write this hire's progress");
    }
    return (awardsDb ??= (opts.awardsClient ?? createSupabaseAdminClient)());
  };
  /**
   * Hire-only write through the service role (pulses): the caller must BE the hire.
   * Pulses have no user INSERT grant, so a hire can't pick an arbitrary day via PostgREST;
   * the server action checks the program day first.
   */
  const ownOnly = async (hireId: string) => {
    if (opts.system) return db;
    const { data } = await db.auth.getUser();
    if (!data.user?.id || data.user.id !== hireId) throw new Error("[repo:progress] only the hire can write this");
    return (awardsDb ??= (opts.awardsClient ?? createSupabaseAdminClient)());
  };
  /**
   * Manager-only notes for a hire, by subject. Read with the caller's client: RLS on
   * manager_notes returns rows only to the hire's manager, so hires and buddies get none.
   */
  const notesFor = async (hireId: string, prefix: string): Promise<Map<string, string>> => {
    const rows = await q<Row[] | null>(
      db.from("manager_notes").select("subject, body").eq("hire_id", hireId).like("subject", `${prefix}%`),
      "notes.list",
    );
    return new Map((rows ?? []).map((r) => [r.subject as string, r.body as string]));
  };
  /** Sets (or clears, when empty) one manager note. RLS: the hire's manager only. */
  const writeNote = async (hireId: string, subject: string, body: unknown) => {
    const text = typeof body === "string" ? body : "";
    if (text) {
      await q(
        db.from("manager_notes").upsert({ hire_id: hireId, subject, body: text, updated_at: new Date().toISOString() }, { onConflict: "hire_id,subject" }),
        "notes.write",
      );
    } else {
      await q(db.from("manager_notes").delete().match({ hire_id: hireId, subject }), "notes.clear");
    }
  };
  const one = async <T>(table: string, match: Row, map: (r: Row) => T): Promise<T | null> => {
    const r = await q<Row | null>(db.from(table).select("*").match(match).maybeSingle(), `${table}.get`);
    return r ? map(r) : null;
  };

  return {
    mode: "supabase",

    async getSessionProfile() {
      const { data } = await db.auth.getUser();
      if (!data.user) return null;
      return one("profiles", { id: data.user.id }, toProfile);
    },
    getProfile: (id) => one("profiles", { id }, toProfile),
    async listHiresForManager(managerId) {
      const rows = await q(db.from("profiles").select("*").eq("manager_id", managerId).eq("role", "hire").order("start_date"), "hires");
      return rows.map(toProfile);
    },
    async getBuddyHire(buddyId) {
      const rows = await q<Row[]>(db.rpc("buddy_hire_summary"), "buddy_hire_summary");
      void buddyId; // the RPC scopes to auth.uid()
      const r = rows[0];
      return r
        ? { hireId: r.hire_id, name: r.name, title: r.title, avatarUrl: u(r.avatar_url), startDate: r.start_date, demoDayOffset: r.demo_day_offset, tasksDone: r.tasks_done, questsOpen: r.quests_open }
        : null;
    },
    async setDemoDayOffset(hireId, offset) {
      await q(db.rpc("set_demo_day_offset", { p_hire_id: hireId, p_offset: Math.trunc(offset) }), "set_demo_day_offset");
    },
    async resetDemoHire(hireId) {
      const admin = await ownOnly(hireId);
      const me = await q<Row | null>(admin.from("profiles").select("id, role, is_demo").eq("id", hireId).maybeSingle(), "reset.check");
      if (!me || me.role !== "hire" || !me.is_demo) throw new Error("[repo:reset] only demo hires can be reset");
      for (const t of ["stage_progress", "task_progress", "quiz_attempts", "review_queue", "walkthrough_runs", "xp_events", "trophies_earned"]) {
        await q(admin.from(t).delete().eq("hire_id", hireId), `reset.${t}`);
      }
      // Re-insert this hire's seeded rows (same shape as seedSupabase in ./seed.ts).
      const seed = buildSeed();
      const mine = <T extends { hireId: string }>(l: T[]) => l.filter((r) => r.hireId === hireId);
      const ins = async (table: string, rows: object[]) => {
        if (rows.length) await q(admin.from(table).insert(rows), `reset.${table}.seed`);
      };
      await ins("stage_progress", mine(seed.stageProgress).map((s) => ({ hire_id: hireId, stage_id: s.stageId, status: s.status, completed_at: s.completedAt ?? null })));
      await ins(
        "task_progress",
        mine(seed.taskProgress).map((t) => ({
          hire_id: hireId, task_id: t.taskId, status: t.status, score: t.score ?? null, attempts: t.attempts, data: t.data ?? {}, completed_at: t.completedAt ?? null,
        })),
      );
      await ins("xp_events", mine(seed.xpEvents).map((e) => ({ hire_id: hireId, source: e.source, amount: e.amount, created_at: e.at })));
      await ins("trophies_earned", mine(seed.trophies).map((t) => ({ hire_id: hireId, trophy_id: t.trophyId, earned_at: t.at })));
      const offset = seed.profiles.find((p) => p.id === hireId)?.demoDayOffset ?? 0;
      await q(db.rpc("set_demo_day_offset", { p_hire_id: hireId, p_offset: offset }), "set_demo_day_offset");
    },
    async listStaff() {
      return (await q(db.from("staff_directory").select("*").order("name"), "staff")).map(toStaff);
    },

    async listStageProgress(hireId) {
      return (await q(db.from("stage_progress").select("*").eq("hire_id", hireId), "stages")).map(toStage);
    },
    async upsertStageProgress(p) {
      const r = await q<Row>(
        (await progress(p.hireId)).from("stage_progress").upsert({ hire_id: p.hireId, stage_id: p.stageId, status: p.status, completed_at: p.completedAt ?? null }).select().single(),
        "stage.upsert",
      );
      return toStage(r);
    },
    async getTaskProgress(hireId) {
      const [rows, notes] = await Promise.all([
        q(db.from("task_progress").select("*").eq("hire_id", hireId), "tasks"),
        notesFor(hireId, "qa:"),
      ]);
      return rows.map((r) => {
        const t = toTask(r);
        const n = notes.get(noteSubject.qa(t.taskId));
        if (n !== undefined && t.data && "qaScore" in t.data) t.data.qaNotes = n;
        return t;
      });
    },
    async upsertTaskProgress(p) {
      const data = Object.fromEntries(Object.entries(p.data ?? {}).filter(([k]) => !/^qa[A-Z]/.test(k)));
      const r = await q<Row>(
        (await progress(p.hireId))
          .from("task_progress")
          .upsert({
            hire_id: p.hireId, task_id: p.taskId, status: p.status, score: p.score ?? null, attempts: p.attempts,
            data, completed_at: p.completedAt ?? null, updated_at: new Date().toISOString(),
          })
          .select()
          .single(),
        "task.upsert",
      );
      return toTask(r);
    },
    async setTaskQa(hireId, taskId, score, notes) {
      await q(db.rpc("set_task_qa", { p_hire_id: hireId, p_task_id: taskId, p_score: score, p_notes: notes ?? null }), "set_task_qa");
    },

    async addQuizAttempt(a) {
      const r = await q<Row>(
        (await progress(a.hireId)).from("quiz_attempts").insert({ hire_id: a.hireId, quiz_id: a.quizId, answers: a.answers, score: a.score, missed_item_ids: a.missedItemIds }).select().single(),
        "quiz.add",
      );
      return toQuiz(r);
    },
    async listQuizAttempts(hireId, quizId) {
      let b = db.from("quiz_attempts").select("*").eq("hire_id", hireId);
      if (quizId) b = b.eq("quiz_id", quizId);
      return (await q(b.order("created_at", { ascending: false }), "quiz.list")).map(toQuiz);
    },
    async listReviewQueue(hireId, dueByDay) {
      let b = db.from("review_queue").select("*").eq("hire_id", hireId);
      if (dueByDay !== undefined) b = b.lte("due_day", dueByDay);
      return (await q(b.order("due_day"), "review.list")).map(toReview);
    },
    async upsertReviewItem(i) {
      const r = await q<Row>(
        (await progress(i.hireId)).from("review_queue").upsert({
          hire_id: i.hireId, item_id: i.itemId, quiz_id: i.quizId, due_day: i.dueDay, step: i.step, last_result: i.lastResult ?? null, updated_at: new Date().toISOString(),
        }).select().single(),
        "review.upsert",
      );
      return toReview(r);
    },
    async removeReviewItem(hireId, itemId) {
      await q((await progress(hireId)).from("review_queue").delete().match({ hire_id: hireId, item_id: itemId }), "review.remove");
    },

    async saveWalkthroughRun(w) {
      const r = await q<Row>(
        (await progress(w.hireId)).from("walkthrough_runs").insert({
          hire_id: w.hireId, walkthrough_id: w.walkthroughId, mode: w.mode, errors: w.errors, duration_ms: Math.round(w.durationMs), passed: w.passed,
        }).select().single(),
        "walkthrough.save",
      );
      return toWalk(r);
    },
    async listWalkthroughRuns(hireId, walkthroughId) {
      let b = db.from("walkthrough_runs").select("*").eq("hire_id", hireId);
      if (walkthroughId) b = b.eq("walkthrough_id", walkthroughId);
      return (await q(b.order("created_at", { ascending: false }), "walkthrough.list")).map(toWalk);
    },

    async listContracts(hireId) {
      return (await q(db.from("contracts").select("*").eq("hire_id", hireId).order("updated_at", { ascending: false }), "contracts.list")).map(toContract);
    },
    getContract: (hireId, id) => one("contracts", { hire_id: hireId, id }, toContract),
    async createContract(hireId, t) {
      const r = await q<Row>(
        db.from("contracts").insert({
          hire_id: hireId, template_id: t.templateId ?? null, client: t.client, type: t.type, title: t.title,
          status: t.status ?? "draft", value_eur: t.valueEur ?? null, clauses: t.clauses,
        }).select().single(),
        "contracts.create",
      );
      return toContract(r);
    },
    async updateContractClauses(hireId, id, clauses) {
      const r = await q<Row>(
        db.from("contracts").update({ clauses, updated_at: new Date().toISOString() }).match({ hire_id: hireId, id }).select().single(),
        "contracts.clauses",
      );
      return toContract(r);
    },
    async moveContractStatus(hireId, id, status) {
      const r = await q<Row>(
        db.from("contracts").update({ status, updated_at: new Date().toISOString() }).match({ hire_id: hireId, id }).select().single(),
        "contracts.status",
      );
      return toContract(r);
    },
    async deleteContract(hireId, id) {
      await q(db.from("contracts").delete().match({ hire_id: hireId, id }), "contracts.delete");
    },

    async saveRoleplaySession(s) {
      const r = await q<Row>(
        (await progress(s.hireId)).from("roleplay_sessions").insert({
          hire_id: s.hireId, persona_id: s.personaId, is_certification: s.isCertification, transcript: s.transcript,
          rubric_scores: s.rubricScores, overall: s.overall ?? null, ai_summary: s.aiSummary ?? null, passed: s.passed,
        }).select().single(),
        "roleplay.save",
      );
      return toRoleplay(r);
    },
    async listRoleplaySessions(hireId) {
      return (
        await q(db.from("roleplay_sessions").select("*").eq("hire_id", hireId).eq("status", "ended").order("created_at", { ascending: false }), "roleplay.list")
      ).map(toRoleplay);
    },
    async createRoleplaySession(s) {
      const r = await q<Row>(
        (await progress(s.hireId)).from("roleplay_sessions").insert({
          hire_id: s.hireId, persona_id: s.personaId, is_certification: s.isCertification, status: "active",
        }).select().single(),
        "roleplay.create",
      );
      return toRoleplay(r);
    },
    async getRoleplaySession(hireId, id) {
      if (!UUID.test(id)) return null;
      return one("roleplay_sessions", { hire_id: hireId, id }, toRoleplay);
    },
    async appendRoleplayTurns(hireId, id, turns, opts) {
      if (!UUID.test(id)) return null;
      // Service-role-only RPC: one UPDATE that checks owner, status and the turn limit.
      const rows = await q<Row[]>(
        (await progress(hireId)).rpc("append_roleplay_turns", {
          p_session_id: id, p_hire_id: hireId, p_turns: turns, p_max_user_turns: opts?.maxUserTurns ?? null,
        }),
        "append_roleplay_turns",
      );
      return rows?.[0] ? toRoleplay(rows[0]) : null;
    },
    async endRoleplaySession(hireId, id, o) {
      if (!UUID.test(id)) return null;
      const r = await q<Row | null>(
        (await progress(hireId))
          .from("roleplay_sessions")
          .update({
            status: "ended", ended_at: new Date().toISOString(), rubric_scores: o.rubricScores, overall: o.overall,
            ai_summary: o.aiSummary, passed: o.passed, end_response: o.endResponse,
          })
          .match({ hire_id: hireId, id, status: "active" })
          .select()
          .maybeSingle(),
        "roleplay.end",
      );
      return r ? toRoleplay(r) : null;
    },
    async getCertification(hireId, stageId = "days8-30") {
      const [cert, notes] = await Promise.all([
        one("certifications", { hire_id: hireId, stage_id: stageId }, toCert),
        notesFor(hireId, `cert:${stageId}:`),
      ]);
      if (!cert || notes.size === 0) return cert;
      const obs: Record<string, unknown> = { ...(cert.managerObservation ?? {}) };
      for (const k of PRIVATE_OBSERVATION_KEYS) {
        const n = notes.get(noteSubject.cert(stageId, k));
        if (n !== undefined) obs[k] = n;
      }
      return { ...cert, managerObservation: obs };
    },
    async saveCertification(c) {
      // Manager-only keys go to manager_notes (user client, RLS: manager only); only keys
      // PRESENT in the observation are written, so a hire-side write (role-play grading
      // passing back what it read) leaves the manager's notes alone.
      const { shared, privateKeys } = splitObservation(c.managerObservation);
      for (const k of PRIVATE_OBSERVATION_KEYS) {
        if (k in privateKeys) await writeNote(c.hireId, noteSubject.cert(c.stageId, k), privateKeys[k]);
      }
      const r = await q<Row>(
        (await progress(c.hireId)).from("certifications").upsert({
          hire_id: c.hireId, stage_id: c.stageId, ai_score: c.aiScore ?? null, roleplay_session_id: c.roleplaySessionId ?? null,
          manager_observation: shared ?? null, status: c.status, attempts: c.attempts, signed_by: c.signedBy ?? null,
          signed_at: c.signedAt ?? null, updated_at: new Date().toISOString(),
        }).select().single(),
        "cert.save",
      );
      const saved = toCert(r);
      const visible = Object.fromEntries(Object.entries(privateKeys).filter(([, v]) => typeof v === "string" && v));
      return Object.keys(visible).length ? { ...saved, managerObservation: { ...(saved.managerObservation ?? {}), ...visible } } : saved;
    },

    async listCheckins(hireId) {
      const [rows, notes] = await Promise.all([
        q(db.from("checkins").select("*").eq("hire_id", hireId).order("due_day"), "checkins.list"),
        notesFor(hireId, "checkin:"),
      ]);
      return rows.map((r) => {
        const c = toCheckin(r);
        const n = notes.get(noteSubject.checkin(c.dueDay));
        return n !== undefined ? { ...c, notes: n } : c;
      });
    },
    async upsertCheckin(c) {
      const row: Row = { hire_id: c.hireId, due_day: c.dueDay, label: c.label, held_at: c.heldAt ?? null, agenda: c.agenda ?? [] };
      const isUuid = c.id && /^[0-9a-f-]{36}$/i.test(c.id);
      const r = isUuid
        ? await q<Row>(db.from("checkins").update(row).eq("id", c.id!).select().single(), "checkins.update")
        : await q<Row>(db.from("checkins").upsert(row, { onConflict: "hire_id,due_day" }).select().single(), "checkins.upsert");
      const saved = toCheckin(r);
      if ("notes" in c) {
        await writeNote(saved.hireId, noteSubject.checkin(saved.dueDay), c.notes);
        return c.notes ? { ...saved, notes: c.notes } : saved;
      }
      return saved;
    },
    async listPulses(hireId) {
      return (await q(db.from("pulses").select("*").eq("hire_id", hireId).order("day"), "pulses.list")).map(toPulse);
    },
    async submitPulse(p) {
      const { data, error } = await (await ownOnly(p.hireId)).from("pulses").insert({
        hire_id: p.hireId, day: p.day, clarity: p.clarity, confidence: p.confidence, belonging: p.belonging, comment: p.comment ?? null, submitted_at: p.submittedAt,
      }).select().single();
      if (error?.code === UNIQUE_VIOLATION) throw new Error(`Pulse for day ${p.day} already submitted`);
      if (error) throw new Error(`[repo:pulses.submit] ${error.message}`);
      return toPulse(data);
    },
    async listScorecardItems(hireId) {
      return (await q(db.from("scorecard_items").select("*").eq("hire_id", hireId).order("horizon"), "scorecard.list")).map(toScore);
    },
    async upsertScorecardItem(i) {
      const row: Row = { hire_id: i.hireId, horizon: i.horizon, goal: i.goal, target: i.target, status: i.status, note: i.note ?? null, updated_at: new Date().toISOString() };
      if (i.id) row.id = i.id;
      return toScore(await q<Row>((await progress(i.hireId)).from("scorecard_items").upsert(row).select().single(), "scorecard.upsert"));
    },
    async addSopSuggestion(s) {
      return toSop(await q<Row>(db.from("sop_suggestions").insert({ hire_id: s.hireId, sop_id: s.sopId, suggestion: s.suggestion }).select().single(), "sop.add"));
    },
    async listSopSuggestions(hireId) {
      return (await q(db.from("sop_suggestions").select("*").eq("hire_id", hireId).order("created_at", { ascending: false }), "sop.list")).map(toSop);
    },
    async addProgramReview(r) {
      return toReviewP(await q<Row>(db.from("program_reviews").insert({ hire_id: r.hireId, ratings: r.ratings, comment: r.comment ?? null }).select().single(), "review.add"));
    },
    async listProgramReviews(hireId) {
      return (await q(db.from("program_reviews").select("*").eq("hire_id", hireId).order("created_at", { ascending: false }), "review.list")).map(toReviewP);
    },

    async listQuests(hireId) {
      return (await q(db.from("quests").select("*").eq("hire_id", hireId).order("created_at"), "quests.list")).map(toQuest);
    },
    async createQuest(x) {
      return toQuest(await q<Row>(db.from("quests").insert({ hire_id: x.hireId, staff_id: x.staffId ?? null, type: x.type, title: x.title }).select().single(), "quests.create"));
    },
    async confirmQuest(questId, confirmerId) {
      void confirmerId; // the RPC uses auth.uid()
      return toQuest(await q<Row>(db.rpc("confirm_quest", { p_quest_id: questId }), "confirm_quest"));
    },
    async listKudos(profileId) {
      if (!/^[0-9a-f-]{36}$/i.test(profileId)) throw new Error("[repo:kudos.list] invalid profile id");
      return (
        await q(db.from("kudos").select("*").or(`from_id.eq.${profileId},to_id.eq.${profileId}`).order("created_at", { ascending: false }), "kudos.list")
      ).map(toKudos);
    },
    async addKudos(fromId, toId, message) {
      return toKudos(await q<Row>(db.from("kudos").insert({ from_id: fromId, to_id: toId, message: message.slice(0, 500) }).select().single(), "kudos.add"));
    },
    async listShadowLogs(hireId) {
      return (await q(db.from("shadow_logs").select("*").eq("hire_id", hireId).order("created_at", { ascending: false }), "shadow.list")).map(toShadow);
    },
    async addShadowLog(l) {
      return toShadow(await q<Row>(db.from("shadow_logs").insert({ hire_id: l.hireId, interaction: l.interaction, with_whom: l.withWhom, notes: l.notes }).select().single(), "shadow.add"));
    },
    async getBuddyMatcherView(buddyId) {
      void buddyId; // the RPC scopes to auth.uid()
      const rows = await q<Row[]>(db.rpc("buddy_matcher_profile"), "buddy_matcher_profile");
      const r = rows?.[0];
      return r ? { hireId: r.hire_id, interests: r.interests ?? [], updatedAt: r.updated_at } : null;
    },
    getMatcherProfile: (hireId) => one("matcher_profiles", { hire_id: hireId }, toMatcher),
    async saveMatcherProfile(m) {
      return toMatcher(
        await q<Row>(
          db.from("matcher_profiles").upsert({
            hire_id: m.hireId, interests: m.interests, visibility: m.visibility, suggestions: m.suggestions, updated_at: new Date().toISOString(),
          }).select().single(),
          "matcher.save",
        ),
      );
    },

    async addXpEvent(e) {
      const { error } = await (await awards(e.hireId)).from("xp_events").insert({ hire_id: e.hireId, source: e.source, amount: e.amount, created_at: e.at ?? new Date().toISOString() });
      if (error?.code === UNIQUE_VIOLATION) return false;
      if (error) throw new Error(`[repo:xp.add] ${error.message}`);
      return true;
    },
    async listXpEvents(hireId) {
      return (await q(db.from("xp_events").select("*").eq("hire_id", hireId).order("created_at"), "xp.list")).map(toXp);
    },
    async listTrophies(hireId) {
      return (await q(db.from("trophies_earned").select("*").eq("hire_id", hireId), "trophies.list")).map(toTrophy);
    },
    async awardTrophy(hireId, trophyId) {
      const { error } = await (await awards(hireId)).from("trophies_earned").insert({ hire_id: hireId, trophy_id: trophyId });
      if (error?.code === UNIQUE_VIOLATION) return false;
      if (error) throw new Error(`[repo:trophies.award] ${error.message}`);
      return true;
    },

    async incrementAiUsage(userId, feature) {
      void userId; // the RPC counts for auth.uid()
      return q<number>(db.rpc("increment_ai_usage", { p_feature: feature }), "increment_ai_usage");
    },
  };
}
