import type { Walkthrough, WalkthroughId } from "./types";
import { wtApprovalPipeline } from "./wt-approval-pipeline";
import { wtCreateSow } from "./wt-create-sow";
import { wtReviewContract } from "./wt-review-contract";

export * from "./types";

export const WALKTHROUGHS: Record<WalkthroughId, Walkthrough> = {
  "wt-create-sow": wtCreateSow,
  "wt-approval-pipeline": wtApprovalPipeline,
  "wt-review-contract": wtReviewContract,
};

export function getWalkthrough(id: string | null | undefined): Walkthrough | undefined {
  return id && id in WALKTHROUGHS ? WALKTHROUGHS[id as WalkthroughId] : undefined;
}

/** Link that opens a walkthrough on the contracts page, e.g. for Today / Roadmap cards. */
export const walkthroughHref = (id: WalkthroughId, mode: "watch" | "guided" | "solo") => `/contracts?walkthrough=${id}&mode=${mode}`;
