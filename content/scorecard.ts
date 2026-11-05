import type { ScorecardGoal } from "./schema";

/** 30/60/90 scorecard goals from the job description (Part A), expanded into measurable items. */
export const scorecardGoals: ScorecardGoal[] = [
  {
    id: "d30-certified",
    horizon: 30,
    title: "Certified for solo client contact",
    measure: "Certification result (AI role-play plus manager observation)",
    target: "Passed",
    evidence: "Certification record signed by your manager",
  },
  {
    id: "d30-draft-nda",
    horizon: 30,
    title: "Draft an NDA independently from the template",
    measure: "NDAs drafted without help, reviewed by your manager",
    target: "1 NDA, no standard-clause errors",
    evidence: "Contract in Beryll Contracts with manager review note",
  },
  {
    id: "d30-draft-sow",
    horizon: 30,
    title: "Draft a SOW independently from the template",
    measure: "SOWs drafted without help that reach Engineer Sign-off first time",
    target: "1 SOW",
    evidence: "Approval-pipeline history in Beryll Contracts",
  },
  {
    id: "d60-accounts",
    horizon: 60,
    title: "Manage 3-5 client accounts solo",
    measure: "Accounts where you are the named owner with an up-to-date plan",
    target: "3 to 5 accounts",
    evidence: "CRM account ownership and last-contact dates",
  },
  {
    id: "d60-qa",
    horizon: 60,
    title: "Client communications at or above standard",
    measure: "Manager QA score on sampled emails and calls (1 in 5)",
    target: "Average 4 out of 5 or better",
    evidence: "QA sampling sheet",
  },
  {
    id: "d60-review",
    horizon: 60,
    title: "Review one client contract end to end",
    measure: "A client-paper contract reviewed, risks flagged, legal escalation made where needed",
    target: "1 contract",
    evidence: "Review notes attached to the contract",
  },
  {
    id: "d90-close",
    horizon: 90,
    title: "Close a renewal or a new SOW",
    measure: "Signed renewal or new SOW with you as owner",
    target: "1 signed",
    evidence: "Signed status in Beryll Contracts and CRM closed-won",
  },
  {
    id: "d90-sop",
    horizon: 90,
    title: "Propose one improvement to an SOP or template",
    measure: "Fix-one-SOP suggestion accepted or discussed by the SOP owner",
    target: "1 suggestion submitted",
    evidence: "SOP suggestion record and owner response",
  },
];
