import type { Story } from "../schema";

/** "A week as a Beryll BDM": realistic job preview (research 4.4). Branching story, no wrong answers that end the game. */
export const jobPreview: Story = {
  id: "job-preview",
  title: "A week as a Beryll BDM",
  intro: "Five days, five moments. Some are routine, some are hard. Choose what you would honestly do. Nothing here is graded, and every path teaches you something about the job.",
  startNodeId: "mon",
  nodes: [
    {
      id: "mon",
      title: "Monday, 09:10",
      body: "Your inbox has three things. **A new lead:** a logistics firm wants \"a quick pentest, as cheap as possible, starting Friday.\" **A renewal** for a credit union comes due in 60 days. **A client** wants last month's report \"just emailed over\".\n\nThe lead feels urgent. How do you start?",
      choices: [
        { id: "mon-a", text: "Book a scoping call with an engineer and ask the logistics firm what triggered the request", nextId: "tue", consequence: "Good instinct. A rush usually has a reason: a customer questionnaire, an audit, or a scare. Knowing it helps you scope and price honestly.", quality: "good" },
        { id: "mon-b", text: "Send the price list and offer a discount to start on Friday", nextId: "mon-price", consequence: "You answered fast, but you have priced something nobody has defined yet.", quality: "poor" },
        { id: "mon-c", text: "Ask the engineers to pencil in testing for Friday and sort the paperwork afterwards", nextId: "mon-rush", consequence: "Jonas replies within minutes. Read on.", quality: "poor" },
      ],
    },
    {
      id: "mon-price",
      title: "Monday, 11:40",
      body: "The firm replies: \"Another vendor quoted half that. Can you match it?\" You realise you do not know what they would be getting. Marco, your buddy, sees your face: \"Want to try a scoping call first? Then the price follows the work, not the other way round.\"",
      choices: [{ id: "mon-price-a", text: "Take Marco's advice and book the scoping call", nextId: "tue", consequence: "Price follows scope. You lost an hour but kept your leverage.", quality: "ok" }],
    },
    {
      id: "mon-rush",
      title: "Monday, 09:35",
      body: "Jonas Weber, penetration tester: \"I can't touch anything on Friday without a signed authorisation. If I did and their hosting provider noticed, that is unauthorised access under the Criminal Justice (Offences Relating to Information Systems) Act. Neither of us wants that. Let's scope first.\"",
      choices: [{ id: "mon-rush-a", text: "Apologise, thank him, and book the scoping call", nextId: "tue", consequence: "Lesson learned the cheap way. The authorisation rule is not paperwork for its own sake; it is what makes our work legal.", quality: "ok" }],
    },
    {
      id: "tue",
      title: "Tuesday, 10:00: scoping call",
      body: "On the call, the logistics firm's IT lead says: \"Just test everything. We have a customer portal, a few warehouse apps, some cloud stuff. We are not sure what.\" Marco is on the line with you.",
      choices: [
        { id: "tue-a", text: "Write \"all systems\" in the SOW so the client feels covered", nextId: "tue-creep", consequence: "\"All systems\" means nobody knows what we promised.", quality: "poor" },
        { id: "tue-b", text: "Ask for a list: the portal's URLs, IP ranges, environments, testing windows, exclusions, and who owns the hosting", nextId: "wed", consequence: "You leave with a scope Marco can estimate and a checklist for the authorisation letter. The IT lead says it is the clearest scoping call they have had.", quality: "good" },
      ],
    },
    {
      id: "tue-creep",
      title: "Tuesday, 15:30",
      body: "Marco looks at the draft SOW. \"'All systems' could be 400 days of work or a hosting provider's property. We cannot sign this.\" You re-do it with the client over email, which takes a day.",
      choices: [{ id: "tue-creep-a", text: "Rewrite the scope as a clear list with exclusions", nextId: "wed", consequence: "Fixed, but the client is a day more impatient.", quality: "ok" }],
    },
    {
      id: "wed",
      title: "Wednesday, 14:00: the angry call",
      body: "A credit union client's CEO calls you. Their test found a **critical** flaw yesterday and the engineer phoned their IT lead straight away. The CEO is furious: \"You told us we were secure! Now I hear we have a critical problem? What are we paying you for?\"",
      choices: [
        { id: "wed-a", text: "Calmly acknowledge the worry, explain the finding in one plain sentence, say the fix is already underway, and offer a call with the engineer at 3pm", nextId: "thu", consequence: "The CEO exhales. \"Right. Thank you for telling me straight.\" Finding a critical issue is exactly what the test is for, and now they know.", quality: "good" },
        { id: "wed-b", text: "Remind them that nobody ever said they were fully secure and that finding problems is the point of a test", nextId: "wed-defensive", consequence: "You are technically right, which does not help.", quality: "poor" },
        { id: "wed-c", text: "Reassure them: \"Don't worry, it will be fixed by tomorrow and your data is safe\"", nextId: "wed-promise", consequence: "You wanted them to feel better. But you cannot know either of those things.", quality: "poor" },
      ],
    },
    {
      id: "wed-defensive",
      title: "Wednesday, 14:10",
      body: "\"I don't need a lecture,\" says the CEO. The call ends cold. Siobhán catches you in the corridor: \"Ring back this afternoon. Start with 'I understand why you're worried', not with 'actually'.\"",
      choices: [{ id: "wed-defensive-a", text: "Call back with empathy, a plain explanation and a next step", nextId: "thu", consequence: "The second call goes better. Tone first, facts second.", quality: "ok" }],
    },
    {
      id: "wed-promise",
      title: "Wednesday, 14:10",
      body: "An hour later the lead engineer messages you: \"The fix needs a change freeze approved on their side, which is Friday at the earliest. And we have not yet checked whether the flaw was already used.\" You have promised \"tomorrow\" and \"safe\".",
      choices: [{ id: "wed-promise-a", text: "Call the CEO, own the mistake, give the real timeline and offer a daily update", nextId: "thu", consequence: "Painful, but honest corrections build trust. Next time, say what you know, what you do not, and when you will update.", quality: "ok" }],
    },
    {
      id: "thu",
      title: "Thursday, 11:00: price pressure",
      body: "The logistics firm's procurement officer calls: \"Our budget approval is for 25% less than your quote. Drop 25%, and we do not need the retest.\" You have authority to discount up to 5%. The deadline is tight.",
      choices: [
        { id: "thu-a", text: "Agree to 25% to win the deal", nextId: "fri", consequence: "You have given away margin you could not authorise, and a pentest without a retest leaves the client with unproven fixes.", quality: "poor" },
        { id: "thu-b", text: "Hold the line, offer options (a smaller scope or a phased plan), keep the retest, and tell them you will check anything above 5% with your Head of Commercial", nextId: "fri", consequence: "Procurement respects a clear boundary with options. They ask for the phased plan.", quality: "good" },
        { id: "thu-c", text: "Say the price is final and end the call", nextId: "fri", consequence: "Clear, but you gave them nothing to say yes to. They are now talking to another vendor.", quality: "ok" },
      ],
    },
    {
      id: "fri",
      title: "Friday, 16:00",
      body: "The week is nearly over. You have an authorisation letter half-drafted, notes from five conversations, and a CRM that is out of date.",
      choices: [
        { id: "fri-a", text: "Update the CRM, send the authorisation draft to legal, and debrief the week with Marco", nextId: "end-good", consequence: "Everything is where the team can find it. Marco asks one good question about Wednesday.", quality: "good" },
        { id: "fri-b", text: "Go home and sort it on Monday", nextId: "end-mixed", consequence: "Nothing is wrong yet. But Monday starts behind.", quality: "poor" },
      ],
    },
    {
      id: "end-good",
      title: "The end of the week",
      body: "You scoped before you priced, handled an angry client without defending yourself, held a boundary and left a clean trail for colleagues.",
      choices: [],
      ending: { kind: "good", summary: "A strong first week. Notice how many of your wins came from asking, escalating and writing things down.", lesson: "The job is less about selling and more about being the calm, organised bridge between clients and engineers." },
    },
    {
      id: "end-mixed",
      title: "The end of the week",
      body: "The week went well in places. The good habits (scoping, empathy, boundaries) matter, and so does the small admin that makes them visible to others.",
      choices: [],
      ending: { kind: "mixed", summary: "A decent week with loose ends.", lesson: "CRM hygiene and handovers feel boring and prevent most avoidable mistakes." },
    },
  ],
};
