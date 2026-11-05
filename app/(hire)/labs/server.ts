import "server-only";
import { LAB_IDS, phishingEmail, tasks, type PhishingEmail } from "@/content";
import { phishingKey } from "@/content/server";
import { aiModeNow, markAiFailure, type AiMode } from "@/lib/ai/client";
import { gradeLive, prepareGrade, type LabGrade } from "@/lib/ai/grade";
import { checkRateLimit, DAILY_LIMITS } from "@/lib/ai/guard";
import type { Repository } from "@/lib/data";
import type { TaskDef } from "@/lib/types";

export type LabId = (typeof LAB_IDS)[number];

export const isLabId = (id: string): id is LabId => (LAB_IDS as readonly string[]).includes(id);

/** The roadmap task a lab page completes. */
export function taskForLab(labId: string): TaskDef | undefined {
  return tasks.find((t) => t.href === `/labs/${labId}`);
}

export type ServerGrade = { ok: true; grade: LabGrade } | { ok: false; error: string; code?: "rate_limited" | "bad_request" | "not_found" | "server_error" };

/**
 * The same grading path as POST /api/ai/grade (validation, daily limit, live model with rule-based fallback),
 * run inside a server action so the score that gets saved is computed here, never sent by the browser.
 */
export async function gradeOnServer(repo: Repository, userId: string, labId: "redline-lab" | "translator-drills", itemId: string, answer: unknown): Promise<ServerGrade> {
  const prep = prepareGrade(labId, itemId, answer);
  if (!prep.ok) return { ok: false, error: prep.error, code: prep.status === 404 ? "not_found" : "bad_request" };
  const rate = await checkRateLimit(repo, userId, "grade");
  if (!rate.ok) return { ok: false, error: `You've used today's ${DAILY_LIMITS.grade} AI feedback checks. The limit resets at midnight.`, code: "rate_limited" };
  try {
    let mode: AiMode = aiModeNow();
    let grade: LabGrade | null = null;
    if (mode === "live") {
      try {
        grade = { ...prep.prepared.finalise(await gradeLive(prep.prepared.prompt())), mode };
      } catch (e) {
        markAiFailure(e, `grade ${labId}`);
        mode = "fallback";
      }
    }
    grade ??= { ...prep.prepared.finalise(prep.prepared.fallback()), mode: "fallback" };
    return { ok: true, grade };
  } catch (e) {
    console.error(`[labs] grade ${labId} failed`, e);
    return { ok: false, error: "We couldn't grade that just now. Please try again in a moment.", code: "server_error" };
  }
}

// ---------------------------------------------------------------- phishing simulation

/** Splits the email body the same way the client renders it (PhishingInbox). */
export const phishBodyParagraphs = (email: PhishingEmail) => email.body.split(/\n{2,}/);

/**
 * Which red flag each clickable part of the email reveals (null = a harmless part).
 * Kept on the server so the page doesn't tell the hire where the flags are.
 */
export function phishingHotspotFlags(email: PhishingEmail = phishingEmail): Record<string, string | null> {
  const known = new Set(phishingKey.redFlags.map((f) => f.id));
  const flag = (id: string) => (known.has(id) ? id : null);
  const map: Record<string, string | null> = {
    from: flag("f1"),
    replyTo: email.replyTo ? flag("f2") : null,
    to: null,
    sentAt: null,
    subject: flag("f3"),
    link: email.links.length ? flag("f6") : null,
    attachment: email.attachments.length ? flag("f7") : null,
  };
  phishBodyParagraphs(email).forEach((p, i) => {
    let f: string | null = null;
    if (/^\s*dear (user|customer|employee|sir|madam)/i.test(p)) f = "f4";
    else if (/^\s*\[.*\]\s*$/.test(p) || /click (the|this) (button|link)/i.test(p)) f = "f6";
    else if (/suspend|delet|expire|immediately|within \d+ hours?/i.test(p)) f = "f5";
    map[`body-${i}`] = f ? flag(f) : null;
  });
  return map;
}

/** Translator drills: the task is scored once this many drills have feedback (mean of the best per drill). */
export const TRANSLATOR_MIN_ITEMS = 3;
