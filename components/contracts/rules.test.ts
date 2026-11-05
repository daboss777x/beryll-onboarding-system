import { describe, expect, it } from "vitest";
import { canMove, hasAuthorisation, needsAuthorisation, nonStandardCount, statusAfterClauseEdit } from "./rules";
import type { AppContract, Clause, ContractStatus, ContractType } from "./types";

const std = (id: string): Clause => ({ id, title: id, text: "Standard wording.", standard: true });
const custom = (id: string): Clause => ({ id, title: id, text: "Custom wording.", standard: false });

function contract(over: Partial<AppContract> & { status?: ContractStatus; type?: ContractType } = {}): AppContract {
  return {
    id: "ct-1",
    clientId: "client",
    client: "Client Ltd",
    type: "SOW",
    title: "Test SOW",
    valueEur: 1000,
    status: "draft",
    owner: "You",
    updatedAt: "2026-11-04T09:00:00.000Z",
    clauses: [std("a"), std("b")],
    attachments: [],
    history: [],
    ...over,
  };
}
const withAuth = { attachments: [{ id: "att", kind: "authorisation" as const, name: "auth.pdf", addedAt: "2026-11-04" }] };

describe("Legal Review is only required when a clause is non-standard", () => {
  it("all-standard Draft may skip Legal and go straight to Engineer Sign-off", () => {
    expect(canMove(contract(), "engineer_signoff")).toEqual({ ok: true });
  });
  it("all-standard Draft may still choose Legal Review", () => {
    expect(canMove(contract(), "legal_review").ok).toBe(true);
  });
  it("Draft with a non-standard clause cannot skip Legal Review", () => {
    const c = contract({ clauses: [std("a"), custom("x")] });
    const r = canMove(c, "engineer_signoff");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.title).toMatch(/Legal/);
    expect(canMove(c, "legal_review").ok).toBe(true);
  });
  it("non-standard contract in Legal Review may move on to Engineer Sign-off", () => {
    expect(canMove(contract({ status: "legal_review", clauses: [custom("x")] }), "engineer_signoff").ok).toBe(true);
  });
  it("counts non-standard clauses", () => {
    expect(nonStandardCount(contract({ clauses: [std("a"), custom("x"), custom("y")] }))).toBe(2);
  });
});

describe("nothing reaches Sent without Engineer Sign-off", () => {
  it.each<ContractStatus>(["draft", "legal_review"])("blocks %s -> sent", (from) => {
    const r = canMove(contract({ status: from }), "sent");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.title).toMatch(/Engineer/);
  });
  it.each<ContractStatus>(["draft", "legal_review"])("blocks %s -> signed even with authorisation", (from) => {
    const r = canMove(contract({ status: from, ...withAuth }), "signed");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.title).toMatch(/Engineer/);
  });
  it("allows engineer_signoff -> sent", () => {
    expect(canMove(contract({ status: "engineer_signoff" }), "sent").ok).toBe(true);
  });
  it("blocks engineer_signoff -> signed (one stage at a time)", () => {
    expect(canMove(contract({ status: "engineer_signoff", ...withAuth }), "signed").ok).toBe(false);
  });
});

describe("a SOW needs Authorisation before Signed", () => {
  it("blocks sent -> signed for a SOW without authorisation", () => {
    const r = canMove(contract({ status: "sent" }), "signed");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.title).toMatch(/Authorisation/);
  });
  it("allows sent -> signed once authorisation is attached", () => {
    expect(canMove(contract({ status: "sent", ...withAuth }), "signed").ok).toBe(true);
  });
  it("does not require authorisation for non-SOW contracts", () => {
    const nda = contract({ type: "NDA", status: "sent" });
    expect(needsAuthorisation(nda)).toBe(false);
    expect(canMove(nda, "signed").ok).toBe(true);
  });
  it("detects an attached authorisation", () => {
    expect(hasAuthorisation(contract(withAuth))).toBe(true);
    expect(hasAuthorisation(contract())).toBe(false);
  });
});

describe("other movement rules", () => {
  it("signed contracts are locked", () => {
    expect(canMove(contract({ status: "signed", ...withAuth }), "sent").ok).toBe(false);
  });
  it("backward moves (rework) are allowed", () => {
    expect(canMove(contract({ status: "sent" }), "draft").ok).toBe(true);
  });
  it("moving to the same column is a no-op error", () => {
    expect(canMove(contract(), "draft").ok).toBe(false);
  });
  it("forward moves go one stage at a time (except the all-standard Legal skip)", () => {
    expect(canMove(contract({ status: "legal_review" }), "sent").ok).toBe(false);
  });
});

describe("statusAfterClauseEdit", () => {
  it("sends a contract past Legal back to Legal Review when a non-standard clause is added", () => {
    const c = contract({ status: "engineer_signoff" });
    expect(statusAfterClauseEdit(c, [...c.clauses, custom("new")])).toBe("legal_review");
  });
  it("keeps the status for standard additions", () => {
    const c = contract({ status: "sent" });
    expect(statusAfterClauseEdit(c, [...c.clauses, std("new")])).toBe("sent");
  });
  it("keeps Draft as Draft (Legal is enforced on the next move)", () => {
    const c = contract();
    expect(statusAfterClauseEdit(c, [custom("new")])).toBe("draft");
  });
  it("never changes a signed contract", () => {
    const c = contract({ status: "signed" });
    expect(statusAfterClauseEdit(c, [custom("new")])).toBe("signed");
  });
});
