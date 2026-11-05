import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

// `server-only` throws outside a Next server build; stub it so the server files can be validated here.
vi.mock("server-only", () => ({}));

import {
  CHECKLIST_IDS, LAB_IDS, PERSONA_IDS, WALKTHROUGH_IDS, RUBRIC_CRITERIA, INTERESTS, HREF_PATTERNS,
  stageDefSchema, taskDefSchema, lessonSchema, storySchema, quizSchema, quizKeySchema, sopSchema,
  personaCardSchema, personaSecretSchema, rubricSchema, redlineContractSchema, redlineKeySchema,
  drillPublicSchema, drillKeySchema, checklistSchema, phishingEmailSchema, phishingKeySchema,
  translatorPublicSchema, translatorRubricSchema, staffSchema, clientSchema, contractSchema, sowTemplateSchema,
  demoAccountSchema, taskProgressSchema, pulseSchema, checkInSchema, xpEventSchema, kudosSchema, shadowLogSchema, questSchema,
  scorecardGoalSchema, glossaryTermSchema, type Story,
} from "./schema";
import { stages } from "./stages";
import { tasks } from "./tasks";
import { lessons, jobPreview } from "./modules";
import { quizzes } from "./quizzes";
import { redlineContracts, dataHandlingDrills, phishingEmail, translatorDrills, signatureStory, checklists } from "./labs";
import { sops } from "./sops";
import { personaCards } from "./personas";
import { staff } from "./staff";
import { scorecardGoals } from "./scorecard";
import { glossary } from "./glossary";
import { clients, contracts, sowTemplate } from "./demo-contracts";
import { demoData, buildDemoData, DEMO_IDS, CHECKIN_DAYS } from "./demo";
import { quizKeys } from "./server/quiz-keys";
import { redlineKeys } from "./server/redline-keys";
import { drillKeys } from "./server/drill-keys";
import { phishingKey } from "./server/phishing-key";
import { translatorRubric } from "./server/translator-rubric";
import { personaSecrets } from "./server/persona-secrets";
import { rubric } from "./server/rubric";

const unique = (xs: string[]) => new Set(xs).size === xs.length;
const staffIds = new Set(staff.map((s) => s.id));
const lessonIds = new Set(lessons.map((l) => l.id));
const parseAll = <T extends z.ZodType>(schema: T, xs: unknown[]) => xs.forEach((x) => schema.parse(x));

describe("stages", () => {
  it("has the 7 stages in order without overlap", () => {
    expect(stages).toHaveLength(7);
    parseAll(stageDefSchema, stages);
    expect(unique(stages.map((s) => s.id))).toBe(true);
    stages.forEach((s, i) => {
      expect(s.order).toBe(i);
      expect(s.endDay).toBeGreaterThanOrEqual(s.startDay);
      if (i > 0) expect(s.startDay).toBe(stages[i - 1].endDay + 1);
    });
    expect(stages.find((s) => s.id === "days8-30")?.startDay).toBe(15);
    expect(stages.map((s) => s.rankOnComplete).filter(Boolean)).toEqual(["copilot", "solo", "independent"]);
  });
});

describe("tasks", () => {
  it("are valid, unique and attached to real stages", () => {
    parseAll(taskDefSchema, tasks);
    expect(unique(tasks.map((t) => t.id))).toBe(true);
    const stageIds = new Set(stages.map((s) => s.id));
    for (const t of tasks) {
      expect(stageIds.has(t.stageId), `${t.id} stageId`).toBe(true);
      const st = stages.find((s) => s.id === t.stageId)!;
      if (t.unlockDay !== undefined) {
        expect(t.unlockDay, `${t.id} unlockDay`).toBeGreaterThanOrEqual(st.startDay);
        expect(t.unlockDay, `${t.id} unlockDay`).toBeLessThanOrEqual(st.endDay);
      }
    }
    for (const s of stages) expect(tasks.some((t) => t.stageId === s.id), s.id).toBe(true);
  });

  it("uses the ids Natalie's trophy map expects", () => {
    const ids = new Set(tasks.map((t) => t.id));
    for (const id of ["day1-best-self", "day1-three-things", "wt-pipeline-solo", "lab-redline", "lab-signature-story", "lab-phish-email", "lab-data-handling", "mission-fix-sop"]) expect(ids.has(id), id).toBe(true);
  });

  it("covers every C5 item", () => {
    const hrefs = tasks.map((t) => t.href);
    for (const wt of WALKTHROUGH_IDS) for (const mode of ["watch", "guided", "solo"]) expect(hrefs, `${wt} ${mode}`).toContain(`/contracts?walkthrough=${wt}&mode=${mode}`);
    for (const p of ["bank-ciso", "procurement-officer", "sme-owner-breach"]) expect(hrefs).toContain(`/practice/roleplay?persona=${p}`);
    for (const h of ["/certification", "/people", "/people/matcher", "/me/story", "/pulse/7", "/pulse/30", "/pulse/90", "/checklist/paperwork", "/checklist/security-setup", "/learn/job-preview", "/missions/fix-one-sop", "/labs/redline-lab", "/labs/signature-story", "/labs/data-handling-drills", "/labs/phishing-sim", "/review/scorecard-agree", "/review/qa-sampling", "/review/programme-review"]) expect(hrefs, h).toContain(h);
    const weeks = tasks.find((t) => t.id === "wk-quiz")!;
    expect(weeks.passScore).toBe(80);
  });

  it("have hrefs that resolve to real content", () => {
    const quizIds = new Set(quizzes.map((q) => q.id));
    const learnIds = new Set([...lessonIds, jobPreview.id]);
    const personaIds = new Set(personaCards.map((p) => p.id));
    for (const t of tasks) {
      expect(HREF_PATTERNS.some((p) => p.test(t.href)), t.href).toBe(true);
      let m: RegExpMatchArray | null;
      if ((m = t.href.match(/^\/learn\/(.+)$/))) expect(learnIds.has(m[1]), t.href).toBe(true);
      if ((m = t.href.match(/^\/quiz\/(.+)$/))) { expect(quizIds.has(m[1]), t.href).toBe(true); expect(quizzes.find((q) => q.id === m![1])!.stageId, `${t.id} quiz stage`).toBe(t.stageId); }
      if ((m = t.href.match(/^\/labs\/(.+)$/))) expect((LAB_IDS as readonly string[]).includes(m[1]), t.href).toBe(true);
      if ((m = t.href.match(/^\/checklist\/(.+)$/))) expect((CHECKLIST_IDS as readonly string[]).includes(m[1]), t.href).toBe(true);
      if ((m = t.href.match(/persona=(.+)$/))) expect(personaIds.has(m[1] as never), t.href).toBe(true);
      if ((m = t.href.match(/walkthrough=([a-z-]+)&/))) expect((WALKTHROUGH_IDS as readonly string[]).includes(m[1]), t.href).toBe(true);
    }
  });
});

function checkStory(story: Story) {
  storySchema.parse(story);
  const ids = story.nodes.map((n) => n.id);
  expect(unique(ids)).toBe(true);
  expect(ids).toContain(story.startNodeId);
  const seen = new Set<string>();
  const walk = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    const n = story.nodes.find((x) => x.id === id)!;
    for (const c of n.choices) { expect(ids, `${story.id}: ${c.id} -> ${c.nextId}`).toContain(c.nextId); walk(c.nextId); }
  };
  walk(story.startNodeId);
  expect([...seen].sort()).toEqual([...ids].sort()); // all nodes reachable
  for (const n of story.nodes) {
    if (n.ending) expect(n.choices, `${n.id} ending has no choices`).toHaveLength(0);
    else expect(n.choices.length, `${n.id} needs a choice`).toBeGreaterThanOrEqual(1);
    expect(unique(n.choices.map((c) => c.id))).toBe(true);
  }
  expect(story.nodes.some((n) => n.ending?.kind === "good")).toBe(true);
}

describe("lessons and stories", () => {
  it("has the required lessons, valid and unique", () => {
    parseAll(lessonSchema, lessons);
    expect(unique(lessons.map((l) => l.id))).toBe(true);
    for (const id of ["welcome-three-things", "who-beryll-serves", "engagement-lifecycle", "service-types", "incident-response-basics", "data-classification", "gdpr-nis2-for-bdms", "client-comms-standards", "escalation-matrix"]) expect(lessonIds.has(id), id).toBe(true);
    const explainers = new Set(lessons.flatMap((l) => l.sections.map((s) => s.explainer).filter(Boolean)));
    expect([...explainers].sort()).toEqual(["data-classification", "engagement-lifecycle", "incident-response", "service-types"]);
  });
  it("job preview and signature story are well-formed branching graphs", () => {
    checkStory(jobPreview);
    checkStory(signatureStory);
    // the signature story has exactly one passing ending
    expect(signatureStory.nodes.filter((n) => n.ending?.kind === "good").map((n) => n.id)).toEqual(["end-signed"]);
    expect(jobPreview.nodes.some((n) => /angry|furious/i.test(n.body))).toBe(true);
    expect(jobPreview.nodes.some((n) => /procurement/i.test(n.body))).toBe(true);
  });
});

describe("quizzes", () => {
  it("are valid, sized 8-12, and every question has a matching key", () => {
    parseAll(quizSchema, quizzes);
    parseAll(quizKeySchema, quizKeys);
    expect(quizzes).toHaveLength(7);
    expect(new Set(quizzes.map((q) => q.stageId)).size).toBe(7);
    const qids = quizzes.flatMap((q) => q.questions.map((x) => x.id));
    expect(unique(qids)).toBe(true);
    expect(quizKeys.map((k) => k.quizId).sort()).toEqual(quizzes.map((q) => q.id).sort());
    for (const quiz of quizzes) {
      const key = quizKeys.find((k) => k.quizId === quiz.id)!;
      expect(key.items.map((i) => i.questionId)).toEqual(quiz.questions.map((q) => q.id));
      for (const q of quiz.questions) {
        const k = key.items.find((i) => i.questionId === q.id)!;
        const opt = q.options.map((o) => o.id);
        expect(unique(opt)).toBe(true);
        for (const c of k.correct) expect(opt, `${q.id} correct ${c}`).toContain(c);
        if (q.type === "single") expect(k.correct, q.id).toHaveLength(1);
        if (q.type === "multi") expect(k.correct.length, q.id).toBeGreaterThanOrEqual(2);
        if (q.type === "ordering") expect([...k.correct].sort(), q.id).toEqual([...opt].sort());
        if (k.reviewModuleId) expect(lessonIds.has(k.reviewModuleId), `${q.id} reviewModuleId`).toBe(true);
      }
    }
  });
  it("public quiz data carries no answers", () => {
    const json = JSON.stringify(quizzes);
    expect(json).not.toMatch(/"correct"|"explanation"/);
  });
});

describe("labs", () => {
  it("redline contracts and keys line up", () => {
    parseAll(redlineContractSchema, redlineContracts);
    parseAll(redlineKeySchema, redlineKeys);
    expect(redlineContracts).toHaveLength(3);
    expect(redlineContracts.map((c) => c.docType).sort()).toEqual(["DPA", "MSA", "SOW"]);
    for (const c of redlineContracts) {
      const key = redlineKeys.find((k) => k.contractId === c.id)!;
      expect(key, c.id).toBeDefined();
      const clauseIds = c.clauses.map((x) => x.id);
      expect(unique(clauseIds)).toBe(true);
      for (const r of key.risks) expect(clauseIds).toContain(r.clauseId);
      for (const s of key.safeClauseIds) { expect(clauseIds).toContain(s); expect(key.risks.some((r) => r.clauseId === s)).toBe(false); }
      expect(unique(key.risks.map((r) => r.clauseId))).toBe(true);
    }
    const categories = new Set(redlineKeys.flatMap((k) => k.risks.map((r) => r.category)));
    for (const needed of ["liability", "authorisation", "data_transfer", "payment", "scope_change", "auto_renewal"]) expect(categories.has(needed as never), needed).toBe(true);
  });
  it("data-handling drills: 12, keyed, with real SOPs", () => {
    parseAll(drillPublicSchema, dataHandlingDrills);
    parseAll(drillKeySchema, drillKeys);
    expect(dataHandlingDrills).toHaveLength(12);
    const sopIds = new Set(sops.map((s) => s.id));
    for (const d of dataHandlingDrills) {
      const k = drillKeys.find((x) => x.drillId === d.id)!;
      expect(d.options.map((o) => o.id)).toContain(k.correctOptionId);
      expect(sopIds.has(k.sopId), k.sopId).toBe(true);
    }
    expect(JSON.stringify(dataHandlingDrills)).not.toMatch(/correctOptionId|explanation/);
  });
  it("checklists, phishing email and translator drills", () => {
    parseAll(checklistSchema, checklists);
    expect(checklists.map((c) => c.id).sort()).toEqual([...CHECKLIST_IDS].sort());
    phishingEmailSchema.parse(phishingEmail);
    phishingKeySchema.parse(phishingKey);
    expect(phishingKey.emailId).toBe(phishingEmail.id);
    translatorPublicSchema.parse(translatorDrills);
    translatorRubricSchema.parse(translatorRubric);
    expect(translatorRubric.findings.map((f) => f.findingId)).toEqual(translatorDrills.findings.map((f) => f.id));
    expect(translatorRubric.asks.map((a) => a.askId)).toEqual(translatorDrills.asks.map((a) => a.id));
    expect(checklists.find((c) => c.id === "security-setup")!.items.map((i) => i.id)).toEqual(["mfa", "password-manager", "device-encryption", "clean-desk", "report-phish"]);
  });
});

describe("personas and rubric", () => {
  it("every persona has a card and secrets; none leak", () => {
    parseAll(personaCardSchema, personaCards);
    parseAll(personaSecretSchema, personaSecrets);
    expect(personaCards.map((p) => p.id).sort()).toEqual([...PERSONA_IDS].sort());
    expect(personaSecrets.map((p) => p.personaId).sort()).toEqual([...PERSONA_IDS].sort());
    expect(personaCards.filter((p) => p.kind === "certification").map((p) => p.id)).toEqual(["cert-healthtech"]);
    const json = JSON.stringify(personaCards);
    expect(json).not.toMatch(/hiddenGoals|objections|trapsForTheHire/);
  });
  it("rubric has all six criteria with 1-5 descriptors and weights summing to 100", () => {
    rubricSchema.parse(rubric);
    expect(rubric.criteria.map((c) => c.id).sort()).toEqual([...RUBRIC_CRITERIA].sort());
    expect(rubric.criteria.reduce((n, c) => n + c.weight, 0)).toBe(100);
    expect(rubric.passThreshold).toBe(tasks.find((t) => t.id === "d30-certification")!.passScore);
  });
});

describe("sops", () => {
  it("are valid, owned by real staff, and cover the brief", () => {
    parseAll(sopSchema, sops);
    expect(sops.length).toBeGreaterThanOrEqual(15);
    expect(unique(sops.map((s) => s.id))).toBe(true);
    for (const s of sops) expect(staffIds.has(s.owner), `${s.id} owner`).toBe(true);
    for (const id of ["scoping-call", "sow-template-rules", "approval-pipeline", "authorisation-to-test", "escalation-matrix", "client-comms-tone", "incident-client-comms", "data-classification-policy", "gdpr-dpa-checklist", "nis2-quick-guide", "pricing-discount-authority", "crm-hygiene", "renewals", "tender-rfp-process", "onboarding-buddy-guide"]) expect(sops.some((s) => s.id === id), id).toBe(true);
    const pipeline = sops.find((s) => s.id === "approval-pipeline")!.body;
    expect(pipeline).toMatch(/Draft, Legal Review, Engineer Sign-off, Sent to Client, Signed/);
  });
});

describe("staff", () => {
  it("has 12 people with real interest overlaps, including Daniel the golfer", () => {
    parseAll(staffSchema, staff);
    expect(staff).toHaveLength(12);
    expect(unique(staff.map((s) => s.id))).toBe(true);
    const daniel = staff.find((s) => s.name === "Daniel Mensah")!;
    expect(daniel.title).toBe("Head of Offensive Security");
    expect(daniel.interests).toContain("golf");
    expect(daniel.availabilityNote).toMatch(/Saturday/);
    const all = new Set<string>(INTERESTS);
    for (const s of staff) {
      s.interests.forEach((i) => expect(all.has(i), `${s.name} ${i}`).toBe(true));
      expect(staff.some((o) => o.id !== s.id && o.interests.some((i) => s.interests.includes(i)))).toBe(true);
    }
    expect(new Set(staff.flatMap((s) => s.interests)).size).toBe(INTERESTS.length); // every listed interest is used
    expect(staff.filter((s) => s.interests.includes("golf")).length).toBeGreaterThanOrEqual(3);
    expect(new Set(staff.map((s) => s.team)).size).toBe(6);
  });
});

describe("scorecard and glossary", () => {
  it("scorecard has goals for each horizon", () => {
    parseAll(scorecardGoalSchema, scorecardGoals);
    expect(unique(scorecardGoals.map((g) => g.id))).toBe(true);
    for (const h of [30, 60, 90]) expect(scorecardGoals.some((g) => g.horizon === h)).toBe(true);
  });
  it("glossary has ~40 unique terms", () => {
    parseAll(glossaryTermSchema, glossary);
    expect(glossary.length).toBeGreaterThanOrEqual(40);
    expect(unique(glossary.map((g) => g.id))).toBe(true);
    expect(unique(glossary.map((g) => g.term.toLowerCase()))).toBe(true);
  });
});

describe("demo data", () => {
  it("contracts mini-app data is consistent", () => {
    parseAll(clientSchema, clients);
    parseAll(contractSchema, contracts);
    sowTemplateSchema.parse(sowTemplate);
    expect(clients).toHaveLength(8);
    expect(contracts).toHaveLength(10);
    expect(unique(contracts.map((c) => c.id))).toBe(true);
    const clientIds = new Set(clients.map((c) => c.id));
    for (const c of contracts) {
      expect(clientIds.has(c.clientId)).toBe(true);
      expect(clients.find((x) => x.id === c.clientId)!.name).toBe(c.client);
      expect(staffIds.has(c.ownerId)).toBe(true);
      expect(staff.find((s) => s.id === c.ownerId)!.name).toBe(c.owner);
      expect(unique(c.clauses.map((x) => x.id)), c.id).toBe(true);
    }
    expect(new Set(contracts.map((c) => c.status)).size).toBe(5);
    expect(new Set(contracts.map((c) => c.type)).size).toBe(5);
    expect(sowTemplate.clauses.length).toBe(12);
    expect(sowTemplate.clauses.some((c) => c.optional)).toBe(true);
    expect(sowTemplate.clauses.find((c) => c.id === "authorisation")).toBeDefined();
  });

  it("accounts and the five dummy hires", () => {
    parseAll(demoAccountSchema, demoData.accounts);
    expect(demoData.accounts.map((a) => a.email)).toEqual(["hire@beryll.demo", "manager@beryll.demo", "buddy@beryll.demo"]);
    expect(demoData.alex.profile.name).toBe("Alex Byrne");
    expect(demoData.accounts[1].profile.name).toBe("Siobhán Kelly");
    expect(demoData.accounts[2].profile.name).toBe("Marco Rossi");
    expect(demoData.hires.map((h) => h.profile.name.split(" ")[0])).toEqual(["Aoife", "Luca", "Sofia", "Tomás", "Nadia"]);
    expect(demoData.hires.map((h) => h.programDay)).toEqual([0, 9, 22, 45, 78]);
    const taskIds = new Set(tasks.map((t) => t.id));
    const profileIds = new Set([...Object.values(DEMO_IDS)]);
    for (const h of [demoData.alex, ...demoData.hires]) {
      expect(h.profile.managerId).toBe(DEMO_IDS.manager);
      expect(profileIds.has(h.profile.id as never)).toBe(true);
      parseAll(taskProgressSchema, h.taskProgress);
      parseAll(pulseSchema, h.pulses);
      parseAll(checkInSchema, h.checkIns);
      parseAll(xpEventSchema, h.xpEvents);
      parseAll(kudosSchema, h.kudos);
      parseAll(shadowLogSchema, h.shadowLogs);
      parseAll(questSchema, h.quests);
      expect(h.taskProgress.map((p) => p.taskId).sort()).toEqual([...taskIds].sort()); // one row per task
      expect(h.checkIns.map((c) => c.dueDay)).toEqual([...CHECKIN_DAYS]);
      for (const p of h.taskProgress) { expect(p.hireId).toBe(h.profile.id); if (p.status === "done") expect(p.completedAt).toBeDefined(); }
      for (const x of h.xpEvents) expect(taskIds.has(x.source)).toBe(true);
      for (const k of h.kudos) expect(staffIds.has(k.fromId) || profileIds.has(k.fromId as never)).toBe(true);
      for (const s of h.shadowLogs) expect(staffIds.has(s.withStaffId)).toBe(true);
      for (const q of h.quests) expect(staffIds.has(q.withStaffId)).toBe(true);
      expect(unique(h.shadowLogs.map((s) => s.id))).toBe(true);
    }
    expect(demoData.alex.taskProgress.every((p) => p.status !== "done")).toBe(true);
    expect(demoData.alex.taskProgress.filter((p) => p.status === "available").length).toBe(tasks.filter((t) => t.stageId === "preboarding").length);
    const [aoife, luca, sofia, tomas, nadia] = demoData.hires;
    const st = (h: typeof aoife, id: string) => h.taskProgress.find((p) => p.taskId === id)!.status;
    expect(st(aoife, "pre-job-preview")).toBe("done");
    expect(st(aoife, "day1-best-self")).toBe("locked");
    expect(st(luca, "day1-best-self")).toBe("done");
    expect(st(luca, "wk-shadow-log")).toBe("in_progress");
    expect(st(luca, "d30-certification")).toBe("locked");
    expect(st(sofia, "d30-certification")).toBe("in_progress");
    expect(st(sofia, "wt-pipeline-solo")).toBe("done");
    expect(st(tomas, "d30-certification")).toBe("done");
    expect(st(tomas, "mission-fix-sop")).toBe("in_progress");
    expect(st(nadia, "d60-qa-sampling")).toBe("done");
    // Nadia is at risk: belonging pulse <= 2 and a missed check-in more than 3 days overdue
    expect(nadia.pulses.some((p) => p.belonging <= 2)).toBe(true);
    const overdue = nadia.checkIns.filter((c) => c.dueDay <= nadia.programDay - 4 && !c.heldAt);
    expect(overdue.map((c) => c.dueDay)).toEqual([70]);
    for (const h of [luca, sofia, tomas]) expect(h.checkIns.filter((c) => c.dueDay <= h.programDay - 4 && !c.heldAt)).toHaveLength(0);
    // only pulses that have fallen due exist
    for (const h of demoData.hires) for (const p of h.pulses) expect(p.day).toBeLessThanOrEqual(h.programDay);
  });

  it("buildDemoData is relative to the date it is given", () => {
    const d = buildDemoData("2027-02-10");
    expect(d.hires[1].profile.startDate).toBe("2027-02-02"); // Luca, day 9
    expect(d.hires[4].profile.startDate).toBe("2026-11-25"); // Nadia, day 78
    expect(d.alex.profile.startDate).toBe("2027-02-11"); // day 0 = the day before start
  });
});

describe("server-only separation", () => {
  const root = __dirname;
  const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? (e.name === "walkthroughs" ? [] : walk(p)) : p.endsWith(".ts") ? [p] : [];
  });
  const files = walk(root);
  it("every file under content/server starts with import \"server-only\"", () => {
    const server = files.filter((f) => f.includes(`${path.sep}server${path.sep}`));
    expect(server.length).toBeGreaterThanOrEqual(8);
    for (const f of server) expect(fs.readFileSync(f, "utf8").trimStart().startsWith('import "server-only"'), f).toBe(true);
  });
  it("no public content file imports from content/server", () => {
    for (const f of files.filter((x) => !x.includes(`${path.sep}server${path.sep}`) && !x.endsWith(".test.ts"))) {
      expect(fs.readFileSync(f, "utf8"), f).not.toMatch(/from\s+["'][^"']*\/server(\/|["'])/);
    }
  });
});
