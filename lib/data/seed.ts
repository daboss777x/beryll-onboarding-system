import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { scorecardGoals } from "../../content/scorecard";
import { rubric } from "../../content/server/rubric";
import { stages } from "../../content/stages";
import { tasks } from "../../content/tasks";
import type { DemoHire } from "../../content/demo";
import type { Profile, Pulse, StaffMember, TaskProgress, XpEvent } from "../types";
import { dublinDateString } from "../logic/program-day";
import { isDemoMode } from "../supabase/env";
import { evaluateTrophies } from "../logic/trophies";
import { computeStageStatuses } from "../logic/unlocks";
import { noteSubject, PRIVATE_OBSERVATION_KEYS, splitObservation } from "./private-notes";
import { buildDemoData, DEMO_IDS, DEMO_PASSWORD_FALLBACK, SAMPLE_CONTRACTS, STAFF } from "./seed-content";
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
  ScorecardStatus,
  ShadowLog,
  SopSuggestion,
  StageProgress,
  TrophyEarned,
  WalkthroughRun,
} from "./types";

export interface SeedData {
  profiles: Profile[];
  /** email (lower-case) -> profile id, for memory-mode sign-in. */
  credentials: Record<string, string>;
  staff: StaffMember[];
  stageProgress: StageProgress[];
  taskProgress: TaskProgress[];
  quizAttempts: QuizAttempt[];
  reviewQueue: ReviewItem[];
  walkthroughRuns: WalkthroughRun[];
  contracts: Contract[];
  roleplaySessions: RoleplaySession[];
  certifications: Certification[];
  checkins: CheckInRecord[];
  pulses: Pulse[];
  scorecardItems: ScorecardItem[];
  quests: Quest[];
  kudos: Kudos[];
  shadowLogs: ShadowLog[];
  sopSuggestions: SopSuggestion[];
  programReviews: ProgramReview[];
  xpEvents: XpEvent[];
  trophies: TrophyEarned[];
  matcherProfiles: MatcherProfile[];
}

export { DEMO_IDS };

/**
 * DEMO_PASSWORD from env, falling back to content/demo.ts DEMO_PASSWORD (public: it is in
 * the repo). Demo accounts can only sign in while isDemoMode() is on (lib/data/auth.ts).
 */
export function demoPassword(): string {
  return process.env.DEMO_PASSWORD || DEMO_PASSWORD_FALLBACK;
}

export class SeedConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SeedConfigError";
  }
}

/**
 * Password for seeding real auth users. In production (NODE_ENV or VERCEL_ENV = production)
 * an explicit DEMO_PASSWORD is required: the content fallback is public.
 */
export function seedPassword(env: { DEMO_PASSWORD?: string; NODE_ENV?: string; VERCEL_ENV?: string } = process.env): string {
  const explicit = env.DEMO_PASSWORD?.trim();
  if (explicit) return explicit;
  if (env.NODE_ENV === "production" || env.VERCEL_ENV === "production") {
    throw new SeedConfigError("Refusing to seed in production without an explicit DEMO_PASSWORD (the default one is public).");
  }
  return DEMO_PASSWORD_FALLBACK;
}

const DAY_MS = 86_400_000;
const CERT_TASK_ID = "d30-certification";
const STORY_TASK_ID = "day1-best-self";

function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * DAY_MS).toISOString().slice(0, 10);
}

/** start_date so that getProgramDay(profile, now) === programDay (with offset 0). */
export function startDateForProgramDay(programDay: number, now: Date): string {
  const today = dublinDateString(now);
  // Day 0 means "starts tomorrow"; day N >= 1 means started N-1 days ago.
  return programDay <= 0 ? addDays(today, 1) : addDays(today, -(programDay - 1));
}

/**
 * Deterministic UUID (version-5 shaped, not a real SHA-1 v5) from a string key,
 * so Supabase rows seeded from content ids can be upserted idempotently.
 */
export function stableUuid(key: string): string {
  const words: number[] = [];
  for (let seed = 0; seed < 4; seed++) {
    let h = (0x811c9dc5 ^ (seed * 0x9e3779b1)) >>> 0;
    for (let i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    words.push(h);
  }
  const hex = words.map((w) => w.toString(16).padStart(8, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

const SCORECARD_STATUS: Record<DemoHire["scorecard"][number]["status"], ScorecardStatus> = {
  agreed: "not_started",
  in_progress: "on_track",
  met: "done",
  missed: "at_risk",
};

const QUEST_TITLE: Record<string, (name: string) => string> = {
  "buddy-intro": (n) => `Buddy intro with ${n}`,
  coffee: (n) => `Coffee with ${n}`,
  "scoping-call": (n) => `Shadow a scoping call with ${n}`,
  "cross-team": (n) => `Cross-team project with ${n}`,
};

const latest = (isoList: (string | undefined)[]): string | undefined =>
  isoList.filter((x): x is string => !!x).sort().at(-1);

/** Build the full demo dataset relative to `now` from content/demo.ts. Pure apart from the clock. */
export function buildSeed(now: Date = new Date()): SeedData {
  const today = dublinDateString(now);
  const demo = buildDemoData(today);
  const staffName = (id: string) => STAFF.find((s) => s.id === id)?.name ?? id;
  // Staff-directory people who also have an app account.
  const accountForStaff = new Map(demo.accounts.filter((a) => a.staffId).map((a) => [a.staffId!, a.profile.id]));
  const nowIso = now.toISOString();

  const data: SeedData = {
    profiles: [],
    credentials: {},
    staff: STAFF.map((s) => ({ ...s, interests: [...s.interests] })),
    stageProgress: [],
    taskProgress: [],
    quizAttempts: [],
    reviewQueue: [],
    walkthroughRuns: [],
    contracts: [],
    roleplaySessions: [],
    certifications: [],
    checkins: [],
    pulses: [],
    scorecardItems: [],
    quests: [],
    kudos: [],
    shadowLogs: [],
    sopSuggestions: [],
    programReviews: [],
    xpEvents: [],
    trophies: [],
    matcherProfiles: [],
  };

  // Profiles: manager, buddy, Alex (first hire, so getBuddyHire finds Alex), then the five dummy hires.
  const byRole = (r: Profile["role"]) => demo.accounts.filter((a) => a.profile.role === r).map((a) => ({ ...a.profile }));
  const hires: DemoHire[] = [demo.alex, ...demo.hires];
  data.profiles.push(...byRole("manager"), ...byRole("buddy"), ...hires.map((h) => ({ ...h.profile })));
  for (const p of data.profiles) data.credentials[p.email.toLowerCase()] = p.id;

  for (const h of hires) {
    const hireId = h.profile.id;
    const progress: TaskProgress[] = h.taskProgress.map((t) => structuredClone(t));

    // Best Self story lives on the story task's progress row.
    if (h.story) {
      const row = progress.find((t) => t.taskId === STORY_TASK_ID);
      if (row) row.data = { ...(row.data ?? {}), story: h.story.text, storySubmittedAt: h.story.submittedAt };
    }
    data.taskProgress.push(...progress);

    // Stage progress, derived with the same rules the app uses.
    const statuses = computeStageStatuses(stages, tasks, progress, h.programDay);
    for (const st of stages) {
      const status = statuses[st.id];
      const completedAt =
        status === "done"
          ? latest(progress.filter((p) => tasks.find((t) => t.id === p.taskId)?.stageId === st.id).map((p) => p.completedAt))
          : undefined;
      data.stageProgress.push({ hireId, stageId: st.id, status, ...(completedAt ? { completedAt } : {}) });
    }

    data.checkins.push(...h.checkIns.map((c) => ({ ...c, agenda: [] })));
    data.pulses.push(...h.pulses.map((p) => ({ ...p })));
    data.xpEvents.push(...h.xpEvents.map((e) => ({ ...e })));

    // Certification record mirrors the d30-certification task row.
    const cert = progress.find((t) => t.taskId === CERT_TASK_ID);
    const certData = (cert?.data ?? {}) as { aiScore?: number };
    let certificationPassed = false;
    if (cert?.status === "done") {
      certificationPassed = true;
      const weak = hireId === DEMO_IDS.nadia; // passed, but only just
      data.certifications.push({
        hireId,
        stageId: "days8-30",
        aiScore: certData.aiScore ?? cert.score,
        managerObservation: {
          scores: rubric.criteria.map((c, i) => ({ criterion: c.id, score: weak && i % 2 === 0 ? 3 : 4 })),
          notes: weak ? "Passed on the second attempt. Escalation still hesitant." : "Clear scoping, no over-promising.",
        },
        status: "passed",
        attempts: Math.max(1, cert.attempts),
        signedBy: DEMO_IDS.manager,
        signedAt: cert.completedAt,
        updatedAt: cert.completedAt ?? nowIso,
      });
    } else if (cert?.status === "in_progress") {
      data.certifications.push({
        hireId,
        stageId: "days8-30",
        aiScore: certData.aiScore,
        status: "pending",
        attempts: Math.max(1, cert.attempts),
        updatedAt: nowIso,
      });
    }

    data.scorecardItems.push(
      ...h.scorecard.map((s) => {
        const goal = scorecardGoals.find((g) => g.id === s.goalId)!;
        return {
          id: `${hireId}-sc-${s.goalId}`,
          hireId,
          horizon: goal.horizon,
          goal: goal.title,
          target: goal.target,
          status: SCORECARD_STATUS[s.status],
          updatedAt: nowIso,
        };
      }),
    );

    const confirmer = h.profile.buddyId ?? h.profile.managerId;
    data.quests.push(
      ...h.quests.map((q) => ({
        id: q.id,
        hireId,
        staffId: q.withStaffId,
        type: q.type,
        title: (QUEST_TITLE[q.type] ?? ((n: string) => `Meet ${n}`))(staffName(q.withStaffId)),
        ...(q.confirmedAt ? { confirmedBy: confirmer, confirmedAt: q.confirmedAt } : {}),
        createdAt: `${h.profile.startDate}T09:00:00Z`,
      })),
    );

    data.kudos.push(
      ...h.kudos.map((k) => ({
        id: k.id,
        fromId: accountForStaff.get(k.fromId) ?? k.fromId,
        fromName: k.fromName,
        kind: k.kind,
        toId: k.toHireId,
        message: k.message,
        at: k.at,
      })),
    );

    data.shadowLogs.push(
      ...h.shadowLogs.map((l) => ({
        id: l.id,
        hireId,
        interaction: l.interaction,
        withWhom: staffName(l.withStaffId),
        notes: l.whatIObserved,
        at: `${addDays(h.profile.startDate, Math.max(l.day, 1) - 1)}T14:00:00Z`,
      })),
    );

    // Trophies from the same rules the app uses.
    const done = progress.filter((p) => p.status === "done");
    const earnedIds = evaluateTrophies({
      completedTaskIds: done.map((p) => p.taskId),
      questsConfirmed: h.quests.filter((q) => q.confirmedAt).length,
      shadowLogs: h.shadowLogs.length,
      streak: 0,
      kudosGiven: 0,
      certificationPassed,
      day90SignedOff: false,
    });
    const earnedAt = latest(done.map((p) => p.completedAt)) ?? `${h.profile.startDate}T12:00:00Z`;
    data.trophies.push(...earnedIds.map((trophyId) => ({ hireId, trophyId, at: earnedAt })));

    // Every hire gets their own copy of the sample contracts for the Beryll Contracts sandbox.
    data.contracts.push(
      ...SAMPLE_CONTRACTS.map((c) => ({
        id: `${hireId}:${c.id}`,
        hireId,
        templateId: c.id,
        clientId: c.clientId,
        client: c.client,
        owner: c.owner,
        type: c.type,
        title: c.title,
        status: c.status,
        valueEur: c.valueEur,
        clauses: c.clauses.map((cl) => ({ id: cl.id, title: cl.title, body: cl.text, standard: cl.standard })),
        createdAt: `${c.updatedAt}T09:00:00Z`,
        updatedAt: `${c.updatedAt}T09:00:00Z`,
      })),
    );
  }

  // Alex (fresh demo hire): three open meet-the-team quests for the buddy to confirm.
  (
    [
      ["daniel-mensah", "Meet Daniel (Offensive Security)"],
      ["katarzyna-nowak", "Meet Katarzyna (Managed SOC)"],
      ["priya-nair", "Meet Priya (GRC)"],
    ] as const
  ).forEach(([staffId, title], i) =>
    data.quests.push({ id: `${DEMO_IDS.alex}-quest-meet-${i + 1}`, hireId: DEMO_IDS.alex, staffId, type: "coffee", title, createdAt: nowIso }),
  );

  return data;
}

// ---------------------------------------------------------------------------
// Supabase seeding (service-role client only; run from scripts/seed.ts, never a request)
// ---------------------------------------------------------------------------

/** Tables reset for the demo hires on every seed run (then re-upserted). */
const HIRE_TABLES = [
  "stage_progress", "task_progress", "quiz_attempts", "review_queue", "walkthrough_runs", "contracts",
  "roleplay_sessions", "certifications", "checkins", "pulses", "scorecard_items", "quests", "shadow_logs",
  "sop_suggestions", "program_reviews", "xp_events", "trophies_earned", "matcher_profiles", "manager_notes",
] as const;

async function must<R extends { data: unknown; error: unknown }>(
  p: PromiseLike<R>,
  what: string,
): Promise<R["data"]> {
  const { data, error } = await p;
  if (error) throw new Error(`seedSupabase: ${what}: ${(error as { message?: string }).message ?? String(error)}`);
  return data;
}

export interface SeedSummary {
  users: number;
  rows: Record<string, number>;
  warnings: string[];
}

/**
 * Idempotently seeds demo users (auth + profiles), staff and history.
 * `admin` must be created with SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
 * Auth users are created with the DEMO_IDS ids. Users, profiles and staff are
 * upserted; the demo hires' history is reset and re-upserted with stable ids,
 * so running it twice leaves the same state.
 */
export async function seedSupabase(admin: SupabaseClient, now: Date = new Date()): Promise<SeedSummary> {
  const password = seedPassword(); // throws before any write when misconfigured
  const seed = buildSeed(now);
  const warnings: string[] = [];
  const rows: Record<string, number> = {};

  // 1. Auth users (id = DEMO_IDS value where possible)
  const listed = await must(admin.auth.admin.listUsers({ perPage: 1000 }), "list users");
  const byEmail = new Map((listed?.users ?? []).map((u) => [u.email?.toLowerCase(), u.id]));
  const ids = new Map<string, string>();
  for (const p of seed.profiles) {
    const attrs = {
      email: p.email,
      password,
      email_confirm: true,
      user_metadata: { name: p.name, title: p.title },
      app_metadata: { role: p.role, is_demo: p.isDemo },
    };
    let id = byEmail.get(p.email.toLowerCase());
    if (id) {
      if (id !== p.id) warnings.push(`${p.email} already exists with id ${id} (expected ${p.id}); reusing it.`);
      await must(admin.auth.admin.updateUserById(id, attrs), `update user ${p.email}`);
    } else {
      const created = await must(admin.auth.admin.createUser({ ...attrs, id: p.id }), `create user ${p.email}`);
      id = created!.user!.id;
    }
    ids.set(p.id, id);
  }
  const map = (k?: string) => (k ? ids.get(k) ?? k : null);
  /** Profile id or null (for FK columns that may hold a non-profile id in memory mode). */
  const profileOrNull = (k?: string) => (k && ids.has(k) ? ids.get(k)! : null);

  const up = async (table: string, list: object[], onConflict?: string) => {
    rows[table] = list.length;
    if (list.length) await must(admin.from(table).upsert(list, onConflict ? { onConflict } : undefined), `upsert ${table}`);
  };

  // 2. Profiles (the auth trigger created rows; set relationships + dates)
  await up(
    "profiles",
    seed.profiles.map((p) => ({
      id: map(p.id), name: p.name, email: p.email, role: p.role, title: p.title,
      manager_id: profileOrNull(p.managerId), buddy_id: profileOrNull(p.buddyId),
      start_date: p.startDate, demo_day_offset: p.demoDayOffset, is_demo: p.isDemo,
    })),
  );

  // 2b. Server-side switch read by set_demo_day_offset() (Postgres can't see the app env).
  // Same rule as the app's isDemoMode(). Turning demo mode off later also needs this row set
  // to false in SQL (see supabase/README.md).
  await up("app_settings", [{ key: "demo_mode", value: isDemoMode() }], "key");

  // 3. Staff directory
  await up(
    "staff_directory",
    seed.staff.map((s) => ({
      id: s.id, name: s.name, title: s.title, team: s.team, bio: s.bio,
      interests: s.interests, availability_note: s.availabilityNote, avatar_seed: s.avatarSeed,
    })),
  );

  // 4. Reset demo-hire history, then upsert it with stable ids
  const hireIds = seed.profiles.filter((p) => p.role === "hire").map((p) => map(p.id)!);
  for (const t of HIRE_TABLES) await must(admin.from(t).delete().in("hire_id", hireIds), `reset ${t}`);
  await must(admin.from("kudos").delete().in("to_id", [...ids.values()]), "reset kudos");

  await up("stage_progress", seed.stageProgress.map((s) => ({ hire_id: map(s.hireId), stage_id: s.stageId, status: s.status, completed_at: s.completedAt ?? null })), "hire_id,stage_id");
  await up(
    "task_progress",
    seed.taskProgress.map((t) => ({
      hire_id: map(t.hireId), task_id: t.taskId, status: t.status, score: t.score ?? null, attempts: t.attempts,
      data: t.data ?? {}, completed_at: t.completedAt ?? null,
    })),
    "hire_id,task_id",
  );
  await up("xp_events", seed.xpEvents.map((e) => ({ hire_id: map(e.hireId), source: e.source, amount: e.amount, created_at: e.at })), "hire_id,source");
  await up("trophies_earned", seed.trophies.map((t) => ({ hire_id: map(t.hireId), trophy_id: t.trophyId, earned_at: t.at })), "hire_id,trophy_id");
  await up(
    "checkins",
    seed.checkins.map((c) => ({ id: stableUuid(c.id), hire_id: map(c.hireId), due_day: c.dueDay, label: c.label, held_at: c.heldAt ?? null, agenda: c.agenda ?? [] })),
    "hire_id,due_day",
  );
  await up(
    "pulses",
    seed.pulses.map((p) => ({ hire_id: map(p.hireId), day: p.day, clarity: p.clarity, confidence: p.confidence, belonging: p.belonging, comment: p.comment ?? null, submitted_at: p.submittedAt })),
    "hire_id,day",
  );
  await up(
    "certifications",
    seed.certifications.map((c) => ({
      hire_id: map(c.hireId), stage_id: c.stageId, ai_score: c.aiScore ?? null, manager_observation: splitObservation(c.managerObservation).shared ?? null,
      status: c.status, attempts: c.attempts, signed_by: profileOrNull(c.signedBy), signed_at: c.signedAt ?? null, updated_at: c.updatedAt,
    })),
    "hire_id,stage_id",
  );
  // Manager-only notes (check-in notes, certification observation notes) live apart from the
  // hire-readable rows (RLS on manager_notes: the hire's manager only).
  const managerNotes: { hire_id: string | null; subject: string; body: string }[] = [];
  for (const c of seed.checkins) if (c.notes) managerNotes.push({ hire_id: map(c.hireId), subject: noteSubject.checkin(c.dueDay), body: c.notes });
  for (const c of seed.certifications) {
    const { privateKeys } = splitObservation(c.managerObservation);
    for (const k of PRIVATE_OBSERVATION_KEYS) {
      const v = privateKeys[k];
      if (typeof v === "string" && v) managerNotes.push({ hire_id: map(c.hireId), subject: noteSubject.cert(c.stageId, k), body: v });
    }
  }
  await up("manager_notes", managerNotes, "hire_id,subject");
  await up(
    "scorecard_items",
    seed.scorecardItems.map((s) => ({ id: stableUuid(s.id), hire_id: map(s.hireId), horizon: s.horizon, goal: s.goal, target: s.target, status: s.status, note: s.note ?? null, updated_at: s.updatedAt })),
  );
  await up(
    "shadow_logs",
    seed.shadowLogs.map((l) => ({ id: stableUuid(l.id), hire_id: map(l.hireId), interaction: l.interaction, with_whom: l.withWhom, notes: l.notes, created_at: l.at })),
  );
  await up(
    "quests",
    seed.quests.map((q) => ({
      id: stableUuid(q.id), hire_id: map(q.hireId), staff_id: q.staffId ?? null, type: q.type, title: q.title,
      confirmed_by: profileOrNull(q.confirmedBy), confirmed_at: q.confirmedAt ?? null, created_at: q.createdAt,
    })),
  );
  await up(
    "contracts",
    seed.contracts.map((c) => ({
      id: stableUuid(c.id), hire_id: map(c.hireId), template_id: c.templateId ?? null, client_id: c.clientId ?? null, owner: c.owner ?? null,
      client: c.client, type: c.type, title: c.title, status: c.status, value_eur: c.valueEur ?? null, clauses: c.clauses,
      created_at: c.createdAt, updated_at: c.updatedAt,
    })),
  );
  await up(
    "kudos",
    seed.kudos.map((k) => {
      const fromProfile = profileOrNull(k.fromId);
      return {
        id: stableUuid(k.id), from_id: fromProfile, from_staff_id: fromProfile ? null : k.fromId, from_name: k.fromName ?? null,
        kind: k.kind ?? null, to_id: map(k.toId), message: k.message, created_at: k.at,
      };
    }),
  );

  return { users: ids.size, rows, warnings };
}
