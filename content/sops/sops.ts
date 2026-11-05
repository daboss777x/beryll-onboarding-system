import type { Sop } from "../schema";

/** About 15 SOPs. Each has an owner (staff id) and a review date. These are also the knowledge base for Ask Beryl. */
export const sops: Sop[] = [
  {
    id: "scoping-call",
    title: "Running a scoping call",
    owner: "daniel-mensah",
    reviewDate: "2027-03-31",
    summary: "What to capture on a scoping call with an engineer, and what must be agreed before a SOW is drafted.",
    tags: ["scoping", "engineering", "SOW"],
    body: `## Purpose
A scoping call turns a client's worry into a defined piece of work that engineers can estimate and deliver.

## Who attends
- The BDM (leads the commercial side and takes notes)
- One engineer (leads the technical questions)
- The client's decision-maker and a technical contact

## What to capture
1. **Why now?** What triggered the request (audit, customer questionnaire, incident, new launch)?
2. **Assets in scope:** URLs, applications, IP ranges, environments (production or staging), cloud and third-party hosts.
3. **Exclusions:** anything that must not be touched (payment platforms, live medical devices, third-party systems).
4. **Testing window:** dates, hours and blackout periods.
5. **Contacts:** a day-to-day contact and an out-of-hours emergency contact.
6. **Data:** will testers meet personal data? Who is the data protection contact?
7. **Constraints:** change freezes, approvals, hosting provider rules.
8. **Budget and deadline:** ask early and plainly.

## After the call
- Send a written summary to the client within one working day.
- Ask the engineer to confirm the estimate in days.
- Note who can sign the authorisation-to-test (see that SOP).
- Update the CRM.

## Do not
- Write "all systems" in a scope.
- Promise a start date before the authorisation is signed.`,
  },
  {
    id: "sow-template-rules",
    title: "SOW template rules",
    owner: "siobhan-kelly",
    reviewDate: "2027-01-31",
    summary: "How to build a SOW from the approved template: mandatory clauses, optional clauses and what you may not change.",
    tags: ["SOW", "contracts", "templates"],
    body: `## Use the template
Always start from the approved SOW template in Beryll Contracts. Never copy an old SOW.

## Mandatory (standard) clauses
Background, scope and exclusions, testing window and approach, authorisation-to-test prerequisite, deliverables, fees and payment (30 days), client responsibilities, confidentiality and report handling, liability (the cap in the MSA), change control and retest.

## Optional clauses
Out-of-hours testing, extended retest period, onsite attendance, executive presentation, additional reporting formats. Include only if agreed in the scoping call and costed by the engineer.

## What you may not change
- The authorisation-to-test prerequisite
- The liability and indemnity wording
- Payment terms beyond 45 days (Head of Commercial only)
- The report-handling and confidentiality clause

Any non-standard clause is flagged in the tool and must go through Legal Review.

## Before you submit
Check: scope matches the scoping summary, dates are realistic, the fee matches the engineer's estimate, and there are no placeholders left.`,
  },
  {
    id: "approval-pipeline",
    title: "Contract approval pipeline",
    owner: "siobhan-kelly",
    reviewDate: "2027-01-31",
    summary: "The five statuses a contract moves through and the rules that stop an unsafe contract from being sent.",
    tags: ["contracts", "approval", "legal", "engineering"],
    body: `## The pipeline
**Draft, Legal Review, Engineer Sign-off, Sent to Client, Signed.**

## Rules
1. **A contract cannot be sent without engineer sign-off.** The engineer confirms scope, effort and dates are deliverable.
2. **Any non-standard clause needs Legal Review.** Contracts made only of standard template clauses may move from Draft straight to Engineer Sign-off.
3. A contract cannot skip Engineer Sign-off or move backwards without a note explaining why.
4. Only the owner moves a contract forward. Legal and engineers record their approval in the tool.
5. After signature, upload the signed PDF and update the CRM.

## Turnaround
- Legal Review: one working day for standard queries, three for complex.
- Engineer Sign-off: one working day.

## If a client pushes for speed
Explain the steps, give a date, and escalate to the Head of Commercial. Do not skip a step.`,
  },
  {
    id: "authorisation-to-test",
    title: "Authorisation to test",
    owner: "daniel-mensah",
    reviewDate: "2027-02-28",
    summary: "The one rule we never bend: no testing without a signed authorisation from someone with the authority to give it.",
    tags: ["authorisation", "legal", "rules of engagement", "critical"],
    body: `## The rule
**No testing begins until a signed authorisation-to-test (rules of engagement) is on file.** This applies to retests, extensions and new targets.

## Why
Unauthorised access to an information system is a criminal offence in Ireland (Criminal Justice (Offences Relating to Information Systems) Act 2017) and under equivalent laws across the EU. A signed authorisation is what makes our work lawful.

## What it must contain
- The client's legal name and the signatory's name, role and **authority** over the systems
- Exact systems: URLs, IP addresses and ranges, environments
- Out-of-scope systems
- Testing windows and Beryll's source IP addresses
- Permitted techniques and prohibited actions (for example no denial of service, no social engineering unless agreed)
- Data-handling limits
- Emergency contacts on both sides, and stop rules

## Third parties
If systems are hosted by a cloud, hosting or payment provider, check that provider's testing policy and obtain approval where required. The client cannot authorise testing of systems they do not control.

## Verbal permission
Does not count. An email without the signed letter does not count. "I'll sign tomorrow" does not count.

## If asked to start early
Say no politely, offer a fast route to a signature, and tell the Head of Offensive Security.`,
  },
  {
    id: "escalation-matrix",
    title: "Escalation matrix",
    owner: "niamh-ocallaghan",
    reviewDate: "2027-02-28",
    summary: "Who to escalate to for each type of situation and how fast.",
    tags: ["escalation", "legal", "incident"],
    body: `## Matrix
| Situation | Escalate to | When |
|---|---|---|
| Live incident at a client | SOC on-call (Head of Managed SOC) | Immediately, by phone |
| Outage during testing, or critical finding mid-test | Lead engineer, then Head of Offensive Security | Immediately |
| Non-standard clause, liability, indemnity, data transfer, DPA | Legal and Contracts Counsel | Same working day |
| Complaint or threat to leave | Head of Commercial | Same day |
| Discount above 5% | Head of Commercial | Before replying |
| Discount above 15% | Managing Director via Head of Commercial | Before replying |
| Request to test without authorisation | Head of Offensive Security and Legal | Immediately |
| Suspected Beryll-side data leak | Operations, Legal and the DPO | Immediately |

## How to write an escalation
Who, what, when, client deadline, what you have already said, what you recommend, and what you need from the recipient.

## Principle
Escalating early is the right call. A late escalation is the mistake.`,
  },
  {
    id: "client-comms-tone",
    title: "Client communications tone and standards",
    owner: "siobhan-kelly",
    reviewDate: "2027-03-31",
    summary: "Response times, tone, and how to deliver difficult news to clients.",
    tags: ["communication", "tone", "clients", "QA"],
    body: `## Standards
- Reply within **one working day**, even if only to say when you will have the answer.
- Plain English, short sentences, acronyms explained.
- One ask and one next step per email, with a date.
- Be honest about what you know, what you do not know, and when you will update.

## Delivering difficult news
Acknowledge the worry, state the fact simply, say what is being done, give the next step and time.

## Things we do not say
"You are secure", "nothing to worry about", "it'll be fixed by Friday" (unless an engineer said so), or anything that blames the client's team.

## Sensitive information
No vulnerability details, IP addresses or credentials in the body of an email. Use the secure portal.

## QA sampling
In days 31 to 60 your manager scores one in five of your emails and calls on accuracy, tone, clarity, data handling and next step. Target: an average of 4 out of 5.`,
  },
  {
    id: "incident-client-comms",
    title: "Client communications during an incident",
    owner: "katarzyna-nowak",
    reviewDate: "2027-01-15",
    summary: "What a BDM says, does and does not say when a client reports or suffers a live security incident.",
    tags: ["incident", "communication", "SOC", "GDPR"],
    body: `## First five minutes
1. Stay calm and listen. Let the client describe what they see.
2. Call the SOC on-call. Do not wait to be certain.
3. Ask the client: what happened, when did they notice, what systems are affected, have they changed anything?
4. Tell them not to wipe, reboot or reinstall anything unless advised by the incident team.
5. Note the time the client became aware: this starts the GDPR clock.

## What to say
"Thank you for telling us. I have brought in our incident team. Here is what happens next, and I will update you by [time]."

## What not to say
That the data is safe, that nothing was taken, who the attacker is, how long recovery will take, or any legal conclusion.

## Obligations to mention (not advise on)
- GDPR personal-data breach: notify the Data Protection Commission within 72 hours of becoming aware.
- NIS2 (in-scope entities): early warning within 24 hours, notification within 72 hours, final report within one month.
Tell them to involve their data protection officer and legal adviser.

## Afterwards
Keep one point of contact, update on the agreed schedule, and log everything in the CRM. Do not discuss commercial terms until the incident team confirms containment.`,
  },
  {
    id: "data-classification-policy",
    title: "Data classification policy",
    owner: "priya-nair",
    reviewDate: "2027-02-15",
    summary: "The four classification labels and what you may do with each.",
    tags: ["data", "classification", "security", "GDPR"],
    body: `## Labels
- **Public:** share freely.
- **Internal:** inside Beryll only.
- **Confidential:** contracts, SOWs, contact lists. Named people at Beryll and the client, through approved channels.
- **Restricted:** pentest reports, vulnerability data, credentials, network details, personal data. Named recipients, encrypted, approved transfer only.

## Rules
- Pentest reports are always Restricted.
- Send the password for an encrypted file through a different channel.
- Never use personal email, personal cloud storage or messaging apps for Confidential or Restricted material.
- No client details in public AI tools.
- Keep a clean desk, lock your screen, and do not discuss clients in public.
- Do not leave devices unattended or in cars.
- If unsure, treat as the higher label and ask.

## Lost or exposed data
Report to Operations and Legal immediately. Do not try to fix it yourself.`,
  },
  {
    id: "gdpr-dpa-checklist",
    title: "GDPR data processing agreement checklist",
    owner: "amara-okafor",
    reviewDate: "2027-02-15",
    summary: "What to check in a DPA and when to escalate to Legal.",
    tags: ["GDPR", "DPA", "legal", "contracts"],
    body: `## When you need one
Whenever Beryll may access personal data on behalf of a client (almost every pentest of a live system). The client is normally the controller; Beryll is the processor.

## Checklist
1. **Roles** correctly identified.
2. **Purpose and instructions:** processing only on documented instructions, for the engagement.
3. **Confidentiality** commitments for staff.
4. **Security measures** described (encryption, access control, need to know).
5. **Subprocessors:** an approved list, notice of changes, flow-down of obligations.
6. **International transfers:** within the EU/EEA, or with a lawful safeguard (adequacy decision or SCCs).
7. **Breach notification:** without undue delay and within 48 hours of becoming aware.
8. **Assistance** with data-subject requests and DPIAs.
9. **Return or deletion** within 30 days of the end of services.
10. **Audit rights:** reasonable, with notice, during business hours.
11. **Liability** inside the MSA cap.

## Always escalate to Legal
Transfers outside the EU/EEA, uncapped liability or fines indemnity, unusual breach timelines, indefinite retention, or any clause you cannot summarise in one sentence.`,
  },
  {
    id: "nis2-quick-guide",
    title: "NIS2 quick guide for commercial teams",
    owner: "priya-nair",
    reviewDate: "2027-01-31",
    summary: "What NIS2 is, who it covers and what it means for the conversations you have with clients.",
    tags: ["NIS2", "compliance", "regulation"],
    body: `## What it is
NIS2 is the EU directive on the security of network and information systems, implemented through national law in each member state.

## Who is covered
"Essential" and "important" entities in sectors including energy, transport, banking, health, drinking water, digital infrastructure, ICT service management, public administration, manufacturing and food. Size matters: generally medium and large organisations. Suppliers to covered entities are affected indirectly.

## What it asks of them
- Risk management measures, including supply-chain security, vulnerability handling and testing
- Incident reporting: early warning within 24 hours, notification within 72 hours, final report within one month
- Management accountability and training

## How you use this
Ask every prospect: "Are you in scope, or a supplier to someone who is?" Do not decide scope yourself: ask GRC (Priya Nair). Explain how our services help: assessments, testing, monitoring and readiness support.

## Careful
Do not say that a Beryll service makes a client "NIS2 compliant". We help them meet obligations and gather evidence.`,
  },
  {
    id: "pricing-discount-authority",
    title: "Pricing and discount authority",
    owner: "siobhan-kelly",
    reviewDate: "2027-01-31",
    summary: "Who can approve what discount, payment term or liability variation.",
    tags: ["pricing", "discount", "authority"],
    body: `## Discount authority
| Discount on list price | Who approves |
|---|---|
| Up to 5% | BDM |
| Up to 15% | Head of Commercial |
| Above 15% | Managing Director, through the Head of Commercial |

Charity and public-sector pricing is set by the Head of Commercial, not by BDMs.

## Payment terms
- Standard: 30 days from invoice.
- Up to 45 days: Head of Commercial.
- Beyond 45 days: not agreed without Managing Director and Legal.

## Liability and indemnity
Always through Legal. The standard cap is fees paid or payable in the previous 12 months.

## Rules of thumb
- Trade scope for price rather than cutting price alone.
- Never remove the retest to hit a number without explaining the consequence to the client.
- Never imply an approval that you do not have.
- Record every concession in the CRM with the approver's name.`,
  },
  {
    id: "crm-hygiene",
    title: "CRM hygiene",
    owner: "liam-brennan",
    reviewDate: "2026-12-15",
    summary: "What must be in the CRM for every account and opportunity, and how fast.",
    tags: ["CRM", "pipeline", "process"],
    body: `## Rules
1. **Update within one working day** of any client contact: summary, decisions, next step and next-step date.
2. Every open opportunity has an **owner, value, stage, close date and next step**.
3. Every account has a primary contact, an executive sponsor, the services bought and the renewal date.
4. Stages must match the evidence: do not move to Proposal without a scoping summary.
5. Log concessions (discounts, terms) with the approver.
6. Close lost opportunities with a reason.
7. Mark contracts Signed in Beryll Contracts and the CRM within a day of signature.

## Weekly
Each Friday, check your open opportunities for stale next steps older than 7 days.

## Data protection
Store only business contact details. No technical details of clients' systems, no vulnerability data and no credentials in the CRM.`,
  },
  {
    id: "renewals",
    title: "Renewals process",
    owner: "liam-brennan",
    reviewDate: "2027-03-15",
    summary: "How and when to run renewals so they are never a surprise.",
    tags: ["renewals", "accounts", "pipeline"],
    body: `## Timeline
- **120 days before expiry:** open the conversation (ideally earlier, at the report meeting). Review what the client got and what changed.
- **90 days:** send the renewal proposal or new SOW.
- **60 days:** follow up. Check auto-renewal and notice clauses.
- **30 days:** escalate to the Head of Commercial if unsigned.

## In the renewal conversation
- Review findings, fixes and the retest result.
- Ask what has changed: new systems, new regulation, new customers.
- Recommend what to test or monitor next.

## Contract notes
- Prefer annual terms.
- Auto-renewal clauses need clear mutual notice (60 days). Anything longer needs Legal.
- Price changes explained in writing.

## After signature
Handover notes to engineers, CRM updated, a thank-you note to the client.`,
  },
  {
    id: "tender-rfp-process",
    title: "Tender and RFP process",
    owner: "liam-brennan",
    reviewDate: "2027-04-15",
    summary: "Bid/no-bid, response, legal review and submission for tenders, including EU public-sector procurements.",
    tags: ["tender", "RFP", "public sector"],
    body: `## Step 1: bid/no-bid (within 2 working days)
Review the tender with Liam and Siobhán: fit with our services, buyer, value, deadline, effort needed, evaluation criteria, and whether we can meet mandatory requirements.

## Step 2: plan
Assign: bid lead (BDM), technical author (engineer), legal reviewer, pricing approver. Put the clarification deadline and submission deadline in the shared calendar.

## Step 3: clarifications
Submit questions early through the official channel. Everyone sees the answers.

## Step 4: draft
Use approved content. Answer every question. Stay inside the word limits. Do not name clients as references without written permission.

## Step 5: legal and pricing review
Legal reviews the terms and any requested contract changes. Pricing is approved by the Head of Commercial (the Managing Director above 15% discount).

## Step 6: submit
Submit at least **24 hours before** the deadline, from the correct account, and save the confirmation.

## Step 7: afterwards
Log the outcome in the CRM, request a debrief if lost, and update the content library.

## Public sector
Be aware of EU procurement rules: the evaluation criteria are fixed, communication goes through the official portal only, and late bids are rejected.`,
  },
  {
    id: "onboarding-buddy-guide",
    title: "Onboarding buddy guide",
    owner: "elena-popescu",
    reviewDate: "2027-02-28",
    summary: "What a buddy is, what they do in the first 90 days, and what is out of bounds.",
    tags: ["onboarding", "buddy", "people"],
    body: `## What a buddy is
A friendly colleague who sits outside the new hire's reporting line. Their job is to make it easy to ask questions, and to connect the hire to people.

## What you do
- **Before day one:** send a welcome message.
- **Day one:** meet for coffee, show the hire where things are, introduce the team.
- **Twice a week for the first month:** a short, informal check-in. The app prompts you.
- **Weeks 1 to 2:** debrief the shadow log together.
- **Confirm quests:** when the hire completes a meet-the-team quest with you, confirm it in the app.
- **Day 30, 60, 90:** a casual catch-up.

## What you do not do
- Report on the hire's performance to the manager. Share concerns about wellbeing only with their permission, unless there is a safety issue.
- Do their work or answer client questions for them. Point them to the right person or SOP.

## If you are worried
If the hire seems isolated, overwhelmed or unwell, talk to them first. If you still worry, speak to the Head of Commercial or Operations.

## Time
About 2 hours a week in the first month, then 1 hour a month.`,
  },
];

export const sopById = (id: string) => sops.find((s) => s.id === id);
