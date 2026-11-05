// Client-safe result shape for manager and buddy server actions.
export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };
