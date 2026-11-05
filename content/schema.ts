// Zod schemas for every piece of Beryll Onboard content. Pure data shapes: no secrets live here,
// so this file is safe to import from client code. Answer keys themselves live in content/server/.
import { z } from "zod";
import type { StaffMember, StageDef, TaskDef } from "../lib/types";

// ---------------------------------------------------------------- shared ids
export const STAGE_IDS = ["preboarding", "day1", "weeks1-2", "days8-30", "days31-60", "days61-90", "months4-12"] as const;
export const stageIdSchema = z.enum(STAGE_IDS);

/** Animated explainer ids (Priya builds the components; lessons reference them by id). */
export const EXPLAINER_IDS = ["engagement-lifecycle", "service-types", "incident-response", "data-classification"] as const;
export const WALKTHROUGH_IDS = ["wt-create-sow", "wt-approval-pipeline", "wt-review-contract"] as const;
export const LAB_IDS = ["redline-lab", "signature-story", "data-handling-drills", "translator-drills", "phishing-sim"] as const;
export const CHECKLIST_IDS = ["paperwork", "security-setup", "shadow-log"] as const;
export const PERSONA_IDS = ["bank-ciso", "procurement-officer", "sme-owner-breach", "ngo-tight-budget", "cert-healthtech"] as const;

const kebab = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case id");

// ---------------------------------------------------------------- stages + tasks
export const stageDefSchema = z.object({
  id: stageIdSchema,
  order: z.number().int().min(0),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  startDay: z.number().int().min(0),
  endDay: z.number().int().min(0),
  playable: z.enum(["full", "light", "cards"]),
  doneMeans: z.string().min(10),
  rankOnComplete: z.enum(["observer", "copilot", "solo", "independent"]).optional(),
}) satisfies z.ZodType<StageDef>;

export const taskKindSchema = z.enum([
  "lesson", "quiz", "walkthrough", "lab", "roleplay", "certification", "story", "checklist",
  "pulse", "checkin", "quest", "matcher", "mission", "review",
]);

/** Every legal task href. Keep in sync with the route list in the brief. */
export const HREF_PATTERNS: RegExp[] = [
  /^\/learn\/[a-z0-9-]+$/,
  /^\/quiz\/[a-z0-9-]+$/,
  /^\/contracts\?walkthrough=wt-[a-z-]+&mode=(watch|guided|solo)$/,
  /^\/labs\/[a-z0-9-]+$/,
  /^\/practice\/roleplay\?persona=[a-z0-9-]+$/,
  /^\/certification$/,
  /^\/people$/,
  /^\/people\/matcher$/,
  /^\/me\/story$/,
  /^\/checklist\/[a-z0-9-]+$/,
  /^\/pulse\/(7|30|90)$/,
  /^\/missions\/[a-z0-9-]+$/,
  /^\/review\/[a-z0-9-]+$/,
];
export const hrefSchema = z.string().refine((h) => HREF_PATTERNS.some((p) => p.test(h)), "href does not match a known route pattern");

export const taskDefSchema = z.object({
  id: kebab,
  stageId: stageIdSchema,
  kind: taskKindSchema,
  title: z.string().min(3),
  summary: z.string().min(5),
  estMinutes: z.number().int().min(1).max(120),
  xp: z.number().int().min(0).max(500),
  required: z.boolean(),
  unlockDay: z.number().int().min(0).optional(),
  href: hrefSchema,
  passScore: z.number().min(0).max(100).optional(),
  researchRef: z.string().regex(/^(\d+(\.\d+)?)$/).optional(),
}) satisfies z.ZodType<TaskDef>;

// ---------------------------------------------------------------- lessons + stories
export const calloutSchema = z.object({
  tone: z.enum(["tip", "rule", "warning", "example"]),
  text: z.string().min(3),
});
export const lessonSectionSchema = z.object({
  heading: z.string().min(2),
  body: z.string().min(20), // markdown
  callout: calloutSchema.optional(),
  explainer: z.enum(EXPLAINER_IDS).optional(),
});
export const lessonSchema = z.object({
  id: kebab,
  title: z.string().min(3),
  summary: z.string().min(10),
  estMinutes: z.number().int().min(1).max(60),
  sections: z.array(lessonSectionSchema).min(1),
});

export const storyChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(3),
  nextId: z.string().min(1),
  consequence: z.string().min(5), // shown right after the choice is made
  quality: z.enum(["good", "ok", "poor"]).optional(),
});
export const storyNodeSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  body: z.string().min(10), // markdown
  choices: z.array(storyChoiceSchema),
  ending: z
    .object({ kind: z.enum(["good", "mixed", "bad"]), summary: z.string().min(5), lesson: z.string().min(5) })
    .optional(),
});
export const storySchema = z.object({
  id: kebab,
  title: z.string().min(3),
  intro: z.string().min(10),
  startNodeId: z.string(),
  nodes: z.array(storyNodeSchema).min(2),
});

// ---------------------------------------------------------------- quizzes (public + server key)
export const quizOptionSchema = z.object({ id: z.string().min(1), text: z.string().min(1) });
export const quizQuestionSchema = z.object({
  id: kebab,
  type: z.enum(["single", "multi", "ordering"]),
  scenario: z.string().optional(),
  prompt: z.string().min(5),
  options: z.array(quizOptionSchema).min(2),
});
export const quizSchema = z.object({
  id: kebab,
  stageId: stageIdSchema,
  title: z.string().min(3),
  intro: z.string().min(5),
  passScore: z.number().min(0).max(100),
  questions: z.array(quizQuestionSchema).min(8).max(12),
});
export const quizKeyItemSchema = z.object({
  questionId: kebab,
  correct: z.array(z.string()).min(1), // option ids; for "ordering" this is the correct sequence
  explanation: z.string().min(10),
  reviewModuleId: z.string().optional(), // lesson to re-read when missed (feeds spaced repetition)
});
export const quizKeySchema = z.object({ quizId: kebab, items: z.array(quizKeyItemSchema).min(1) });

// ---------------------------------------------------------------- SOPs
export const sopSchema = z.object({
  id: kebab,
  title: z.string().min(3),
  owner: z.string(), // staff id
  reviewDate: z.iso.date(),
  summary: z.string().min(10),
  tags: z.array(z.string()).min(1),
  body: z.string().min(80), // markdown
});

// ---------------------------------------------------------------- personas
export const personaCardSchema = z.object({
  id: z.enum(PERSONA_IDS),
  kind: z.enum(["practice", "certification"]),
  name: z.string(),
  role: z.string(),
  company: z.string(),
  channel: z.string(), // "WhatsApp" | "Email" | "Phone transcript"
  difficulty: z.enum(["gentle", "firm", "tough"]),
  situation: z.string().min(20),
  goalForHire: z.string().min(10),
  openingMessage: z.string().min(10),
  avatarSeed: z.string(),
});
export const personaSecretSchema = z.object({
  personaId: z.enum(PERSONA_IDS),
  voice: z.string().min(10), // how the AI should speak
  hiddenGoals: z.array(z.string()).min(2),
  objections: z.array(z.string()).min(2),
  facts: z.array(z.string()).min(3), // things the persona knows and reveals only when asked well
  trapsForTheHire: z.array(z.string()).min(1), // tempting wrong moves (over-promising etc.)
  escalationTriggers: z.array(z.string()).min(1), // moments a good BDM must escalate
  endConditions: z.string().min(10),
});
export const RUBRIC_CRITERIA = ["accuracy", "tone", "escalation", "data_handling", "no_over_promising", "next_step"] as const;
export const rubricSchema = z.object({
  passThreshold: z.number().min(0).max(100), // overall 0-100
  criteria: z
    .array(
      z.object({
        id: z.enum(RUBRIC_CRITERIA),
        label: z.string(),
        weight: z.number().positive(),
        question: z.string(),
        descriptors: z.object({ "1": z.string(), "2": z.string(), "3": z.string(), "4": z.string(), "5": z.string() }),
      }),
    )
    .length(6),
});

// ---------------------------------------------------------------- labs
export const redlineClauseSchema = z.object({ id: z.string(), heading: z.string(), text: z.string().min(30) });
export const redlineContractSchema = z.object({
  id: kebab,
  docType: z.enum(["MSA", "SOW", "DPA"]),
  title: z.string(),
  client: z.string(),
  brief: z.string().min(20), // context shown above the document
  clauses: z.array(redlineClauseSchema).min(6),
});
export const REDLINE_CATEGORIES = [
  "liability", "authorisation", "data_transfer", "payment", "scope_change", "auto_renewal", "indemnity", "confidentiality", "subprocessors", "ip", "termination",
] as const;
export const redlineKeySchema = z.object({
  contractId: kebab,
  risks: z
    .array(
      z.object({
        id: z.string(),
        clauseId: z.string(),
        category: z.enum(REDLINE_CATEGORIES),
        severity: z.enum(["high", "medium", "low"]),
        whatIsWrong: z.string().min(20),
        suggestedFix: z.string().min(20),
        escalateToLegal: z.boolean(),
      }),
    )
    .min(4)
    .max(6),
  safeClauseIds: z.array(z.string()), // clauses that look scary but are fine (decoys)
});

export const drillPublicSchema = z.object({
  id: kebab,
  scenario: z.string().min(20),
  options: z.array(quizOptionSchema).min(2).max(4),
});
export const drillKeySchema = z.object({
  drillId: kebab,
  correctOptionId: z.string(),
  explanation: z.string().min(20),
  sopId: z.string(),
});

export const checklistSchema = z.object({
  id: z.enum(CHECKLIST_IDS),
  title: z.string(),
  intro: z.string(),
  items: z.array(z.object({ id: kebab, title: z.string(), detail: z.string(), why: z.string().optional() })).min(3),
});

export const phishingEmailSchema = z.object({
  id: kebab,
  fromName: z.string(),
  fromAddress: z.string(),
  replyTo: z.string().optional(),
  to: z.string(),
  subject: z.string(),
  sentAt: z.string(),
  body: z.string().min(40),
  links: z.array(z.object({ text: z.string(), url: z.string() })),
  attachments: z.array(z.string()),
});
export const phishingKeySchema = z.object({
  emailId: kebab,
  redFlags: z.array(z.object({ id: z.string(), where: z.enum(["sender", "subject", "body", "link", "attachment"]), description: z.string().min(10) })).min(4),
  correctAction: z.string().min(10),
});

export const translatorFindingSchema = z.object({
  id: kebab,
  title: z.string(),
  engineerText: z.string().min(20),
  cvss: z.number().min(0).max(10),
  cvssVector: z.string().optional(),
  audience: z.string(), // who the hire is writing for
  context: z.string(),
});
export const translatorAskSchema = z.object({
  id: kebab,
  clientName: z.string(),
  clientQuote: z.string().min(10),
  context: z.string(),
});
export const translatorPublicSchema = z.object({
  id: z.literal("translator-drills"),
  findings: z.array(translatorFindingSchema).length(5),
  asks: z.array(translatorAskSchema).length(3),
});
export const translatorRubricSchema = z.object({
  findings: z.array(
    z.object({
      findingId: kebab,
      mustInclude: z.array(z.string()).min(3), // ideas a good rewrite carries
      mustAvoid: z.array(z.string()).min(1),
      modelAnswer: z.string().min(40),
    }),
  ).length(5),
  asks: z.array(
    z.object({
      askId: kebab,
      goodScopeElements: z.array(z.string()).min(4),
      clarifyingQuestions: z.array(z.string()).min(3),
      redFlags: z.array(z.string()).min(1),
      modelScope: z.string().min(40),
    }),
  ).length(3),
  scoring: z.string(),
});

// ---------------------------------------------------------------- people + demo data
export const staffSchema = z.object({
  id: kebab,
  name: z.string(),
  title: z.string(),
  team: z.enum(["Leadership", "Commercial", "Offensive Security", "Defensive Security / SOC", "GRC", "Operations"]),
  bio: z.string().min(40),
  interests: z.array(z.string()).min(3),
  availabilityNote: z.string().min(10),
  avatarSeed: z.string(),
}) satisfies z.ZodType<StaffMember>;

export const INTERESTS = ["golf", "running", "chess", "cooking", "football", "rugby", "photography", "gaming", "hiking", "music", "books", "coffee"] as const;

export const clauseSchema = z.object({ id: z.string(), title: z.string(), text: z.string().min(20), standard: z.boolean() });
export const CONTRACT_TYPES = ["NDA", "MSA", "SOW", "DPA", "Authorisation"] as const;
export const CONTRACT_STATUSES = ["draft", "legal_review", "engineer_signoff", "sent", "signed"] as const;
export const clientSchema = z.object({
  id: kebab,
  name: z.string(),
  sector: z.string(),
  country: z.string(),
  size: z.string(),
  contactName: z.string(),
  contactRole: z.string(),
  notes: z.string(),
});
export const contractSchema = z.object({
  id: kebab,
  clientId: kebab,
  client: z.string(),
  type: z.enum(CONTRACT_TYPES),
  title: z.string(),
  valueEur: z.number().int().min(0),
  status: z.enum(CONTRACT_STATUSES),
  ownerId: z.string(), // staff id
  owner: z.string(), // staff display name
  updatedAt: z.iso.date(),
  clauses: z.array(clauseSchema).min(2),
});
export const sowTemplateSchema = z.object({
  id: kebab,
  name: z.string(),
  guidance: z.string(),
  clauses: z.array(clauseSchema.extend({ optional: z.boolean(), guidance: z.string() })).min(10),
});

export const demoAccountSchema = z.object({
  email: z.string().email(),
  profile: z.object({
    id: z.string(), name: z.string(), email: z.string().email(), role: z.enum(["hire", "manager", "buddy"]), title: z.string(),
    avatarUrl: z.string().optional(), managerId: z.string().optional(), buddyId: z.string().optional(),
    startDate: z.iso.date(), demoDayOffset: z.number().int(), isDemo: z.boolean(),
  }),
  staffId: z.string().optional(), // link to the staff directory, for manager/buddy
});
export const taskProgressSchema = z.object({
  hireId: z.string(), taskId: z.string(), status: z.enum(["locked", "available", "in_progress", "done", "failed"]),
  score: z.number().optional(), attempts: z.number().int().min(0), data: z.record(z.string(), z.unknown()).optional(), completedAt: z.string().optional(),
});
export const pulseSchema = z.object({
  hireId: z.string(), day: z.union([z.literal(7), z.literal(30), z.literal(90)]),
  clarity: z.number().int().min(1).max(5), confidence: z.number().int().min(1).max(5), belonging: z.number().int().min(1).max(5),
  comment: z.string().optional(), submittedAt: z.string(),
});
export const checkInSchema = z.object({
  id: z.string(), hireId: z.string(), dueDay: z.number().int(), label: z.string(), heldAt: z.string().optional(), notes: z.string().optional(),
});
export const xpEventSchema = z.object({ hireId: z.string(), source: z.string(), amount: z.number().int(), at: z.string() });

// Types below are not in lib/types.ts yet (proposed for Davis).
export const kudosSchema = z.object({
  id: z.string(), toHireId: z.string(), fromId: z.string(), fromName: z.string(), kind: z.enum(["peer", "founder", "manager"]), message: z.string().min(5), at: z.string(),
});
export const shadowLogSchema = z.object({
  id: z.string(), hireId: z.string(), day: z.number().int(), interaction: z.string(), withStaffId: z.string(), whatIObserved: z.string(), debriefedWithBuddy: z.boolean(),
});
export const questSchema = z.object({
  id: z.string(), hireId: z.string(), type: z.enum(["buddy-intro", "coffee", "scoping-call", "cross-team"]), withStaffId: z.string(), confirmedAt: z.string().optional(),
});

export const scorecardGoalSchema = z.object({
  id: kebab, horizon: z.union([z.literal(30), z.literal(60), z.literal(90)]), title: z.string(), measure: z.string(), target: z.string(), evidence: z.string(),
});
export const glossaryTermSchema = z.object({
  id: kebab, term: z.string(), aliases: z.array(z.string()), category: z.enum(["Security", "Testing", "Legal", "Commercial", "Compliance"]), definition: z.string().min(30),
});

export type Lesson = z.infer<typeof lessonSchema>;
export type Story = z.infer<typeof storySchema>;
export type Quiz = z.infer<typeof quizSchema>;
export type QuizKey = z.infer<typeof quizKeySchema>;
export type Sop = z.infer<typeof sopSchema>;
export type PersonaCard = z.infer<typeof personaCardSchema>;
export type PersonaSecret = z.infer<typeof personaSecretSchema>;
export type Rubric = z.infer<typeof rubricSchema>;
export type RedlineContract = z.infer<typeof redlineContractSchema>;
export type RedlineKey = z.infer<typeof redlineKeySchema>;
export type DrillPublic = z.infer<typeof drillPublicSchema>;
export type DrillKey = z.infer<typeof drillKeySchema>;
export type Checklist = z.infer<typeof checklistSchema>;
export type PhishingEmail = z.infer<typeof phishingEmailSchema>;
export type PhishingKey = z.infer<typeof phishingKeySchema>;
export type TranslatorPublic = z.infer<typeof translatorPublicSchema>;
export type TranslatorRubric = z.infer<typeof translatorRubricSchema>;
export type Client = z.infer<typeof clientSchema>;
export type Contract = z.infer<typeof contractSchema>;
export type Clause = z.infer<typeof clauseSchema>;
export type SowTemplate = z.infer<typeof sowTemplateSchema>;
export type DemoAccount = z.infer<typeof demoAccountSchema>;
export type Kudos = z.infer<typeof kudosSchema>;
export type ShadowLog = z.infer<typeof shadowLogSchema>;
export type Quest = z.infer<typeof questSchema>;
export type ScorecardGoal = z.infer<typeof scorecardGoalSchema>;
export type GlossaryTerm = z.infer<typeof glossaryTermSchema>;
