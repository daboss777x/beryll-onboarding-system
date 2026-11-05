import { getRepo } from "@/lib/data";
import { aiModeNow, isLive, markAiFailure, streamText, type AiMode } from "@/lib/ai/client";
import { getStaffContent } from "@/lib/ai/content";
import { checkRateLimit, jsonError, looksLikeExtractionAttempt, rateLimitResponse } from "@/lib/ai/guard";
import {
  MATCHER_MAX_QUESTIONS,
  MATCHER_MIN_QUESTIONS,
  buildInterviewerPrompt,
  countQuestions,
  defaultVisibility,
  extractFallback,
  extractLive,
  fallbackQuestion,
  matchStaff,
  polishLive,
  templateSuggestion,
  toInterviewMessages,
} from "@/lib/ai/matcher";
import { apiUser, parseBody, serverError } from "@/lib/ai/route";
import { matcherRequestSchema, type MatcherExtract } from "@/lib/ai/schemas";
import { primeLiveStream, textChunks, textStreamResponse } from "@/lib/ai/stream";
import type { MatcherSuggestion } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await apiUser("hire");
  if (user instanceof Response) return user;
  const body = await parseBody(req, matcherRequestSchema);
  if (body instanceof Response) return body;
  const messages = body.messages.filter((m) => m.content.trim());

  try {
    const repo = await getRepo();
    const rate = await checkRateLimit(repo, user.id, "matcher");
    if (!rate.ok) return rateLimitResponse("matcher", rate);

    // ---------------------------------------------------------------- turn
    if (body.action === "turn") {
      const last = messages[messages.length - 1];
      if (last && last.role !== "user") return jsonError(400, "Reply to the last question first (or type \"skip\").");
      const asked = countQuestions(messages);
      const headers = {
        "X-Questions-Asked": String(asked + 1),
        "X-Can-Finish": String(asked + 1 >= MATCHER_MIN_QUESTIONS),
      };
      if (asked >= MATCHER_MAX_QUESTIONS || (last && looksLikeExtractionAttempt(last.content))) {
        return textStreamResponse(textChunks(fallbackQuestion(asked >= MATCHER_MAX_QUESTIONS ? messages : messages.slice(0, -1))), { mode: "fallback", headers });
      }
      if (isLive()) {
        const live = await primeLiveStream(
          () => streamText({ system: buildInterviewerPrompt(asked), messages: toInterviewMessages(messages), maxTokens: 150, temperature: 0.8 }),
          "matcher turn",
        );
        if (live) return textStreamResponse(live, { mode: "live", headers });
      }
      return textStreamResponse(textChunks(fallbackQuestion(messages)), { mode: "fallback", headers });
    }

    // ---------------------------------------------------------------- finish
    if (!messages.some((m) => m.role === "user")) return jsonError(400, "Answer at least one question so we can find your matches.");

    let mode: AiMode = aiModeNow();
    let extract: MatcherExtract | null = null;
    if (mode === "live") {
      try {
        extract = await extractLive(messages);
      } catch (e) {
        markAiFailure(e, "matcher extract");
        mode = "fallback";
      }
    }
    extract ??= extractFallback(messages);

    const fromRepo = await repo.listStaff().catch(() => []);
    const staff = fromRepo.length ? fromRepo : getStaffContent();
    const buddy = user.buddyId ? await repo.getProfile(user.buddyId).catch(() => null) : null;
    const buddyStaffId = buddy ? staff.find((s) => s.name === buddy.name)?.id : undefined;
    const picks = matchStaff(extract.interests, staff, { buddyStaffId });

    let suggestions: MatcherSuggestion[] | null = null;
    if (mode === "live") {
      try {
        suggestions = await polishLive(picks, extract);
      } catch (e) {
        markAiFailure(e, "matcher polish");
      }
    }
    suggestions ??= picks.map(templateSuggestion);

    const saved = await repo.saveMatcherProfile({
      hireId: user.id,
      interests: extract.interests,
      visibility: defaultVisibility(extract.interests),
      suggestions,
    });

    const byId = new Map(staff.map((s) => [s.id, s]));
    return Response.json(
      {
        mode,
        extracted: extract,
        suggestions: suggestions.map((s) => ({ ...s, name: byId.get(s.staffId)?.name ?? s.staffId, title: byId.get(s.staffId)?.title ?? "", team: byId.get(s.staffId)?.team ?? "" })),
        profile: saved,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return serverError("matcher", e);
  }
}
