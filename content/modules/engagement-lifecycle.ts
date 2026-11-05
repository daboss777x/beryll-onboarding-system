import type { Lesson } from "../schema";

export const engagementLifecycle: Lesson = {
  id: "engagement-lifecycle",
  title: "The engagement lifecycle",
  summary: "From first conversation to renewal: eight steps, who owns each, and where things go wrong.",
  estMinutes: 10,
  sections: [
    {
      heading: "The eight steps",
      body: "Every Beryll engagement follows the same path. Watch the animation, then read the notes below.",
      explainer: "engagement-lifecycle",
    },
    {
      heading: "1-3: Lead, scoping, SOW",
      body: "**Lead.** A client asks for help, or you find one. Qualify it: who decides, what budget, what deadline, what triggered it?\n\n**Scoping.** You run a scoping call with an engineer. You capture the systems in scope (IP ranges, applications, environments), testing windows, exclusions and contacts. You leave with enough detail for the engineer to estimate days.\n\n**SOW.** You turn the scope into a statement of work from the approved template. It goes through the approval pipeline: Draft, Legal Review, Engineer Sign-off, Sent to Client, Signed.",
      callout: { tone: "warning", text: "A SOW cannot be sent without engineer sign-off, and any non-standard clause needs legal first." },
    },
    {
      heading: "4: Authorisation",
      body: "Before a single packet is sent, the client signs an authorisation-to-test letter (also called rules of engagement). It states exactly what may be tested, when, from which IP addresses, and who to call if something breaks. The person signing must have the authority to grant it over those systems. If the systems are hosted by a third party, such as a cloud provider or managed host, check whether their permission is also needed.",
      callout: { tone: "rule", text: "No signed authorisation, no testing. If you are unsure, the answer is wait." },
    },
    {
      heading: "5-8: Testing, report, retest, renewal",
      body: "**Testing.** Engineers test inside the agreed window. You keep the client updated and manage surprises, such as a critical finding mid-test (engineers call the client contact straight away).\n\n**Report.** The report is classified Confidential. You help the client understand it: an executive summary for the board, a technical section for the IT team.\n\n**Retest.** After fixes, we retest to confirm they worked. Many clients forget this; remind them.\n\n**Renewal.** Security is not a one-off. A good renewal conversation starts at the report meeting, not 60 days before the contract ends.",
    },
  ],
};
