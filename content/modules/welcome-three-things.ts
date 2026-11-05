import type { Lesson } from "../schema";

export const welcomeThreeThings: Lesson = {
  id: "welcome-three-things",
  title: "Your Three Things",
  summary: "Who we serve, what good looks like, and who to ask. Nothing else is required on day one.",
  estMinutes: 6,
  sections: [
    {
      heading: "1. Who we serve",
      body: "Beryll helps organisations across Europe find and fix security weaknesses before attackers do. Our clients are mostly mid-sized: credit unions and banks, logistics firms, health-tech start-ups, online retailers and charities. They are rarely security experts. They want to know three things: are we exposed, what do we fix first, and can we prove to our customers and regulators that we took care.\n\nYou are the person who makes that conversation easy.",
    },
    {
      heading: "2. What good looks like",
      body: "A good BDM at Beryll does four things consistently:\n\n- **Scopes honestly.** What we promise is what engineers can deliver.\n- **Never lets testing start without a signed authorisation.** No exceptions.\n- **Explains in plain English.** A CEO should understand a finding in one read.\n- **Escalates early.** Asking legal or an engineer on day two is a strength, not a weakness.",
      callout: { tone: "rule", text: "We never test a system without a signed authorisation from someone who has the right to give it." },
    },
    {
      heading: "3. Who to ask",
      body: "| Question about | Ask |\n|---|---|\n| Anything at all, no matter how small | Marco, your buddy |\n| Priorities, goals, how you are doing | Siobhán, your manager |\n| A clause or a legal worry | Amara Okafor, Legal and Contracts Counsel |\n| What an engineer meant | Daniel Mensah, Head of Offensive Security, or Jonas Weber |\n| Laptop, access, desk | Elena Popescu, Operations |\n| Where a process is written down | **Ask Beryl** in the app, or the SOP hub |",
      callout: { tone: "tip", text: "If you are not sure who to ask, ask Marco. He will point you to the right person." },
    },
  ],
};
