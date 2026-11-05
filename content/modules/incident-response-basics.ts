import type { Lesson } from "../schema";

export const incidentResponseBasics: Lesson = {
  id: "incident-response-basics",
  title: "Incident response basics",
  summary: "The first hour of a client incident, what the engineers do, and what you must do and not do.",
  estMinutes: 10,
  sections: [
    {
      heading: "The phases",
      body: "Incident response follows a repeatable shape. Watch how it flows, then read what it means for you.",
      explainer: "incident-response",
    },
    {
      heading: "The first hour",
      body: "1. **Detect and report.** Someone notices something odd: a ransom note, strange logins, a customer complaint.\n2. **Triage.** Is it real, how bad, what is affected? The SOC or an incident engineer decides.\n3. **Contain.** Stop the spread: isolate machines, disable accounts, block traffic.\n4. **Investigate and eradicate.** Find the cause, remove the attacker.\n5. **Recover.** Restore systems safely.\n6. **Learn.** A written review and fixes.\n\nThe client is almost always panicking at step 1. Your job is to keep them calm and the information flowing.",
    },
    {
      heading: "What you do",
      body: "- Get the client to the right Beryll person fast. Use the escalation matrix: for a live incident that is the SOC on-call, who tells you what to relay.\n- Be the single point of contact for the client, so they are not getting five phone calls.\n- Take notes: who said what, and when. Times matter later.\n- Remind the client of their own obligations. Under GDPR a personal-data breach must be reported to the Data Protection Commission within **72 hours** of becoming aware. Under NIS2, in-scope entities give an early warning within **24 hours** of a significant incident. Do not give legal advice; tell them to involve their DPO or legal adviser, and offer to connect them with Amara.",
      callout: { tone: "rule", text: "You do not diagnose, you do not promise a cause, and you do not promise that data is safe. Say what we know, what we do not know yet, and when you will update them next." },
    },
    {
      heading: "What you do not do",
      body: "- Do not speculate about who the attacker is.\n- Do not forward logs or screenshots by ordinary email. Use the approved secure transfer.\n- Do not promise a timeline for recovery. Engineers give estimates; you relay them with caveats.\n- Do not sell during an incident. Offer help; discuss commercial terms later.",
    },
  ],
};
