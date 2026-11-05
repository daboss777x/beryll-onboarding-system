import "server-only";
import type { z } from "zod";
import { requireApiUser, authErrorResponse } from "../data/auth";
import type { Profile, Role } from "../types";
import { jsonError, readJsonBody, zodMessage } from "./guard";

/** Signed-in profile, or a 401/403 JSON Response. */
export async function apiUser(role?: Role | readonly Role[]): Promise<Profile | Response> {
  try {
    return await requireApiUser(role);
  } catch (e) {
    const r = authErrorResponse(e);
    if (r) return r;
    console.error(`[api] auth lookup failed: ${e instanceof Error ? e.message : "unknown"}`);
    return jsonError(500, "We couldn't check your sign-in. Please refresh and try again.");
  }
}

/** Parsed body, or a 400 JSON Response with a friendly message. */
export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<T | Response> {
  const raw = await readJsonBody(req);
  if (raw === undefined) return jsonError(400, "Send a JSON body.");
  const r = schema.safeParse(raw);
  return r.success ? r.data : jsonError(400, zodMessage(r.error));
}

/** Last-resort handler so routes never leak raw errors. */
export function serverError(where: string, e: unknown): Response {
  console.error(`[api] ${where} failed: ${e instanceof Error ? e.message : "unknown"}`);
  return jsonError(500, "Something went wrong on our side. Please try again in a moment.");
}
