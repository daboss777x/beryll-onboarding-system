import "server-only";
import { z } from "zod";
import { RUBRIC_CRITERIA } from "@/content/schema";
import type { RoleplayResult } from "../types";
import { INPUT_CAPS } from "./guard";

// ------------------------------------------------------------------ requests

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(INPUT_CAPS.message, `Messages can be up to ${INPUT_CAPS.message} characters`),
});
export type ChatMessageIn = z.infer<typeof chatMessageSchema>;

export const MAX_ROLEPLAY_USER_TURNS = 12;

/** Server-held role-play session id (uuid). */
export const roleplaySessionIdSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "We couldn't find that call. Start a new one.");

/**
 * The transcript lives on the server: `turn` sends one new hire message, `end` grades
 * what the server stored. There is no client-supplied history.
 */
export const roleplayRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("turn"),
    personaId: z.string().min(1).max(64),
    message: z
      .string()
      .max(INPUT_CAPS.message, `Messages can be up to ${INPUT_CAPS.message} characters`)
      .refine((m) => m.trim().length >= 1, "Write a message to the client first."),
    sessionId: roleplaySessionIdSchema.optional(),
    certification: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("end"),
    sessionId: roleplaySessionIdSchema,
  }),
]);
export type RoleplayRequest = z.infer<typeof roleplayRequestSchema>;

export const coachRequestSchema = z.object({
  question: z.string().trim().min(2, "Ask a question").max(INPUT_CAPS.question, `Questions can be up to ${INPUT_CAPS.question} characters`),
  history: z.array(chatMessageSchema).max(20).optional(),
});

export const LAB_IDS_GRADED = ["redline-lab", "translator-drills", "sow-check"] as const;

export const redlineAnswerSchema = z.object({
  flags: z
    .array(
      z.object({
        clauseId: z.string().min(1).max(32),
        category: z.string().max(40).optional(),
        note: z.string().max(INPUT_CAPS.note).optional(),
      }),
    )
    .max(20),
});
export const textAnswerSchema = z.string().trim().min(1, "Write an answer first").max(INPUT_CAPS.answer);
export const sowAnswerSchema = z.union([
  textAnswerSchema,
  z.object({ clauses: z.array(z.object({ title: z.string().max(200), body: z.string().max(INPUT_CAPS.answer) })).min(1).max(40) }),
]);

export const gradeRequestSchema = z.object({
  labId: z.enum(LAB_IDS_GRADED),
  itemId: z.string().min(1).max(64),
  answer: z.unknown(),
});

export const matcherRequestSchema = z.object({
  messages: z.array(chatMessageSchema).max(INPUT_CAPS.messages),
  action: z.enum(["turn", "finish"]),
});

// ------------------------------------------------------------------ model outputs

export const rubricCriterionSchema = z.enum(RUBRIC_CRITERIA);

/** What the role-play grader model returns. `overall` is computed server-side from weights. */
export const roleplayGraderSchema = z.object({
  scores: z
    .array(
      z.object({
        criterion: rubricCriterionSchema,
        score: z.number().int().min(1).max(5),
        evidence: z.string().max(400),
      }),
    )
    .min(1)
    .max(6),
  summary: z.string().min(1).max(700),
  coaching: z.array(z.string().max(300)).max(5),
});
export type RoleplayGraderOutput = z.infer<typeof roleplayGraderSchema>;

/** Shape check for our own RoleplayResult (used in tests and before saving). */
export const roleplayResultSchema = z.object({
  personaId: z.string(),
  scores: z.array(z.object({ criterion: z.string(), score: z.number().min(0).max(5), evidence: z.string() })),
  overall: z.number().min(0).max(100),
  passed: z.boolean(),
  summary: z.string(),
  coaching: z.array(z.string()),
}) satisfies z.ZodType<RoleplayResult>;

export const labGradeSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string().max(300)).max(5),
  gaps: z.array(z.string().max(300)).max(6),
  modelAnswerExcerpt: z.string().max(600),
});
export type LabGradeCore = z.infer<typeof labGradeSchema>;

export const matcherExtractSchema = z.object({
  interests: z.array(z.string().max(40)).max(12),
  preferences: z.object({
    workingStyle: z.string().max(200),
    socialStyle: z.string().max(200),
    availability: z.string().max(200),
  }),
  funFacts: z.array(z.string().max(200)).max(5),
});
export type MatcherExtract = z.infer<typeof matcherExtractSchema>;

export const matcherPolishSchema = z.object({
  suggestions: z
    .array(z.object({ staffId: z.string(), reason: z.string().max(240), icebreaker: z.string().max(240) }))
    .max(3),
});
