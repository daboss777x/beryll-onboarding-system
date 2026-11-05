// The one place the browser talks to POST /api/ai/roleplay.
// Contract (Leah's audit): the client never sends the transcript. A turn sends one message plus the server's
// sessionId (from the X-Session-Id header of the first turn); "end" sends only the sessionId.
import type { RoleplayResult } from "@/lib/types";

export type RoleplayErrorCode = "turn_limit" | "session_ended" | "rate_limited" | "cert_limit" | "cert_locked" | "not_found" | "bad_request" | "network" | "server_error";

export class RoleplayError extends Error {
  constructor(
    message: string,
    public code: RoleplayErrorCode,
    public status: number,
  ) {
    super(message);
  }
}

export interface TurnMeta {
  sessionId: string | null;
  turnsUsed: number | null;
  turnsLeft: number | null;
  mode: "live" | "fallback" | null;
}

export interface CertificationOutcome {
  status: "pending" | "passed" | "retest";
  attempts: number;
  alreadyPassed?: boolean;
  decision?: { decision?: string; coaching?: string[]; observationMissing?: boolean };
  /** Set when the AI coach was offline: the score is a capped quick check that still needs the full AI grade or a manager review. */
  needsAiGrade?: boolean;
}

export interface EndResponse {
  mode: "live" | "fallback";
  sessionId: string;
  /** "not_assessed": nothing gradeable yet. The session stays active and nothing was saved; keep talking, then end again. */
  assessment?: "scored" | "not_assessed";
  result: RoleplayResult;
  certification?: CertificationOutcome;
}

async function toError(res: Response): Promise<RoleplayError> {
  let body: { error?: string; code?: string } = {};
  try {
    body = await res.json();
  } catch {
    /* non-JSON error */
  }
  const fallbackCode: RoleplayErrorCode = res.status === 404 ? "not_found" : res.status === 429 ? "rate_limited" : res.status >= 500 ? "server_error" : "bad_request";
  const code = (body.code as RoleplayErrorCode | undefined) ?? fallbackCode;
  const message =
    body.error ??
    (code === "rate_limited" ? "You've reached today's role-play limit. It resets at midnight." : code === "server_error" ? "Something went wrong on our side. Please try again." : "That didn't work. Please try again.");
  return new RoleplayError(message, code, res.status);
}

async function post(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
  let res: Response;
  try {
    res = await fetch("/api/ai/roleplay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new RoleplayError("You seem to be offline. Check your connection and try again.", "network", 0);
  }
  if (!res.ok) throw await toError(res);
  return res;
}

const num = (v: string | null) => (v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

/** Sends one hire message and streams the persona's reply through onChunk. */
export async function sendTurn(
  input: { personaId: string; message: string; sessionId: string | null; certification?: boolean },
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<TurnMeta> {
  const res = await post(
    {
      action: "turn",
      personaId: input.personaId,
      message: input.message,
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
      ...(input.certification ? { certification: true } : {}),
    },
    signal,
  );
  const mode = res.headers.get("X-AI-Mode");
  const meta: TurnMeta = {
    sessionId: res.headers.get("X-Session-Id") ?? input.sessionId,
    turnsUsed: num(res.headers.get("X-Turns-Used")),
    turnsLeft: num(res.headers.get("X-Turns-Left")),
    mode: mode === "live" || mode === "fallback" ? mode : null,
  };
  if (!res.body) {
    onChunk(await res.text());
    return meta;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (text) onChunk(text);
  }
  const tail = decoder.decode();
  if (tail) onChunk(tail);
  return meta;
}

/** Ends the call; the server grades its own copy of the transcript. */
export async function endSession(sessionId: string): Promise<EndResponse> {
  const res = await post({ action: "end", sessionId });
  return (await res.json()) as EndResponse;
}
