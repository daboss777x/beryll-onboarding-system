import { getRepo } from "@/lib/data";
import { aiModeNow, markAiFailure, type AiMode } from "@/lib/ai/client";
import { gradeLive, prepareGrade, type LabGrade } from "@/lib/ai/grade";
import { checkRateLimit, jsonError, rateLimitResponse } from "@/lib/ai/guard";
import { apiUser, parseBody, serverError } from "@/lib/ai/route";
import { gradeRequestSchema } from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await apiUser("hire");
  if (user instanceof Response) return user;
  const body = await parseBody(req, gradeRequestSchema);
  if (body instanceof Response) return body;

  const prep = prepareGrade(body.labId, body.itemId, body.answer);
  if (!prep.ok) return jsonError(prep.status, prep.error);

  try {
    const repo = await getRepo();
    const rate = await checkRateLimit(repo, user.id, "grade");
    if (!rate.ok) return rateLimitResponse("grade", rate);

    let mode: AiMode = aiModeNow();
    let grade: LabGrade | null = null;
    if (mode === "live") {
      try {
        grade = { ...prep.prepared.finalise(await gradeLive(prep.prepared.prompt())), mode };
      } catch (e) {
        markAiFailure(e, `grade ${body.labId}`);
        mode = "fallback";
      }
    }
    grade ??= { ...prep.prepared.finalise(prep.prepared.fallback()), mode: "fallback" };
    return Response.json(grade, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return serverError("grade", e);
  }
}
