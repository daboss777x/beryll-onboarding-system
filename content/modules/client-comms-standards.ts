import type { Lesson } from "../schema";

export const clientCommsStandards: Lesson = {
  id: "client-comms-standards",
  title: "Client communication standards",
  summary: "Tone, speed and clarity, including how to deliver bad news without alarming people.",
  estMinutes: 8,
  sections: [
    {
      heading: "The standard",
      body: "- **Reply within one working day**, even if the reply is \"I have seen this; I will have an answer by Thursday.\"\n- **Plain English.** Short sentences. Explain every acronym the first time.\n- **One ask per email**, with a clear next step and a date.\n- **Say what you know, what you do not know, and when you will update.**\n- **Warm, calm, professional.** No drama, no jargon to sound clever, no blame.",
    },
    {
      heading: "Delivering a hard message",
      body: "When a critical finding lands, the client may be frightened or angry. Use this order:\n\n1. Acknowledge: \"I understand this is worrying.\"\n2. State the fact simply: \"The test found that someone outside the company could reach customer records through the login page.\"\n3. Say what is being done: \"The engineer has already written the fix and can walk your developers through it today.\"\n4. Give the next step and time: \"I will call you at 3pm after you have read the summary.\"",
      callout: { tone: "example", text: "Not: \"There's a critical SQL injection with a CVSS of 9.8.\"\nBut: \"We found a serious flaw in the login page that would let an outsider read customer records. It can be fixed in a day. Here is what we recommend.\"" },
    },
    {
      heading: "Things never to say",
      body: "- \"This is nothing to worry about.\" (You do not know that.)\n- \"You have not been hacked.\" (Only an investigation can say that.)\n- \"It will be fixed by Friday.\" (Engineers set timelines.)\n- \"It's the developers' fault.\" (Blame helps nobody.)\n- Anything that guarantees you are secure. Nobody is ever 100% secure.",
      callout: { tone: "warning", text: "Do not put sensitive technical details in the body of an email. Link to the secure portal instead." },
    },
    {
      heading: "Your QA score",
      body: "In days 31 to 60 your manager scores one in five of your real emails and calls on tone, accuracy, clarity, data handling and next step. The target is an average of 4 out of 5. It is feedback, not a test.",
    },
  ],
};
