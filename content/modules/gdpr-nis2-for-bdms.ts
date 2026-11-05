import type { Lesson } from "../schema";

export const gdprNis2ForBdms: Lesson = {
  id: "gdpr-nis2-for-bdms",
  title: "GDPR and NIS2 for BDMs",
  summary: "The parts of European law you will meet in almost every contract, and when to bring in legal.",
  estMinutes: 12,
  sections: [
    {
      heading: "You are not the lawyer",
      body: "You do not need to interpret the law. You need to recognise when it is in play, ask the right question, and escalate. This lesson gives you the vocabulary.",
    },
    {
      heading: "GDPR in five lines",
      body: "- The **GDPR** protects personal data of people in the EU.\n- Whoever decides why and how personal data is used is the **controller**. Whoever handles it on their behalf is the **processor**. In most engagements the client is the controller and Beryll is a processor.\n- A processor needs a **data processing agreement (DPA)** with the controller. We use ours or review theirs with legal.\n- Personal data may leave the EU/EEA only with a lawful safeguard: an adequacy decision, **standard contractual clauses (SCCs)**, or similar. A transfer with nothing in place is a red flag.\n- A **personal-data breach** must be reported to the supervisory authority (in Ireland, the Data Protection Commission) within 72 hours of becoming aware.",
      callout: { tone: "example", text: "A client contract says Beryll may store report data \"on servers anywhere in the world.\" That is a transfer problem. Flag it and send it to Amara." },
    },
    {
      heading: "Why pentesting touches personal data",
      body: "During a test an engineer may see customer records, staff emails or logs. Beryll treats this as incidental access and keeps it to the minimum. The DPA should say so, and the SOW should set limits: for instance, no downloading of real customer data beyond a small proof sample, and secure deletion at the end.",
    },
    {
      heading: "NIS2 in plain English",
      body: "**NIS2** is the EU directive on network and information security. It covers \"essential\" and \"important\" entities in sectors such as energy, transport, banking, health, digital infrastructure, ICT service management and some manufacturing and food businesses. Member states, including Ireland, implement it through national law.\n\nWhat it asks of in-scope organisations:\n\n- Risk management measures, including supply-chain security, vulnerability handling and regular testing.\n- Incident reporting: an early warning within **24 hours**, a fuller notification within **72 hours**, and a final report after a month.\n- Management accountability: the board can be held responsible.\n\nFor Beryll this is good news: clients need assessments and monitoring to show they are meeting these duties. Beryll may itself be in scope as an ICT service provider, so we also follow the rules.",
      callout: { tone: "tip", text: "Ask every prospect: \"Are you in scope for NIS2, or a supplier to someone who is?\" The answer shapes the whole conversation." },
    },
    {
      heading: "When to bring in legal",
      body: "Escalate to Amara Okafor whenever a contract has: unlimited or very high liability, an indemnity beyond the standard, data transfers outside the EU/EEA, a missing or unusual DPA, subprocessors we have not approved, or any clause you cannot explain in a sentence. See the escalation matrix and the GDPR DPA checklist SOP.",
    },
  ],
};
