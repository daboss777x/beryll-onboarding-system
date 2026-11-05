import { dataMode } from "@/lib/data";
import { aiModeNow } from "@/lib/ai/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public liveness check. Reports modes only, never config values. */
export async function GET() {
  return Response.json({ ok: true, aiMode: aiModeNow(), dataMode: dataMode() }, { headers: { "Cache-Control": "no-store" } });
}
