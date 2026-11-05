import type { Lesson } from "../schema";

export const welcomeFromYourTeam: Lesson = {
  id: "welcome-from-your-team",
  title: "Welcome from your manager and buddy",
  summary: "Two short messages from the people who will look after you, and what your first morning looks like.",
  estMinutes: 5,
  sections: [
    {
      heading: "A message from Siobhán, your manager",
      body: "> [Video placeholder: 90 seconds from Siobhán Kelly, Head of Commercial]\n\n*Transcript draft:* \"Hi, and welcome. You are joining at a good time. Over the next ninety days I will not ask you to know everything. I will ask you to learn the business in the right order, be honest when you are stuck, and tell me how it is going. We will meet on your first day, at the end of week one, and then every two weeks. Nobody here expects you to be perfect in week one.\"",
    },
    {
      heading: "A message from Marco, your buddy",
      body: "> [Video placeholder: 60 seconds from Marco Rossi, Senior Security Consultant]\n\n*Transcript draft:* \"Ciao, I am Marco. I am your buddy, which means I do not sit in your reporting line. Ask me the questions that feel too small for your manager: where to get lunch, how to read a pentest report, why engineers get quiet when you say 'quick change to scope'. I will message you on day one.\"",
      callout: { tone: "tip", text: "Your buddy gets a prompt twice a week to check in with you. If they forget, nudge them. It is part of their job." },
    },
    {
      heading: "Your first morning",
      body: "- **09:00** Elena (Operations) meets you at reception with your laptop. It will already be encrypted.\n- **09:30** Coffee with Marco.\n- **10:30** Short welcome with Siobhán.\n- **11:30** Your Three Things card, then lunch with the commercial team.\n- **Afternoon** Write your Best Self story. That is the only thing you have to finish today.\n\nIf you work from home on day one, the same plan applies on video, and Elena posts the laptop in advance.",
    },
  ],
};
