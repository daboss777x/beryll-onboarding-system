import type { Lesson } from "../schema";

export const escalationMatrix: Lesson = {
  id: "escalation-matrix",
  title: "The escalation matrix",
  summary: "Who to call, for what, and how fast. Escalating early is the job.",
  estMinutes: 6,
  sections: [
    {
      heading: "The matrix",
      body: "| Situation | Escalate to | How fast |\n|---|---|---|\n| Live security incident at a client | SOC on-call (Katarzyna Nowak's team) | Immediately, by phone |\n| Test causing an outage, or a critical finding mid-test | The lead engineer, then Head of Offensive Security | Immediately |\n| Non-standard clause, liability, data transfer | Legal (Amara Okafor) | Same working day |\n| Client threatens to leave or complains formally | Head of Commercial (Siobhán Kelly) | Same day |\n| Discount outside your authority | Head of Commercial | Before replying |\n| Anyone asking to test without an authorisation | Head of Offensive Security and Legal | Immediately, and do not agree to anything |\n| Suspected leak of client data by Beryll | Operations and Legal (and the DPO) | Immediately |",
    },
    {
      heading: "How to escalate well",
      body: "Give the person what they need to act: who, what, when, the client's deadline, what you have already said, and what you think should happen. One short message beats a long thread.",
      callout: { tone: "tip", text: "Template: \"Client X, Y happened at HH:MM. They need Z by [time]. I have told them [what]. I think we should [action]. Can you take this?\"" },
    },
    {
      heading: "A note on courage",
      body: "People new to a company often hold back from escalating because they do not want to look inexperienced. At Beryll, the opposite is true. A late escalation is the mistake; an early one never is.",
    },
  ],
};
