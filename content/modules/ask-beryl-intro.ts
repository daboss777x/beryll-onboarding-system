import type { Lesson } from "../schema";

export const askBerylIntro: Lesson = {
  id: "ask-beryl-intro",
  title: "Meet Ask Beryl",
  summary: "Your SOP coach: it answers only from our own documents, cites them, and tells you when to ask a human.",
  estMinutes: 4,
  sections: [
    {
      heading: "What it is",
      body: "Ask Beryl is a chat helper that reads Beryll's SOPs. Ask it \"What is the approval pipeline?\" or \"Who can approve a 15% discount?\" and it answers in plain English, with a link to the SOP it used.",
    },
    {
      heading: "What it will not do",
      body: "It will not guess. If the answer is not in the SOPs it says so and suggests who to ask, such as your buddy Marco. It does not replace people. Never paste client names, report contents or personal data into it.",
      callout: { tone: "rule", text: "Treat Ask Beryl as a map to the SOPs, not as the SOP. Check the source it cites before acting on anything that affects a client." },
    },
  ],
};
