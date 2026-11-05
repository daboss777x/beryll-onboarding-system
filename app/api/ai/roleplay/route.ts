import { loadHireState } from "@/components/app/hire-state";
import { tasks } from "@/content";
import { getRepo } from "@/lib/data";
import type { Repository, RoleplaySession } from "@/lib/data";
import type { Profile } from "@/lib/types";
import { AI_PASS_SCORE, certificationDecision, type ManagerObservation } from "@/lib/logic/scoring";
import { aiModeNow, isLive, markAiFailure, streamText, type AiMode } from "@/lib/ai/client";
import { CERT_PERSONA_ID, getPersona, getRubric } from "@/lib/ai/content";
import { checkRateLimit, jsonError, looksLikeExtractionAttempt, rateLimitResponse, sanitizeText } from "@/lib/ai/guard";
import {
  analyseTranscript,
  buildPersonaSystemPrompt,
  countUserTurns,
  fallbackPersonaReply,
  gradeTranscriptFallback,
  gradeTranscriptLive,
  isNotAssessed,
  notAssessedResult,
  offScriptLine,
  toPersonaMessages,
} from "@/lib/ai/roleplay";
import { apiUser, parseBody, serverError } from "@/lib/ai/route";
import { MAX_ROLEPLAY_USER_TURNS, roleplayRequestSchema, type ChatMessageIn } from "@/lib/ai/schemas";
import { primeLiveStream, textChunks, textStreamResponse } from "@/lib/ai/stream";
import type { RoleplayResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CERT_STAGE = "days8-30" as const;
/** Certification `end` calls per hire per day (Leah: stops brute-forcing the AI grade). */
const CERT_DAILY_LIMIT = 3;
const CERT_USAGE_FEATURE = "cert_end";

function observationFrom(raw: Record<string, unknown> | undefined): ManagerObservation | undefined {
  const scores = raw?.scores;
  if (!Array.isArray(scores)) return undefined;
  const ok = scores.filter((s): s is { criterion: string; score: number } => !!s && typeof s.criterion === "string" && typeof s.score === "number");
  return ok.length ? { scores: ok } : undefined;
}

/** The stored transcript as chat messages (system lines, if any, are dropped). */
function chatFrom(session: RoleplaySession): ChatMessageIn[] {
  return session.transcript
    .filter((t): t is ChatMessageIn => (t.role === "user" || t.role === "assistant") && !!t.content.trim())
    .map((t) => ({ role: t.role, content: t.content }));
}

const CERT_TASK_ID = tasks.find((t) => t.kind === "certification")?.id;

/**
 * Same unlock rule as the roadmap and /certification (lib/logic/unlocks.ts via loadHireState):
 * the certification call is only open once its task is not "locked". A passed hire stays allowed.
 */
async function certificationOpen(repo: Repository, profile: Profile): Promise<boolean> {
  if (!CERT_TASK_ID) return false;
  const state = await loadHireState(repo, profile);
  return state.taskStatuses[CERT_TASK_ID] !== "locked";
}
const certLocked = () =>
  jsonError(403, "Certification isn't open for you yet. Finish the earlier steps on your roadmap, then start the call from the certification screen.", { code: "cert_locked" });

const notFound = () => jsonError(404, "We couldn't find that call. Start a new one.");
const sessionEnded = () => jsonError(409, "This call has already ended. Start a new one to practise again.", { code: "session_ended" });
const json = (body: unknown) => Response.json(body, { headers: { "Cache-Control": "no-store" } });

/** Replays the stored `end` response (a repeat `end` never re-grades). */
function storedEnd(session: RoleplaySession): Response {
  return session.endResponse ? json({ ...session.endResponse, sessionId: session.id }) : sessionEnded();
}

/** Atomic per-day counter for certification ends. Fails closed: this cap is a security control. */
async function certAllowed(repo: Repository, userId: string): Promise<boolean | "unavailable"> {
  try {
    return (await repo.incrementAiUsage(userId, CERT_USAGE_FEATURE)) <= CERT_DAILY_LIMIT;
  } catch (e) {
    console.error(`[ai] certification counter failed; blocking: ${e instanceof Error ? e.message : "unknown"}`);
    return "unavailable";
  }
}

export async function POST(req: Request) {
  const user = await apiUser("hire");
  if (user instanceof Response) return user;
  const body = await parseBody(req, roleplayRequestSchema);
  if (body instanceof Response) return body;

  try {
    const repo = await getRepo();

    // ---------------------------------------------------------------- turn
    if (body.action === "turn") {
      let session: RoleplaySession | null = null;
      let personaId: string;
      let certification: boolean;
      if (body.sessionId) {
        session = await repo.getRoleplaySession(user.id, body.sessionId);
        if (!session) return notFound();
        if (session.status === "ended" || session.status === undefined) return sessionEnded();
        // The session's persona and mode win over anything in the body.
        personaId = session.personaId;
        certification = session.isCertification;
      } else {
        certification = body.certification === true;
        personaId = certification ? CERT_PERSONA_ID : body.personaId;
      }
      const persona = getPersona(personaId);
      if (!persona) return jsonError(404, "We couldn't find that client. Pick one from the list.");
      if (!certification && persona.card.kind === "certification") return jsonError(400, "This client is only used for the certification call. Start it from the certification screen.");
      if (certification && !(await certificationOpen(repo, user))) return certLocked();

      if (session && countUserTurns(chatFrom(session)) >= MAX_ROLEPLAY_USER_TURNS) return turnLimit();
      const rate = await checkRateLimit(repo, user.id, "roleplay");
      if (!rate.ok) return rateLimitResponse("roleplay", rate);

      session ??= await repo.createRoleplaySession({ hireId: user.id, personaId: persona.card.id, isCertification: certification });
      const sessionId = session.id;
      const message = sanitizeText(body.message);
      const appended = await repo.appendRoleplayTurns(user.id, sessionId, [{ role: "user", content: message }], { maxUserTurns: MAX_ROLEPLAY_USER_TURNS });
      if (!appended) {
        const now = await repo.getRoleplaySession(user.id, sessionId);
        return !now ? notFound() : now.status === "active" ? turnLimit() : sessionEnded();
      }

      const history = chatFrom(appended);
      const userTurns = countUserTurns(history);
      const turnsLeft = MAX_ROLEPLAY_USER_TURNS - userTurns;
      const headers = { "X-Session-Id": sessionId, "X-Turns-Used": String(userTurns), "X-Turns-Left": String(turnsLeft) };
      // Store the persona's reply once the stream has finished (only what the hire actually saw).
      const onDone = async (text: string) => {
        if (!text.trim()) return;
        const ok = await repo.appendRoleplayTurns(user.id, sessionId, [{ role: "assistant", content: text.trim() }]);
        if (!ok) console.warn("[ai] roleplay reply not stored: session no longer active");
      };

      if (looksLikeExtractionAttempt(message)) {
        return textStreamResponse(textChunks(offScriptLine(persona.card.id, userTurns, "extraction")), { mode: "fallback", headers, onDone });
      }
      if (isLive()) {
        const live = await primeLiveStream(
          () =>
            streamText({
              system: buildPersonaSystemPrompt(persona.card, persona.secret, turnsLeft),
              // Neutralise extraction attempts anywhere in the stored history.
              messages: toPersonaMessages(
                history.map((m) => (m.role === "user" && looksLikeExtractionAttempt(m.content) ? { ...m, content: "(message withdrawn)" } : m)),
              ),
              maxTokens: 220,
              temperature: 0.8,
            }),
          "roleplay turn",
        );
        if (live) return textStreamResponse(live, { mode: "live", headers, onDone });
      }
      const hireLines = history.filter((m) => m.role === "user").map((m) => m.content);
      return textStreamResponse(textChunks(fallbackPersonaReply(persona.card.id, persona.secret, hireLines)), { mode: "fallback", headers, onDone });
    }

    // ---------------------------------------------------------------- end (grade the STORED transcript)
    const session = await repo.getRoleplaySession(user.id, body.sessionId);
    if (!session) return notFound();
    if (session.status !== "active") return storedEnd(session);

    const persona = getPersona(session.personaId);
    if (!persona) return notFound();
    const certification = session.isCertification;
    const messages = chatFrom(session);
    if (countUserTurns(messages) === 0) return jsonError(400, "Send at least one message before ending the call.");
    if (certification && !(await certificationOpen(repo, user))) return certLocked();

    const rate = await checkRateLimit(repo, user.id, "roleplay");
    if (!rate.ok) return rateLimitResponse("roleplay", rate);

    // Nothing gradeable (greetings, one-word replies, keyword lists, extraction attempts):
    // say so without a score, keep the call open, and don't spend a certification attempt.
    const analysis = analyseTranscript(messages);
    if (analysis.creditable.length === 0) return notAssessed(session.id, persona.card.id, aiModeNow(), analysis.stuffedTurns > 0);

    if (certification) {
      const allowed = await certAllowed(repo, user.id);
      if (allowed === "unavailable") return jsonError(503, "We couldn't check today's certification attempts. Please try again in a minute.", { code: "rate_check_failed" });
      if (!allowed) {
        return jsonError(429, `You can take the certification call ${CERT_DAILY_LIMIT} times a day. Try again tomorrow, and practise with the other clients in the meantime.`, { code: "cert_limit" });
      }
    }

    const rubric = getRubric();
    const passThreshold = certification ? AI_PASS_SCORE : rubric.passThreshold;
    let mode: AiMode = aiModeNow();
    let result: RoleplayResult | null = null;
    if (mode === "live") {
      try {
        result = await gradeTranscriptLive(persona.card, persona.secret, rubric, messages, passThreshold);
      } catch (e) {
        markAiFailure(e, "roleplay grade");
        mode = "fallback";
      }
    }
    // Without the AI model, a certification call is a quick keyword check: it is capped below the
    // pass mark so it can never satisfy the AI half of certification on its own.
    const fallbackCap = certification ? AI_PASS_SCORE - 1 : 100;
    let uncappedFallbackPass = false;
    if (!result) {
      result = gradeTranscriptFallback(persona.card.id, messages, rubric, { passThreshold, maxOverall: fallbackCap });
      uncappedFallbackPass = certification && gradeTranscriptFallback(persona.card.id, messages, rubric, { passThreshold }).passed;
    }
    // The grader found no quotable evidence at all: no score. The call stays open.
    if (isNotAssessed(result)) return notAssessed(session.id, persona.card.id, mode);

    // Certification outcome is computed before the session is closed so the stored
    // response is complete; the row is written only by the request that closes it.
    let cert: Record<string, unknown> | undefined;
    let certRow: Parameters<Repository["saveCertification"]>[0] | undefined;
    if (certification) {
      const existing = await repo.getCertification(user.id, CERT_STAGE);
      if (existing?.status === "passed") {
        cert = { status: "passed", attempts: existing.attempts, alreadyPassed: true };
      } else {
        const decision = certificationDecision(result, observationFrom(existing?.managerObservation));
        const fallback = mode === "fallback";
        // A strong quick check isn't a fail: it needs a real AI grade (or the manager's review), so it stays pending.
        const status = decision.observationMissing || (fallback && uncappedFallbackPass) ? "pending" : decision.decision;
        const attempts = (existing?.attempts ?? 0) + 1;
        certRow = {
          hireId: user.id,
          stageId: CERT_STAGE,
          // A quick check never replaces a stored AI score.
          aiScore: fallback && typeof existing?.aiScore === "number" ? existing.aiScore : result.overall,
          roleplaySessionId: session.id,
          managerObservation: existing?.managerObservation,
          status,
          attempts,
          signedBy: existing?.signedBy,
          signedAt: existing?.signedAt,
        };
        cert = { status, attempts, decision, ...(fallback ? { needsAiGrade: true } : {}) };
      }
    }

    const response = { mode, sessionId: session.id, assessment: "scored", result, ...(cert ? { certification: cert } : {}) };
    const ended = await repo.endRoleplaySession(user.id, session.id, {
      rubricScores: result.scores,
      overall: result.overall,
      aiSummary: result.summary,
      passed: result.passed,
      endResponse: response,
    });
    if (!ended) {
      // A parallel `end` closed it first: return what that one stored.
      const now = await repo.getRoleplaySession(user.id, session.id);
      return now ? storedEnd(now) : notFound();
    }
    if (certRow) await repo.saveCertification(certRow);
    return json(response);
  } catch (e) {
    return serverError("roleplay", e);
  }
}

/** "Not enough to assess": a result with no score; the session stays active so the hire can carry on. */
function notAssessed(sessionId: string, personaId: string, mode: AiMode = aiModeNow(), keywordLists = false): Response {
  return json({ mode, sessionId, assessment: "not_assessed", result: notAssessedResult(personaId, getRubric(), { keywordLists }) });
}

function turnLimit(): Response {
  return jsonError(409, `This conversation has reached ${MAX_ROLEPLAY_USER_TURNS} messages. End the call to get your feedback.`, { code: "turn_limit" });
}
