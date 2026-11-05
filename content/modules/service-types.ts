import type { Lesson } from "../schema";

export const serviceTypes: Lesson = {
  id: "service-types",
  title: "Pentest, scan, red team, SOC, audit",
  summary: "What each service is, when to recommend it, and what each one is not.",
  estMinutes: 12,
  sections: [
    {
      heading: "Five services at a glance",
      body: "Watch the comparison first. Clients mix these up constantly, and a wrong word in a SOW leads to the wrong expectations.",
      explainer: "service-types",
    },
    {
      heading: "Penetration test vs vulnerability scan",
      body: "A **vulnerability assessment** (or scan) uses tools to find known weaknesses across many systems quickly. It is broad, cheaper and often recurring. It lists problems; it does not prove they can be exploited.\n\nA **penetration test** is a person, using tools and judgement, trying to break in the way a real attacker would. It is deeper, narrower and more expensive. It proves what an attacker could actually do.",
      callout: { tone: "example", text: "A scan says, \"This door might be unlocked.\" A pentest says, \"I opened it, walked to the finance office, and read the payroll file.\"" },
    },
    {
      heading: "Red team",
      body: "A **red team** exercise is a goal-led simulation of a determined attacker, often over weeks, usually without most staff knowing. It tests people and detection as much as technology: \"Can we get to the customer database without being noticed?\" It is not a bigger pentest and it is not for clients who have never had one. Recommend it only to mature clients, and confirm the authorisation chain very carefully.",
    },
    {
      heading: "Managed SOC",
      body: "A **security operations centre** (SOC) watches a client's systems around the clock, spots suspicious behaviour and responds. It is a recurring service, billed monthly. It is defence, not testing. It will not tell you where your weaknesses are; it tells you when someone is trying to use them.",
    },
    {
      heading: "Security audit and compliance readiness",
      body: "An **audit** compares what a client does against a standard or law: ISO 27001, GDPR, NIS2. It looks at policies, processes and evidence, not only technology. Beryll's GRC team does **readiness** work, helping clients prepare before an external certification audit. We do not certify; accredited bodies do.\n\nAwareness training sits alongside all of this: staff are often the first line of defence and the first target.",
      callout: { tone: "tip", text: "When a client says \"we need a pentest because of ISO 27001,\" ask what the auditor actually asked for. Often it is a vulnerability assessment plus a policy review." },
    },
  ],
};
