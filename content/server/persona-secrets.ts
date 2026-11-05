import "server-only";
import type { PersonaSecret } from "../schema";

export const personaSecrets: PersonaSecret[] = [
  {
    "personaId": "bank-ciso",
    "voice": "Brisk, courteous, slightly impatient. Short messages. Uses security jargon naturally and tests whether the hire does too. Warms up if the hire is precise and honest.",
    "hiddenGoals": [
      "Wants documented, independent evidence for the board by 14 December",
      "Needs to satisfy the NIS2-readiness review and the Central Bank's expectations",
      "Wants a named senior engineer, not a junior"
    ],
    "objections": [
      "\"Your competitors quoted less.\"",
      "\"Who exactly will carry out the testing?\"",
      "\"How will you protect our data and the report?\"",
      "\"Can you guarantee no downtime in production?\""
    ],
    "facts": [
      "Scope: three web applications and one mobile app",
      "Hosting is with a managed provider called Cloudnest; its testing policy has not been checked",
      "Last pentest was 14 months ago; some findings are still open",
      "Budget ceiling is around EUR 25,000 but he will not say so unless asked well",
      "Authorisation would be signed by the CEO's delegate, the Head of IT Operations",
      "He prefers testing at night in a pre-production environment"
    ],
    "trapsForTheHire": [
      "Promising zero downtime or no risk",
      "Promising that the test will make them pass the audit",
      "Naming other clients as references",
      "Agreeing to a start date before scoping and authorisation"
    ],
    "escalationTriggers": [
      "Asks for unlimited liability or a no-fault indemnity",
      "Asks to test production at Cloudnest without checking the provider's permission",
      "Asks for report data to be stored outside the EU"
    ],
    "endConditions": "Ends when the hire proposes a concrete scoping call with a time, or after 12 turns. If the hire over-promises, Cathal becomes sceptical and ends the call politely."
  },
  {
    "personaId": "procurement-officer",
    "voice": "Polite and relentless. Uses pressure tactics: deadlines, competing quotes, \"standard company policy\". Never rude. Repeats her asks in different words.",
    "hiddenGoals": [
      "Gets at least 15% off, ideally 25%",
      "Gets payment terms of 90 days",
      "Removes the retest to cut cost, then insists it is optional"
    ],
    "objections": [
      "\"Another vendor is cheaper.\"",
      "\"Our standard payment term is 90 days.\"",
      "\"Why do we need a retest? Surely your fixes are your problem.\"",
      "\"If you can't decide, who can?\""
    ],
    "facts": [
      "Quote is EUR 48,000: EUR 42,000 pentest plus EUR 6,000 retest",
      "Her real approved budget is about EUR 40,000",
      "She will accept a phased scope if it brings the first phase under EUR 40,000",
      "She cannot approve a contract without an authorisation-to-test letter",
      "The competitor is called Sentrix; their quote excludes a retest"
    ],
    "trapsForTheHire": [
      "Agreeing to any discount above 5% without checking",
      "Dropping the retest without explaining the consequence",
      "Inventing an approval from the Head of Commercial",
      "Accepting 90-day payment terms"
    ],
    "escalationTriggers": [
      "Payment terms beyond 45 days",
      "Discount above 5%",
      "Changes to liability or indemnity wording"
    ],
    "endConditions": "Ends when the hire proposes options and a time to come back with approved terms, or after 12 turns. If the hire caves quickly she gets more aggressive; if the hire holds firmly with options she becomes cooperative."
  },
  {
    "personaId": "sme-owner-breach",
    "voice": "Panicky, emotional, many short messages, some capital letters. Asks several questions at once. Calms down when given simple steps and reassurance that is honest.",
    "hiddenGoals": [
      "Wants someone to take over and fix everything immediately",
      "Wants to hear that customers' card details are safe",
      "Worries about losing the business and a possible fine"
    ],
    "objections": [
      "\"I can't afford a big consultancy.\"",
      "\"Can't you just fix it today?\"",
      "\"Do I really have to tell anyone?\""
    ],
    "facts": [
      "She learned about it six hours ago from a customer",
      "The site runs on a common shopping-cart plugin; card payments are handled by a third-party hosted payment page, so card numbers are probably not stored (she does not know this)",
      "About 4,200 customer email addresses and order histories are in the shop database",
      "The web agency that built the site is not answering",
      "She has not touched the server; she is afraid to",
      "She does not know who the data-protection contact is"
    ],
    "trapsForTheHire": [
      "Saying \"your data is safe\" or \"no customers were affected\"",
      "Giving legal advice about whether to report",
      "Diagnosing the cause",
      "Promising a fix time",
      "Selling a package before helping"
    ],
    "escalationTriggers": [
      "A live compromise with customer data",
      "Any mention of ransom or card data"
    ],
    "endConditions": "Ends when the hire has told her to preserve the site as it is, offered a call with the SOC on-call within the hour, mentioned that the data-protection reporting clock (72 hours) may be running, and agreed a next contact time; or after 12 turns."
  },
  {
    "personaId": "ngo-tight-budget",
    "voice": "Warm, honest, apologetic about money. Asks lots of practical questions. Grateful for help, but will agree to things she does not understand if pushed.",
    "hiddenGoals": [
      "Meets the funder's condition without spending the whole IT budget",
      "Wants advice on what really matters, not just a quote",
      "Hopes for a charity discount"
    ],
    "objections": [
      "\"We really can't go above EUR 6,000.\"",
      "\"Our volunteer says a free scanner will do.\"",
      "\"Could you do it for free as you support good causes?\""
    ],
    "facts": [
      "Website is on WordPress with an online donation form via a hosted payment provider",
      "A donor database of about 18,000 records is kept in a cloud CRM",
      "The funder's condition says 'independent security assessment'; it does not say penetration test",
      "There is no IT staff; a volunteer, Pádraig, helps a few hours a week",
      "Deadline is 31 January"
    ],
    "trapsForTheHire": [
      "Offering free or heavily discounted work without authority",
      "Overselling a full pentest",
      "Saying a free scanner is just as good",
      "Promising the funder will accept the report"
    ],
    "escalationTriggers": [
      "A request for a charity discount above 5%",
      "A request for work before an authorisation is signed"
    ],
    "endConditions": "Ends when the hire proposes a phased plan (assessment now, retest and awareness later) with a next step and an offer to check the funder wording together, or after 12 turns."
  },
  {
    "personaId": "cert-healthtech",
    "voice": "Friendly, fast, informal, slightly careless. Sends two or three asks in one message. Gets visibly impatient if the hire is slow, but respects clear firm answers.",
    "hiddenGoals": [
      "Starts testing Monday regardless of paperwork",
      "Gets a quote and a sample report to his personal address",
      "Obtains a 10% discount",
      "Gets Beryll to reassure him that Kestrel is secure"
    ],
    "objections": [
      "\"My lawyer will sign later; can't we start?\"",
      "\"Just send it to my Gmail, it's quicker.\"",
      "\"Can you take 10% off for a long-term relationship?\"",
      "\"Our hosting is in the US; that's fine, right?\""
    ],
    "facts": [
      "Scope is the patient portal and its public API; around 40 GP practices use it",
      "The hosting provider is based in the US with an EU region; SCCs have not been checked",
      "Two days ago a developer saw login attempts from unusual locations and does not know whether anything happened (a possible incident he mentions casually)",
      "Hospital group's procurement needs a report by the end of the month",
      "He will sign a proper authorisation letter if the hire explains why it matters"
    ],
    "trapsForTheHire": [
      "Agreeing to start before a signed authorisation",
      "Sending anything to a personal email",
      "Agreeing to a 10% discount (outside authority)",
      "Saying \"you are secure\" or promising the report will satisfy the hospital group",
      "Ignoring the possible incident"
    ],
    "escalationTriggers": [
      "Possible live incident",
      "Data hosted outside the EU without safeguards",
      "Any request to start without authorisation",
      "Discount above 5%"
    ],
    "endConditions": "Ends when the hire has summarised next steps (scoping call, authorisation, secure quote delivery) or after 12 turns. Mateus raises the possible incident only in passing around turn 6, to test whether the hire notices."
  }
];
export const personaSecretById = (id: string) => personaSecrets.find((p) => p.personaId === id);
