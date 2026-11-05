// Walkthrough content contract. Pure data shapes, safe for client bundles.
// Steps target elements in the Beryll Contracts mini-app by their data-tour id and
// are validated by events the mini-app emits on the tour bus (components/walkthrough/bus.ts).

export const WALKTHROUGH_MODES = ["watch", "guided", "solo"] as const;
export type WalkthroughMode = (typeof WALKTHROUGH_MODES)[number];

export type WalkthroughId = "wt-create-sow" | "wt-approval-pipeline" | "wt-review-contract";

export type StepAction = "click" | "drag" | "type" | "select" | "observe";

/**
 * Every event the mini-app emits. The walkthrough engine listens to these to check
 * the user's real actions. "*.blocked" events mean a business rule stopped the user.
 */
export const TOUR_EVENTS = [
  "view.changed", // {view}
  "contracts.searched", // {query}
  "contracts.filtered", // {filter, value}
  "contract.new_started", // {}
  "contract.client_selected", // {clientId}
  "contract.template_selected", // {template}
  "contract.scope.targets", // {value}
  "contract.scope.window", // {value}
  "contract.scope.exclusions", // {value}
  "contract.dates", // {start, end}
  "contract.price", // {value}
  "contract.scope_completed", // {}
  "contract.scope_blocked", // {reason}
  "contract.clause_added", // {clauseId, standard}
  "contract.clause_removed", // {clauseId}
  "contract.clause_reordered", // {clauseId, index}
  "contract.saved", // {contractId, clauseCount, nonStandard}
  "contract.moved", // {contractId, from, to}
  "contract.move_blocked", // {contractId, from, to, reason}
  "contract.authorisation_attached", // {contractId}
  "review.flag_opened", // {clauseId}
  "review.risk_selected", // {clauseId, risk}
  "review.edit_typed", // {clauseId, value}
  "review.flag_saved", // {clauseId, risk}
  "review.flag_blocked", // {clauseId, reason}
  "review.flag_removed", // {clauseId}
  "review.escalated", // {docId, flagCount}
  "review.escalate_blocked", // {docId, reason}
] as const;
export type TourEventName = (typeof TOUR_EVENTS)[number];

/** Named checks the engine runs against an event payload (implemented in components/walkthrough/validators.ts). */
export type ValidatorKey =
  | "nonEmpty" // payload.value has text
  | "hasTargets" // payload.value names at least one IP, range or hostname
  | "positivePrice" // payload.value parses to a number > 0
  | "minLength20" // payload.value is at least 20 characters
  | "atLeastTwoFlags"; // payload.flagCount >= 2

export type Primitive = string | number | boolean;

export interface WalkthroughStep {
  id: string;
  /** data-tour id of the element to spotlight (and, in Watch mode, to act on). */
  target: string;
  action: StepAction;
  /** Tour event that completes the step. Omit only for "observe" steps (they advance on Next). */
  event?: TourEventName;
  /** Validator key, or a payload subset that must match exactly (e.g. { to: "legal_review" }). */
  expect?: ValidatorKey | Record<string, Primitive>;
  /** drag steps: data-tour id of the drop zone. */
  dropTarget?: string;
  /** type/select steps: what the ghost cursor types or picks in Watch mode. */
  demoValue?: string;
  title: string;
  /** Why the step matters, in plain English. Shown as the caption / popover body. */
  narration: string;
  /** Concrete "how", shown on request in Guided mode and as the nudge after a wrong action. */
  hint: string;
}

export interface Walkthrough {
  id: WalkthroughId;
  title: string;
  summary: string;
  estMinutes: number;
  /** Mini-app view the run starts on. */
  startView: "list" | "board" | "review";
  steps: WalkthroughStep[];
}

/**
 * What a run produces. The first five fields map 1:1 onto WalkthroughRun in lib/data/types.ts
 * (add hireId server-side); stepsDone / totalSteps / score / completed are extra detail.
 */
export interface WalkthroughResult {
  walkthroughId: WalkthroughId;
  mode: WalkthroughMode;
  errors: number;
  durationMs: number;
  /** Guided/Solo: every step done with at most MAX_ERRORS_TO_PASS errors. Watch: true when watched to the end. */
  passed: boolean;
  /** Steps finished in this run (Solo skips "observe" steps, so its total is smaller). */
  stepsDone: number;
  totalSteps: number;
  /** 0-100 for Guided and Solo (see scoreRun in components/walkthrough/score.ts); null for Watch. */
  score: number | null;
  /** false when the hire exited before the last step. */
  completed: boolean;
}

/** Pass rule for Guided and Solo runs. Watch runs always pass. */
export const MAX_ERRORS_TO_PASS = 2;
