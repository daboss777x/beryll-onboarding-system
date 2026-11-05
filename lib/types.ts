// Shared domain contract for Beryll Onboard. Owned by Davis (PM).
// Agents import from here; changes go through Davis so nobody drifts.

export type Role = "hire" | "manager" | "buddy";

export type StageId =
  | "preboarding"
  | "day1"
  | "weeks1-2"
  | "days8-30"
  | "days31-60"
  | "days61-90"
  | "months4-12";

export type RankId = "observer" | "copilot" | "solo" | "independent";

export type TaskKind =
  | "lesson" // reading / explainer animation
  | "quiz"
  | "walkthrough" // Beryll Contracts guided task
  | "lab" // redline, signature story, data drills, security setup
  | "roleplay" // AI client practice
  | "certification" // AI role-play + manager observation
  | "story" // best-self story, job preview
  | "checklist" // paperwork, security setup
  | "pulse"
  | "checkin"
  | "quest" // meet-the-team, confirmed by colleague/buddy
  | "matcher" // interest-matcher chat
  | "mission" // fix-one-SOP, cross-team project
  | "review"; // scorecard review, programme review

export interface TaskDef {
  id: string; // globally unique, kebab-case, e.g. "wt-create-sow"
  stageId: StageId;
  kind: TaskKind;
  title: string;
  summary: string; // one line shown in Today / Roadmap
  estMinutes: number;
  xp: number;
  required: boolean; // counts toward stage exit
  unlockDay?: number; // program day it becomes available (default: stage start)
  href: string; // route the task opens, e.g. "/learn/engagement-lifecycle"
  passScore?: number; // 0-100 when the task is scored
  researchRef?: string; // e.g. "4.3" section of onboarding-research.md
}

export interface StageDef {
  id: StageId;
  order: number;
  title: string;
  subtitle: string;
  startDay: number;
  endDay: number;
  playable: "full" | "light" | "cards";
  doneMeans: string; // plain-English exit criterion (role clarity)
  rankOnComplete?: RankId;
}

export type TaskStatus = "locked" | "available" | "in_progress" | "done" | "failed";

export interface TaskProgress {
  hireId: string;
  taskId: string;
  status: TaskStatus;
  score?: number;
  attempts: number;
  data?: Record<string, unknown>;
  completedAt?: string; // ISO
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  avatarUrl?: string;
  managerId?: string;
  buddyId?: string;
  startDate: string; // ISO date
  demoDayOffset: number;
  isDemo: boolean;
}

export interface Pulse {
  hireId: string;
  day: 7 | 30 | 90;
  clarity: number; // 1-5
  confidence: number;
  belonging: number;
  comment?: string;
  submittedAt: string;
}

export interface CheckIn {
  id: string;
  hireId: string;
  dueDay: number;
  label: string; // "Day 1", "Week 1", "Day 30"...
  heldAt?: string;
  notes?: string;
}

export interface XpEvent {
  hireId: string;
  source: string; // taskId or trophy id
  amount: number;
  at: string;
}

export interface TrophyDef {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  tier: "facet" | "gem" | "crown";
}

export type RiskReason =
  | "low_pulse"
  | "overdue_checkin"
  | "stalled_stage"
  | "failed_certification_twice"
  | "inactive";

export interface RiskFlag {
  hireId: string;
  reason: RiskReason;
  detail: string;
  suggestedAction: string;
}

export interface StaffMember {
  id: string;
  name: string;
  title: string;
  team: "Leadership" | "Commercial" | "Offensive Security" | "Defensive Security / SOC" | "GRC" | "Operations";
  bio: string;
  interests: string[];
  availabilityNote: string; // e.g. "Golfs most Saturdays at Portmarnock"
  avatarSeed: string;
}

export interface RubricScore {
  criterion: string;
  score: number; // 0-5
  evidence: string; // quote from transcript
}

export interface RoleplayResult {
  personaId: string;
  scores: RubricScore[];
  overall: number; // 0-100
  passed: boolean;
  summary: string;
  coaching: string[];
}

// ---------------------------------------------------------------- data-layer row types
// Promoted from lib/data/types.ts (Davis, 2026-11-04). lib/data/types.ts re-exports these.

export type StageStatus = "locked" | "active" | "done";

export interface StageProgress {
  hireId: string;
  stageId: StageId;
  status: StageStatus;
  completedAt?: string;
}

export interface QuizAttempt {
  id: string;
  hireId: string;
  quizId: string;
  answers: Record<string, unknown>;
  score: number; // 0-100
  missedItemIds: string[];
  at: string;
}

export interface ReviewItem {
  hireId: string;
  itemId: string;
  quizId: string;
  dueDay: number; // program day the item comes back
  step: number; // 0 = +3, 1 = +10, 2 = +30
  lastResult?: "correct" | "missed";
}

export type WalkthroughMode = "watch" | "guided" | "solo";

export interface WalkthroughRun {
  id: string;
  hireId: string;
  walkthroughId: string;
  mode: WalkthroughMode;
  errors: number;
  durationMs: number;
  passed: boolean;
  at: string;
}

export interface ContractClause {
  id: string;
  title: string;
  body: string;
  [key: string]: unknown;
}

/** Approval-board columns, in pipeline order (matches content/schema.ts CONTRACT_STATUSES). */
export const CONTRACT_STATUSES = ["draft", "legal_review", "engineer_signoff", "sent", "signed"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];
export const isContractStatus = (v: unknown): v is ContractStatus =>
  typeof v === "string" && (CONTRACT_STATUSES as readonly string[]).includes(v);

export interface Contract {
  id: string;
  hireId: string;
  templateId?: string;
  client: string;
  type: string; // "SOW" | "MSA" | "NDA" | "DPA" ...
  title: string;
  status: ContractStatus;
  valueEur?: number;
  clauses: ContractClause[];
  /** content/demo-contracts.ts client id, for seeded sample contracts. */
  clientId?: string;
  /** Display name of the Beryll owner on a seeded sample contract. */
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractTemplate {
  templateId?: string;
  client: string;
  type: string;
  title: string;
  status?: ContractStatus;
  valueEur?: number;
  clauses: ContractClause[];
}

export interface TranscriptTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface RoleplaySession {
  id: string;
  hireId: string;
  personaId: string;
  isCertification: boolean;
  transcript: TranscriptTurn[];
  rubricScores: RubricScore[];
  overall?: number;
  aiSummary?: string;
  passed: boolean;
  at: string;
  /**
   * "active" while the call is running (transcript kept server-side, see
   * /api/ai/roleplay), "ended" once graded. Missing means "ended" (rows saved
   * with saveRoleplaySession).
   */
  status?: RoleplaySessionStatus;
  endedAt?: string;
  /** The exact JSON the `end` call returned, replayed on a repeat `end`. */
  endResponse?: Record<string, unknown>;
}

export type RoleplaySessionStatus = "active" | "ended";

/** Grade written when a role-play session ends. */
export interface RoleplaySessionOutcome {
  rubricScores: RubricScore[];
  overall: number;
  aiSummary: string;
  passed: boolean;
  endResponse: Record<string, unknown>;
}

/** What a buddy may see of their hire's matcher profile (only what the hire made visible). */
export interface BuddyMatcherView {
  hireId: string;
  interests: string[];
  updatedAt: string;
}

export type CertificationStatus = "pending" | "passed" | "retest";

export interface Certification {
  hireId: string;
  stageId: StageId;
  aiScore?: number;
  roleplaySessionId?: string;
  managerObservation?: Record<string, unknown>;
  status: CertificationStatus;
  attempts: number;
  signedBy?: string;
  signedAt?: string;
  updatedAt: string;
}

/** CheckIn plus agenda (C4 lists `agenda`; lib/types.ts CheckIn does not). */
export interface CheckInRecord extends CheckIn {
  agenda?: string[];
}

export type ScorecardStatus = "not_started" | "on_track" | "at_risk" | "done";

export interface ScorecardItem {
  id: string;
  hireId: string;
  horizon: 30 | 60 | 90;
  goal: string;
  target: string;
  status: ScorecardStatus;
  note?: string;
  updatedAt: string;
}

export interface Quest {
  id: string;
  hireId: string;
  staffId?: string;
  type: string; // content/seed set: "buddy-intro" | "coffee" | "scoping-call" | "cross-team"
  title: string;
  confirmedBy?: string;
  confirmedAt?: string;
  createdAt: string;
}

export interface Kudos {
  id: string;
  /** Profile id of the sender, or a staff-directory id for seeded kudos from colleagues without an account. */
  fromId: string;
  fromName?: string;
  kind?: "peer" | "founder" | "manager";
  toId: string;
  message: string;
  at: string;
}

export interface ShadowLog {
  id: string;
  hireId: string;
  interaction: string;
  withWhom: string;
  notes: string;
  at: string;
}

export interface SopSuggestion {
  id: string;
  hireId: string;
  sopId: string;
  suggestion: string;
  status: "submitted" | "accepted" | "declined";
  at: string;
}

export interface ProgramReview {
  id: string;
  hireId: string;
  ratings: Record<string, number>;
  comment?: string;
  at: string;
}

export interface TrophyEarned {
  hireId: string;
  trophyId: string;
  at: string;
}

export interface MatcherSuggestion {
  staffId: string;
  reason: string;
  icebreaker: string;
}

export interface MatcherProfile {
  hireId: string;
  interests: string[];
  visibility: Record<string, boolean>;
  suggestions: MatcherSuggestion[];
  updatedAt: string;
}

/** Limited view of a buddy's hire (no scores, drafts or pulses). */
export interface BuddyHireSummary {
  hireId: string;
  name: string;
  title: string;
  avatarUrl?: string;
  startDate: string;
  demoDayOffset: number;
  tasksDone: number;
  questsOpen: number;
}

export type AiFeature = "roleplay" | "coach" | "grade" | "matcher" | (string & {});

export interface SessionUser {
  id: string;
  role: Role;
  email: string;
}
