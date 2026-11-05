import { dataMode, getRepo } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isLive, streamText } from "@/lib/ai/client";
import {
  COACH_REFUSAL,
  buildCoachPrompt,
  citationsFor,
  coachTrailer,
  fallbackCoachReply,
  retrieve,
  type HumanContacts,
  toCoachMessages,
  type ScoredChunk,
  type VectorSearch,
} from "@/lib/ai/coach";
import { checkRateLimit, looksLikeExtractionAttempt, rateLimitResponse, sanitizeText } from "@/lib/ai/guard";
import { apiUser, parseBody, serverError } from "@/lib/ai/route";
import { coachRequestSchema } from "@/lib/ai/schemas";
import { primeLiveStream, textChunks, textStreamResponse } from "@/lib/ai/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** pgvector search through the user's Supabase session (RLS: signed-in users may read sop_chunks). */
const supabaseVectorSearch: VectorSearch = async (embedding, k) => {
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.rpc("match_sop_chunks", { query_embedding: embedding, match_count: k });
  if (error) throw new Error(error.message);
  return ((data ?? []) as { id: string; sop_id: string; title: string; text: string; similarity: number }[]).map(
    (r): ScoredChunk => ({ id: r.id, sopId: r.sop_id, title: r.title, text: r.text, score: r.similarity }),
  );
};

export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const body = await parseBody(req, coachRequestSchema);
  if (body instanceof Response) return body;

  try {
    const repo = await getRepo();
    const rate = await checkRateLimit(repo, user.id, "coach");
    if (!rate.ok) return rateLimitResponse("coach", rate);

    const question = sanitizeText(body.question);
    const firstName = async (id: string | undefined) => (id ? ((await repo.getProfile(id).catch(() => null))?.name.split(/\s+/)[0] ?? null) : null);
    const [buddy, manager] = await Promise.all([firstName(user.buddyId), firstName(user.managerId)]);
    const contacts: HumanContacts = { buddy, manager };

    if (looksLikeExtractionAttempt(question)) {
      return textStreamResponse(textChunks(COACH_REFUSAL), { mode: "fallback", trailer: () => coachTrailer({ mode: "fallback", method: "keyword", citations: [] }) });
    }

    const { chunks, method } = await retrieve(question, { vectorSearch: dataMode() === "supabase" ? supabaseVectorSearch : undefined });

    if (chunks.length && isLive()) {
      const live = await primeLiveStream(
        () => streamText({ system: buildCoachPrompt(chunks, contacts), messages: toCoachMessages(question, body.history), maxTokens: 400, temperature: 0.2 }),
        "coach answer",
      );
      if (live) return textStreamResponse(live, { mode: "live", trailer: (full) => coachTrailer({ mode: "live", method, citations: citationsFor(full, chunks) }) });
    }

    // No chunks (even in live mode) or no model: an honest scripted reply with a named human route.
    const mode = chunks.length || !isLive() ? "fallback" : "live";
    const reply = fallbackCoachReply(question, chunks, contacts, method);
    return textStreamResponse(textChunks(reply.text), { mode, trailer: () => coachTrailer({ mode, method, citations: reply.cite.length ? citationsFor(reply.text, reply.cite) : [] }) });
  } catch (e) {
    return serverError("coach", e);
  }
}
