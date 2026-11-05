import type { Lesson } from "../schema";

export const dataClassification: Lesson = {
  id: "data-classification",
  title: "Data classification",
  summary: "Four labels, and what each one lets you do with a report, a screenshot or a spreadsheet.",
  estMinutes: 8,
  sections: [
    {
      heading: "Why labels matter",
      body: "Everything we hold about a client is sensitive in some way: network diagrams, vulnerability lists, credentials found during a test. If it leaked, it would help an attacker. The classification label tells you instantly how to handle a piece of information.",
      explainer: "data-classification",
    },
    {
      heading: "The four labels",
      body: "| Label | Examples | What you may do |\n|---|---|---|\n| **Public** | Website copy, published case studies | Share freely |\n| **Internal** | Internal SOPs, org chart, pricing sheet | Share inside Beryll only |\n| **Confidential** | Contracts, SOWs, client contact lists, scoping notes | Share with named people at Beryll and the client, through approved channels |\n| **Restricted** | Pentest reports, vulnerability lists, credentials, network details, personal data | Named recipients only, encrypted, approved secure transfer, never to personal accounts |",
      callout: { tone: "rule", text: "A pentest report is Restricted. Always. It goes only to named client recipients, through the secure portal or encrypted transfer." },
    },
    {
      heading: "Everyday habits",
      body: "- Put the label in the header or the file name.\n- Send Restricted material through the approved transfer, and send the password by a different channel.\n- Never use personal email, personal cloud storage or messaging apps for Confidential or Restricted material.\n- Do not paste client details into public AI tools or online translators.\n- Lock your screen. Keep a clean desk. Do not discuss clients in public places.\n- If you are not sure of the label, treat it as the higher one and ask.",
      callout: { tone: "tip", text: "When in doubt, ask: \"If this ended up on the internet tomorrow, who would be harmed?\" The bigger the answer, the higher the label." },
    },
  ],
};
