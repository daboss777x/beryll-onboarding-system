import "server-only";
import type { Profile, Pulse, StaffMember, TaskProgress, XpEvent } from "../types";
import type {
  AiFeature,
  BuddyHireSummary,
  BuddyMatcherView,
  Certification,
  CheckInRecord,
  Contract,
  ContractClause,
  ContractStatus,
  ContractTemplate,
  Kudos,
  MatcherProfile,
  ProgramReview,
  Quest,
  QuizAttempt,
  ReviewItem,
  RoleplaySession,
  RoleplaySessionOutcome,
  ScorecardItem,
  ShadowLog,
  SopSuggestion,
  StageProgress,
  TranscriptTurn,
  TrophyEarned,
  WalkthroughRun,
} from "./types";

export type { SessionUser } from "./types";

/**
 * The only way screens and API routes touch persisted state.
 * Two implementations: in-memory (no env) and Supabase (env set).
 *
 * Authorisation: the Supabase implementation is additionally guarded by RLS.
 * The memory implementation trusts its caller, so always gate with
 * requireUser()/requireApiUser() from lib/data/auth.ts first.
 */
export interface Repository {
  readonly mode: "memory" | "supabase";

  // Session + people
  getSessionProfile(): Promise<Profile | null>;
  getProfile(id: string): Promise<Profile | null>;
  listHiresForManager(managerId: string): Promise<Profile[]>;
  getBuddyHire(buddyId: string): Promise<BuddyHireSummary | null>;
  setDemoDayOffset(hireId: string, offset: number): Promise<void>;
  /**
   * DEMO ONLY: put a demo hire back to the seeded state: day offset, stage and task progress,
   * quiz attempts, review queue, walkthrough runs, XP and trophies. Throws for a profile that
   * is not a demo hire. Supabase: only the hire themself may call it.
   */
  resetDemoHire(hireId: string): Promise<void>;
  listStaff(): Promise<StaffMember[]>;

  // Journey
  listStageProgress(hireId: string): Promise<StageProgress[]>;
  upsertStageProgress(p: StageProgress): Promise<StageProgress>;
  getTaskProgress(hireId: string): Promise<TaskProgress[]>;
  upsertTaskProgress(p: TaskProgress): Promise<TaskProgress>;
  /** Manager QA sampling score on a hire's task (0-100). */
  setTaskQa(hireId: string, taskId: string, score: number, notes?: string): Promise<void>;

  // Quizzes + spaced repetition
  addQuizAttempt(a: Omit<QuizAttempt, "id" | "at">): Promise<QuizAttempt>;
  listQuizAttempts(hireId: string, quizId?: string): Promise<QuizAttempt[]>;
  /** Items due on or before `dueByDay` (all items when omitted), sorted by dueDay. */
  listReviewQueue(hireId: string, dueByDay?: number): Promise<ReviewItem[]>;
  upsertReviewItem(item: ReviewItem): Promise<ReviewItem>;
  removeReviewItem(hireId: string, itemId: string): Promise<void>;

  // Walkthroughs
  saveWalkthroughRun(r: Omit<WalkthroughRun, "id" | "at">): Promise<WalkthroughRun>;
  listWalkthroughRuns(hireId: string, walkthroughId?: string): Promise<WalkthroughRun[]>;

  // Contracts sandbox (per hire)
  listContracts(hireId: string): Promise<Contract[]>;
  getContract(hireId: string, id: string): Promise<Contract | null>;
  createContract(hireId: string, template: ContractTemplate): Promise<Contract>;
  updateContractClauses(hireId: string, id: string, clauses: ContractClause[]): Promise<Contract>;
  moveContractStatus(hireId: string, id: string, status: ContractStatus): Promise<Contract>;
  deleteContract(hireId: string, id: string): Promise<void>;

  // Role-play + certification
  saveRoleplaySession(s: Omit<RoleplaySession, "id" | "at">): Promise<RoleplaySession>;
  /** Ended (graded) sessions only, newest first. Active calls are not listed. */
  listRoleplaySessions(hireId: string): Promise<RoleplaySession[]>;
  /** Starts a server-held role-play call (status "active", empty transcript). */
  createRoleplaySession(s: { hireId: string; personaId: string; isCertification: boolean }): Promise<RoleplaySession>;
  /** One session (active or ended) owned by this hire, or null. */
  getRoleplaySession(hireId: string, id: string): Promise<RoleplaySession | null>;
  /**
   * Atomically appends turns to an ACTIVE session owned by the hire. With
   * `maxUserTurns`, refuses when the stored transcript already has that many
   * user turns. Returns null when refused (missing, ended, or at the limit).
   */
  appendRoleplayTurns(hireId: string, id: string, turns: TranscriptTurn[], opts?: { maxUserTurns?: number }): Promise<RoleplaySession | null>;
  /** Atomically marks an ACTIVE session ended with its grade. Returns null if it was not active (already ended). */
  endRoleplaySession(hireId: string, id: string, outcome: RoleplaySessionOutcome): Promise<RoleplaySession | null>;
  getCertification(hireId: string, stageId?: Certification["stageId"]): Promise<Certification | null>;
  saveCertification(c: Omit<Certification, "updatedAt">): Promise<Certification>;

  // Manager rhythm + feedback
  listCheckins(hireId: string): Promise<CheckInRecord[]>;
  /** Upsert by id, or by (hireId, dueDay) when id is missing. */
  upsertCheckin(c: Omit<CheckInRecord, "id"> & { id?: string }): Promise<CheckInRecord>;
  listPulses(hireId: string): Promise<Pulse[]>;
  /** One pulse per (hire, day); a second submit for the same day throws. */
  submitPulse(p: Pulse): Promise<Pulse>;
  listScorecardItems(hireId: string): Promise<ScorecardItem[]>;
  upsertScorecardItem(i: Omit<ScorecardItem, "id" | "updatedAt"> & { id?: string }): Promise<ScorecardItem>;
  addSopSuggestion(s: Omit<SopSuggestion, "id" | "at" | "status">): Promise<SopSuggestion>;
  listSopSuggestions(hireId: string): Promise<SopSuggestion[]>;
  addProgramReview(r: Omit<ProgramReview, "id" | "at">): Promise<ProgramReview>;
  listProgramReviews(hireId: string): Promise<ProgramReview[]>;

  // People + social
  listQuests(hireId: string): Promise<Quest[]>;
  createQuest(q: Omit<Quest, "id" | "createdAt" | "confirmedBy" | "confirmedAt">): Promise<Quest>;
  /** Buddy (or manager) confirms; idempotent. */
  confirmQuest(questId: string, confirmerId: string): Promise<Quest>;
  /** Kudos sent or received by the profile, newest first. */
  listKudos(profileId: string): Promise<Kudos[]>;
  addKudos(fromId: string, toId: string, message: string): Promise<Kudos>;
  listShadowLogs(hireId: string): Promise<ShadowLog[]>;
  addShadowLog(l: Omit<ShadowLog, "id" | "at">): Promise<ShadowLog>;
  getMatcherProfile(hireId: string): Promise<MatcherProfile | null>;
  saveMatcherProfile(m: Omit<MatcherProfile, "updatedAt">): Promise<MatcherProfile>;
  /** Buddy view of their hire's matcher profile: only the interests the hire made visible. Null if none. */
  getBuddyMatcherView(buddyId: string): Promise<BuddyMatcherView | null>;

  // Gamification
  /** Returns false if an event with the same (hireId, source) already exists. */
  addXpEvent(e: Omit<XpEvent, "at"> & { at?: string }): Promise<boolean>;
  listXpEvents(hireId: string): Promise<XpEvent[]>;
  listTrophies(hireId: string): Promise<TrophyEarned[]>;
  /** Returns false if already earned. */
  awardTrophy(hireId: string, trophyId: string): Promise<boolean>;

  // AI guardrails
  /** Increments today's counter for (user, feature) and returns the new count. */
  incrementAiUsage(userId: string, feature: AiFeature): Promise<number>;
}
