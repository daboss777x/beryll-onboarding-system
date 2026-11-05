// Integrity checks: every walkthrough step points at a real data-tour id in the mini-app,
// listens for an event the app actually emits, and references real fixture ids.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CLAUSE_LIBRARY, CLIENTS, REVIEW_DOC, TEMPLATES, TOUR_PIPELINE_CONTRACT_ID } from "@/components/contracts/fixtures";
import { RISK_TYPES } from "@/components/contracts/types";
import { VALIDATORS } from "@/components/walkthrough/validators";
import { TOUR_EVENTS, WALKTHROUGHS, type Primitive } from "./index";

const root = join(__dirname, "..", "..");
const sources = ["components/contracts", "components/walkthrough"].flatMap((dir) =>
  readdirSync(join(root, dir))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => readFileSync(join(root, dir, f), "utf8")),
);
const src = sources.join("\n");

// data-tour="x", data-tour={`x-${y}`} and tour={`x-${y}`} (props forwarded to data-tour).
const patterns = [...src.matchAll(/(?:data-tour|tour)=(?:"([^"]+)"|\{`([^`]+)`\})/g)].map(([, plain, tpl]) => {
  const raw = plain ?? tpl;
  const re = raw.replace(/[.*+?^()|[\]\\]/g, "\\$&").replace(/\$\{[^}]+\}/g, "[a-z0-9_-]+");
  return new RegExp(`^${re}$`);
});
const hasTourId = (id: string) => patterns.some((p) => p.test(id));
const emitted = new Set([...src.matchAll(/emitTour\("([a-z_.]+)"/g)].map((m) => m[1]));
for (const k of ["targets", "window", "exclusions"]) if (src.includes("emitTour(`contract.scope.${k}`")) emitted.add(`contract.scope.${k}`);

const all = Object.values(WALKTHROUGHS);

describe.each(all)("$id", (wt) => {
  it("has unique step ids and at least one action", () => {
    expect(new Set(wt.steps.map((s) => s.id)).size).toBe(wt.steps.length);
    expect(wt.steps.some((s) => s.action !== "observe")).toBe(true);
  });

  it.each(wt.steps)("step $id targets existing data-tour ids", (s) => {
    expect(hasTourId(s.target), `no data-tour matches "${s.target}"`).toBe(true);
    if (s.dropTarget) expect(hasTourId(s.dropTarget), `no data-tour matches "${s.dropTarget}"`).toBe(true);
  });

  it.each(wt.steps)("step $id is well formed", (s) => {
    expect(s.title && s.narration && s.hint).toBeTruthy();
    if (s.action === "observe") return expect(s.event).toBeUndefined();
    expect(s.event, "action steps need an event").toBeDefined();
    expect(TOUR_EVENTS).toContain(s.event);
    expect(emitted.has(s.event!), `the app never emits ${s.event}`).toBe(true);
    if (s.action === "drag") expect(s.dropTarget).toBeDefined();
    if (s.action === "type" || s.action === "select") expect(s.demoValue, "Watch mode needs a demoValue").toBeTruthy();
    if (typeof s.expect === "string") expect(Object.keys(VALIDATORS)).toContain(s.expect);
  });
});

describe("fixture references", () => {
  const exp = (id: string, step: string) => WALKTHROUGHS[id as keyof typeof WALKTHROUGHS].steps.find((s) => s.id === step)?.expect as Record<string, Primitive>;

  it("wt-create-sow uses a real client, template and library clauses", () => {
    expect(CLIENTS.map((c) => c.id)).toContain(exp("wt-create-sow", "client").clientId);
    expect(TEMPLATES.map((t) => t.id)).toContain(exp("wt-create-sow", "template").template);
    const lib = CLAUSE_LIBRARY.map((c) => c.id);
    for (const step of ["add-exec-presentation", "add-out-of-hours"]) expect(lib).toContain(exp("wt-create-sow", step).clauseId);
  });

  it("wt-create-sow demo values pass their own validators", () => {
    for (const s of WALKTHROUGHS["wt-create-sow"].steps)
      if (typeof s.expect === "string" && s.demoValue !== undefined) expect(VALIDATORS[s.expect]({ value: s.demoValue }), s.id).toBe(true);
  });

  it("wt-approval-pipeline drives the tour card", () => {
    for (const s of WALKTHROUGHS["wt-approval-pipeline"].steps) if (s.event?.startsWith("contract.")) expect(s.expect).toMatchObject({ contractId: TOUR_PIPELINE_CONTRACT_ID });
  });

  it("wt-review-contract flags real clauses with real risk types", () => {
    const ids = REVIEW_DOC.clauses.map((c) => c.id);
    for (const s of WALKTHROUGHS["wt-review-contract"].steps) {
      if (typeof s.expect !== "object") continue;
      if ("clauseId" in s.expect) expect(ids).toContain(s.expect.clauseId);
      if ("risk" in s.expect) expect(RISK_TYPES).toContain(s.expect.risk);
    }
  });
});
