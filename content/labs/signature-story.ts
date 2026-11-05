import type { Story } from "../schema";

/**
 * "Never test without a signature": required-pass branching story.
 * Passing = reaching the single "good" ending (end-signed). Mixed and bad endings invite a retry (passScore 100 on the task).
 * Legal references are deliberately general: unauthorised access to an information system is a criminal offence in Ireland under
 * the Criminal Justice (Offences Relating to Information Systems) Act 2017, and in every EU member state under laws implementing Directive 2013/40/EU.
 */
export const signatureStory: Story = {
  id: "signature-story",
  title: "Never test without a signature",
  intro: "It is Tuesday afternoon. A client is keen, an engineer is ready and a deadline is close. What you do in the next five minutes decides whether this is a good week or a legal incident.",
  startNodeId: "start",
  nodes: [
    {
      id: "start",
      title: "Tuesday, 16:30",
      body: "Dermot, CEO of Fernhill Retail, rings you. \"Our Black Friday site goes live on Friday. Your testers need to start on the checkout tonight. My IT manager Seán says it's fine. I'll sign the paperwork tomorrow, I promise.\" Jonas, the engineer, is already in the doorway: \"I can start tonight if you say so.\"",
      choices: [
        { id: "start-a", text: "\"Fine, let's start tonight. I'll chase the signature tomorrow.\"", nextId: "night", consequence: "You've given a verbal go-ahead without a signed authorisation. Jonas begins scanning at 20:00 from Beryll's address range.", quality: "poor" },
        { id: "start-b", text: "\"We cannot start until the authorisation is signed. I can have it in your inbox in an hour, and we could start tomorrow morning.\"", nextId: "pushback", consequence: "Dermot sighs, but you've offered a path to Friday.", quality: "good" },
      ],
    },
    {
      id: "night",
      title: "Tuesday, 22:10",
      body: "Your phone buzzes. Fernhill's hosting provider has detected an attack on its network and suspended Fernhill's site. The provider's security team has traced the traffic to Beryll and sent a formal notice. Dermot, who never signed anything, is not answering his phone. Jonas messages: \"Do I stop?\"",
      choices: [
        { id: "night-a", text: "Tell Jonas to stop immediately, then call Daniel (Head of Offensive Security) and Amara (Legal), and write down exactly what happened and when", nextId: "end-mixed", consequence: "You contain the damage. You will still face an uncomfortable conversation and a review.", quality: "ok" },
        { id: "night-b", text: "Tell Jonas to carry on and hope it blows over until Dermot calls back", nextId: "end-bad", consequence: "Testing continues for another hour while the provider logs everything.", quality: "poor" },
      ],
    },
    {
      id: "pushback",
      title: "Tuesday, 16:45",
      body: "Dermot: \"Fine, send it. But Seán can sign it tonight so we don't lose a day.\" You know Seán is the IT manager, an employee of Fernhill. You also know that Fernhill's site is hosted by a separate provider, and that the checkout page is served by a third-party payment platform.",
      choices: [
        { id: "pushback-a", text: "Accept Seán's signature; he's the IT contact and it's faster", nextId: "weak-auth", consequence: "You've accepted a signature without checking that Seán can grant permission for the hosting and the payment platform.", quality: "poor" },
        { id: "pushback-b", text: "Ask who has authority to approve testing on the site and hosting, check what the hosting provider and payment platform allow, and list exactly which systems are in scope", nextId: "check-auth", consequence: "That takes twenty minutes, and it is the most valuable twenty minutes of the week.", quality: "good" },
      ],
    },
    {
      id: "weak-auth",
      title: "Wednesday, 08:30",
      body: "Seán signed at 21:00. Jonas started at 09:00. At 11:15 the hosting provider emails Fernhill: \"Penetration tests require our prior written approval. Please stop all testing.\" Dermot is cross and Seán is embarrassed. The checkout page, which belongs to the payment platform, was never theirs to authorise.",
      choices: [
        { id: "weak-auth-a", text: "Stop testing, apologise, and restart the process properly: authority, provider approval, scope", nextId: "end-mixed", consequence: "You lose a day and some goodwill, but you stopped before the payment platform noticed.", quality: "ok" },
      ],
    },
    {
      id: "check-auth",
      title: "Tuesday, 17:30",
      body: "It turns out Dermot, as CEO, has authority over Fernhill's own application servers, but not over the payment platform's hosted checkout. The hosting provider allows testing with 48 hours' written notice. You draft an authorisation letter with: signatory and authority, exact systems and IP ranges, a testing window, source IPs, stop rules and emergency contacts.",
      choices: [
        { id: "check-auth-a", text: "Send the notice to the provider, put the hosted checkout out of scope, and have Dermot sign the letter tomorrow morning; testing begins once both are in", nextId: "scope-surprise", consequence: "Testing starts Thursday at 10:00 with everything signed. Dermot grumbles about the 48-hour wait, but he understands.", quality: "good" },
        { id: "check-auth-b", text: "Skip the notice; the provider will probably not mind", nextId: "weak-auth", consequence: "That is the same mistake as before, only a day later.", quality: "poor" },
      ],
    },
    {
      id: "scope-surprise",
      title: "Thursday, 14:20",
      body: "Jonas finds an old admin server at an IP address that is not in the letter. It belongs to Fernhill (it seems), is reachable from the internet, and looks very vulnerable. \"Can I just poke it? It's probably theirs.\"",
      choices: [
        { id: "scope-surprise-a", text: "\"Not yet. Don't touch it. Let me ask Dermot to confirm ownership and add it to the signed letter.\"", nextId: "end-signed", consequence: "Dermot confirms it is theirs and adds it to the letter in ten minutes. The finding becomes the most important of the engagement.", quality: "good" },
        { id: "scope-surprise-b", text: "\"Go ahead, it's probably theirs.\"", nextId: "end-bad", consequence: "\"Probably theirs\" turns out to be an old supplier's server. The supplier's security team logs the intrusion.", quality: "poor" },
      ],
    },
    {
      id: "end-signed",
      title: "The result",
      body: "The testing was done inside a signed, specific, correct authorisation. The client's site was ready for Friday.",
      choices: [],
      ending: { kind: "good", summary: "You said no kindly, offered a fast path to yes, checked who could really authorise, and kept every system in scope on paper.", lesson: "Authorisation is not an obstacle to the job. It is what makes the job legal, safe and insurable." },
    },
    {
      id: "end-mixed",
      title: "The result",
      body: "No lasting harm, but a hosting provider, a client and your manager now all know about a near miss. A review is scheduled.",
      choices: [],
      ending: { kind: "mixed", summary: "You contained it, but the rule was broken first.", lesson: "Unauthorised access to a computer system is a criminal offence, under Irish law and the equivalent laws of every EU state, whether or not the client is friendly. Beryll's insurance, reputation and your own position depend on never being the one who starts without a signature. Try again." },
    },
    {
      id: "end-bad",
      title: "The result",
      body: "The provider reports the intrusion to the Gardaí. Beryll's lawyers are called in on a Wednesday morning. Jonas, who did what he was told, and you, who told him, are named in the complaint. The client's trust is gone and the story is in the trade press.",
      choices: [],
      ending: { kind: "bad", summary: "A serious legal and commercial incident that was entirely avoidable.", lesson: "Unauthorised access to an information system is a criminal offence in Ireland (Criminal Justice (Offences Relating to Information Systems) Act 2017) and across the EU. Neither \"they asked us to\" nor \"it's probably theirs\" is a defence. No signature, no testing. Try again." },
    },
  ],
};
