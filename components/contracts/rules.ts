// Approval-board rules. Pure functions: no React, easy to unit-test or move to lib/logic later.
import { CONTRACT_STATUSES, type AppContract, type ContractStatus } from "./types";

export type MoveCheck = { ok: true } | { ok: false; title: string; reason: string };

const order = (s: ContractStatus) => CONTRACT_STATUSES.indexOf(s);

export const nonStandardCount = (c: Pick<AppContract, "clauses">) => c.clauses.filter((x) => !x.standard).length;
export const needsAuthorisation = (c: AppContract) => c.type === "SOW";
export const hasAuthorisation = (c: AppContract) => c.attachments.some((a) => a.kind === "authorisation");

/**
 * Can this contract move to `to`? (Rules follow the Contracts SOP in content/sops.)
 * - Any non-standard clause (standard: false) forces Legal Review: Draft can't jump past it.
 * - All-standard contracts may go Draft -> Engineer Sign-off directly (Legal Review is optional).
 * - Nothing reaches Sent to Client without Engineer Sign-off.
 * - A SOW can only be marked Signed with an Authorisation to Test attached.
 * - Other forward moves go one column at a time. Backward moves (rework) are allowed, except out of Signed.
 */
export function canMove(c: AppContract, to: ContractStatus): MoveCheck {
  const from = c.status;
  if (from === to) return { ok: false, title: "Already there", reason: `This contract is already in ${label(to)}.` };
  if (from === "signed") return { ok: false, title: "Signed contracts are locked", reason: "Once a contract is signed it can't move. Raise a change request or a new SOW instead." };
  if (order(to) < order(from)) return { ok: true };

  const ns = nonStandardCount(c);
  if (from === "draft" && to !== "legal_review" && ns > 0) {
    return { ok: false, title: "Legal must review first", reason: `This contract has ${ns} non-standard clause${ns === 1 ? "" : "s"}, so it has to go through Legal Review before anything else.` };
  }
  if ((to === "sent" || to === "signed") && order(from) < order("engineer_signoff")) {
    return { ok: false, title: "Engineer sign-off needed", reason: "An engineer must confirm the scope before it goes to the client, so we never promise testing we can't deliver." };
  }
  const skipsLegalOnly = from === "draft" && to === "engineer_signoff";
  if (!skipsLegalOnly && order(to) - order(from) > 1) {
    return { ok: false, title: "One stage at a time", reason: `Move it to ${label(CONTRACT_STATUSES[order(from) + 1])} first.` };
  }
  if (to === "signed" && needsAuthorisation(c) && !hasAuthorisation(c)) {
    return { ok: false, title: "Authorisation to Test missing", reason: "Attach the client's signed Authorisation to Test before marking a SOW as signed. Without it, testing could be illegal." };
  }
  return { ok: true };
}

/** Where a contract must go back to after its clauses change (non-standard clauses force Legal Review). */
export function statusAfterClauseEdit(c: AppContract, nextClauses: AppContract["clauses"]): ContractStatus {
  const addedNonStandard = nextClauses.some((x) => !x.standard && !c.clauses.some((y) => y.id === x.id));
  if (addedNonStandard && order(c.status) > order("legal_review") && c.status !== "signed") return "legal_review";
  return c.status;
}

function label(s: ContractStatus) {
  return { draft: "Draft", legal_review: "Legal Review", engineer_signoff: "Engineer Sign-off", sent: "Sent to Client", signed: "Signed" }[s];
}
