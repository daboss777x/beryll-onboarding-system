import type { ValidatorKey, WalkthroughStep } from "@/content/walkthroughs/types";
import type { TourPayload } from "./bus";

const text = (p: TourPayload) => (typeof p.value === "string" ? p.value.trim() : "");

export const VALIDATORS: Record<ValidatorKey, (p: TourPayload) => boolean> = {
  nonEmpty: (p) => text(p).length > 0,
  // an IPv4 address/range, or a hostname with a dot
  hasTargets: (p) => /\b\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?\b/.test(text(p)) || /\b[a-z0-9-]+(\.[a-z0-9-]+)+\b/i.test(text(p)),
  positivePrice: (p) => Number(text(p)) > 0,
  minLength20: (p) => text(p).length >= 20,
  atLeastTwoFlags: (p) => Number(p.flagCount) >= 2,
};

/** Does this event payload satisfy the step's expectation? */
export function matches(step: WalkthroughStep, payload: TourPayload): boolean {
  const e = step.expect;
  if (e === undefined) return true;
  if (typeof e === "string") return VALIDATORS[e](payload);
  return Object.entries(e).every(([k, v]) => payload[k] === v);
}
