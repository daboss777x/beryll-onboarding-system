import "server-only";
import type { TaskProgress } from "../types";
import type { Certification, CheckInRecord } from "./types";

/**
 * Manager-only notes (Leah pass 2, M2): check-in notes, QA notes on a task and the
 * free-text notes inside a certification observation. Hires must never read them.
 *
 * Supabase: they live in public.manager_notes (RLS: the hire's manager only), keyed by
 * (hire_id, subject). The main rows (checkins, task_progress, certifications) never hold
 * them, so a hire's JWT cannot read them through PostgREST.
 * Memory: kept on the rows, and stripped on read unless the viewer is the hire's manager.
 */

/** Keys inside Certification.managerObservation that are manager-only. */
export const PRIVATE_OBSERVATION_KEYS = ["notes", "note"] as const;
export type PrivateObservationKey = (typeof PRIVATE_OBSERVATION_KEYS)[number];

export const noteSubject = {
  checkin: (dueDay: number) => `checkin:${dueDay}`,
  qa: (taskId: string) => `qa:${taskId}`,
  cert: (stageId: string, key: PrivateObservationKey) => `cert:${stageId}:${key}`,
};

/** Splits an observation into the hire-visible part and the manager-only keys that are PRESENT. */
export function splitObservation(obs: Record<string, unknown> | undefined): {
  shared: Record<string, unknown> | undefined;
  privateKeys: Partial<Record<PrivateObservationKey, unknown>>;
} {
  if (!obs) return { shared: obs, privateKeys: {} };
  const shared: Record<string, unknown> = {};
  const privateKeys: Partial<Record<PrivateObservationKey, unknown>> = {};
  for (const [k, v] of Object.entries(obs)) {
    if ((PRIVATE_OBSERVATION_KEYS as readonly string[]).includes(k)) privateKeys[k as PrivateObservationKey] = v;
    else shared[k] = v;
  }
  return { shared, privateKeys };
}

export function stripCheckinNotes(c: CheckInRecord): CheckInRecord {
  const rest = { ...c };
  delete rest.notes;
  return rest;
}

export function stripTaskQaNotes(t: TaskProgress): TaskProgress {
  if (!t.data || !("qaNotes" in t.data)) return t;
  const data = { ...t.data };
  delete data.qaNotes;
  return { ...t, data };
}

export function stripCertificationNotes(c: Certification): Certification {
  if (!c.managerObservation) return c;
  return { ...c, managerObservation: splitObservation(c.managerObservation).shared };
}
