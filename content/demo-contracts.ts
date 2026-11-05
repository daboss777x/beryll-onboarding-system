import type { Client, Clause, Contract, SowTemplate } from "./schema";
import { staffById } from "./staff";

/** Fictional clients for the Beryll Contracts mini-app. */
export const clients: Client[] = [
  { id: "liffey-mutual-credit-union", name: "Liffey Mutual Credit Union", sector: "Financial services", country: "Ireland", size: "180 staff", contactName: "Cathal Fitzgerald", contactRole: "Chief Information Security Officer", notes: "Long-standing client. NIS2 readiness review under way. Board meets 14 December." },
  { id: "atlas-freight-logistics", name: "Atlas Freight and Logistics", sector: "Logistics", country: "Ireland", size: "650 staff", contactName: "Inês Marques", contactRole: "Procurement Officer", notes: "Price-sensitive. Competing quote from another vendor. Procurement negotiates hard." },
  { id: "kestrel-health-technologies", name: "Kestrel Health Technologies", sector: "Health technology", country: "Ireland / Portugal", size: "85 staff", contactName: "Mateus Silva", contactRole: "Chief Technology Officer", notes: "Software for GP practices. Hospital group wants independent evidence. Hosting provider is US-based with an EU region." },
  { id: "costello-garden-supplies", name: "Costello and Daughters Garden Supplies", sector: "E-commerce", country: "Ireland", size: "14 staff", contactName: "Bríd Costello", contactRole: "Owner", notes: "Small online shop. No security staff. Contact if it ever has an incident." },
  { id: "open-door-youth-services", name: "Open Door Youth Services", sector: "Charity", country: "Ireland", size: "32 staff", contactName: "Ruth Adeyemi", contactRole: "Operations Director", notes: "Funder requires an independent security assessment by 31 January. Budget about EUR 6,000." },
  { id: "corrib-payments", name: "Corrib Payments Limited", sector: "Fintech", country: "Ireland", size: "60 staff", contactName: "Fionn Daly", contactRole: "Head of Risk", notes: "Sent client-paper DPA. Handles cardholder data." },
  { id: "harbourline-logistics", name: "Harbourline Logistics DAC", sector: "Logistics", country: "Ireland", size: "300 staff", contactName: "Tadhg Lynch", contactRole: "Procurement Manager", notes: "New prospect. Sent their own MSA." },
  { id: "fernhill-retail", name: "Fernhill Retail Ltd", sector: "Retail", country: "Ireland", size: "240 staff", contactName: "Dermot Hayes", contactRole: "Chief Executive", notes: "Black Friday launch. Hosting and payment pages are with third parties." },
];

const c = (id: string, title: string, text: string, standard = true): Clause => ({ id, title, text, standard });

const stdLiability = c("liability", "Limitation of liability", "Each party's total liability under this agreement is limited to the fees paid or payable in the twelve months before the claim arose. Nothing limits liability that cannot lawfully be limited.");
const stdPayment = c("payment", "Fees and payment", "Invoices are payable within thirty (30) days of the invoice date. Late payments carry interest at the statutory rate.");
const stdConf = c("confidentiality", "Confidentiality", "Each party keeps the other's confidential information secret, uses it only for the engagement and protects it with reasonable care. This survives for five years after termination.");
const stdAuth = c("authorisation", "Authorisation to test", "No testing begins until the client has signed a written authorisation-to-test identifying the systems, testing window, source IP addresses and emergency contacts, and confirming the signatory's authority.");
const stdLaw = c("law", "Governing law", "This agreement is governed by the laws of Ireland and the Irish courts have exclusive jurisdiction.");

const person = (id: string) => {
  const s = staffById(id);
  if (!s) throw new Error(`Unknown staff ${id}`);
  return s.name;
};
const ct = (id: string, clientId: string, type: Contract["type"], title: string, valueEur: number, status: Contract["status"], ownerId: string, updatedAt: string, clauses: Clause[]): Contract => ({
  id, clientId, client: clients.find((x) => x.id === clientId)!.name, type, title, valueEur, status, ownerId, owner: person(ownerId), updatedAt, clauses,
});

/** Ten sample contracts across all five statuses. Non-standard clauses (standard: false) must go through Legal Review. */
export const contracts: Contract[] = [
  ct("ct-liffey-msa", "liffey-mutual-credit-union", "MSA", "Master Services Agreement 2026", 0, "signed", "siobhan-kelly", "2026-02-12", [
    c("parties", "Parties and purpose", "This agreement sets the terms on which Beryll Cyber Security Limited provides security testing and related services to Liffey Mutual Credit Union under individual Statements of Work."), stdPayment, stdConf, stdLiability,
    c("term", "Term and renewal", "The agreement runs for twelve months and renews annually unless either party gives sixty (60) days' written notice."), stdLaw,
  ]),
  ct("ct-liffey-sow-2026", "liffey-mutual-credit-union", "SOW", "Web application penetration test and retest", 24500, "sent", "siobhan-kelly", "2026-10-28", [
    c("scope", "Scope", "Three customer-facing web applications and one mobile application, listed in Annex A. Out of scope: the managed hosting provider's infrastructure and all third-party payment pages."), 
    c("window", "Testing window", "Testing takes place between 22:00 and 06:00 on agreed nights between 25 January and 12 February 2027."), stdAuth,
    c("deliverables", "Deliverables", "A written report within ten working days of the end of testing, an executive presentation, and one retest of Critical and High findings within sixty days."), stdPayment, stdLiability,
  ]),
  ct("ct-atlas-sow-2026", "atlas-freight-logistics", "SOW", "Customer portal and warehouse systems assessment", 48000, "legal_review", "liam-brennan", "2026-11-02", [
    c("scope", "Scope", "Customer portal, partner API and warehouse management web console. Excludes carrier integrations operated by third parties."), stdAuth,
    c("payment-90", "Fees and payment (client request)", "The client requests invoices be payable within ninety (90) days of receipt. Pending approval by the Head of Commercial and Legal.", false),
    c("retest-optional", "Retest", "One retest of Critical and High findings within sixty days is included in the fee."), stdLiability,
  ]),
  ct("ct-kestrel-nda", "kestrel-health-technologies", "NDA", "Mutual non-disclosure agreement", 0, "signed", "liam-brennan", "2026-10-20", [
    c("definition", "Confidential information", "All non-public information, in any form, that one party discloses to the other in connection with the proposed engagement."), 
    c("obligations", "Obligations", "The receiving party uses the information only to evaluate and perform the engagement and does not disclose it except to staff and advisers who need to know and are bound by equivalent duties."), stdLaw,
  ]),
  ct("ct-kestrel-sow-portal", "kestrel-health-technologies", "SOW", "Patient portal penetration test", 18500, "engineer_signoff", "liam-brennan", "2026-11-03", [
    c("scope", "Scope", "The patient portal web application, its public API and the authentication service. Out of scope: the corporate network and the third-party payment provider."), stdAuth,
    c("deliverables", "Deliverables", "Report with executive summary, ranked findings and remediation advice within ten working days. One retest within sixty days."), stdPayment, stdLiability, stdConf,
  ]),
  ct("ct-kestrel-dpa", "kestrel-health-technologies", "DPA", "Data processing agreement", 0, "legal_review", "siobhan-kelly", "2026-11-03", [
    c("roles", "Roles", "Kestrel is the controller and Beryll is the processor of any personal data accessed during the engagement."),
    c("transfers", "International transfers", "Personal data may be stored in the hosting provider's US region. The parties will agree appropriate safeguards at a later date.", false),
    c("breach", "Breach notification", "Beryll notifies Kestrel without undue delay and within 48 hours of becoming aware of a personal data breach."), stdConf,
  ]),
  ct("ct-fernhill-auth", "fernhill-retail", "Authorisation", "Authorisation to test: checkout and application servers", 0, "signed", "siobhan-kelly", "2026-11-04", [
    c("systems", "Systems in scope", "The Fernhill web storefront, checkout application servers and the three IP addresses listed in the schedule. The payment platform's hosted checkout is excluded."),
    c("window", "Testing window and source IPs", "Testing may take place from Thursday 10:00 to Friday 06:00 from the listed Beryll source IP addresses. The hosting provider has given 48 hours' written notice."),
    c("authority", "Signatory authority", "The signatory confirms that he is authorised to approve testing of the systems listed and has obtained any necessary approval of the hosting provider."),
    c("contacts", "Emergency contacts and stop rules", "Each party names a 24-hour contact. Testing stops immediately on request of either contact or if systems show signs of instability."),
  ]),
  ct("ct-open-door-sow", "open-door-youth-services", "SOW", "Website vulnerability assessment and awareness session", 5900, "draft", "siobhan-kelly", "2026-11-04", [
    c("scope", "Scope", "The charity's public website and donation form, hosted by a named provider. Excludes the payment provider's systems and the cloud CRM."), stdAuth,
    c("deliverables", "Deliverables", "Plain-English report with a prioritised fix list, a one-page summary for donors, and a one-hour staff awareness session."), stdPayment,
  ]),
  ct("ct-corrib-dpa", "corrib-payments", "DPA", "Data processing agreement (client paper)", 0, "legal_review", "liam-brennan", "2026-11-01", [
    c("roles", "Roles", "Corrib is the controller and Beryll the processor of personal data accessed during the services."),
    c("transfers", "International transfers", "The processor may transfer personal data to any country without notice or any transfer mechanism.", false),
    c("breach-6h", "Breach notification", "The processor notifies the controller within six (6) hours of the breach occurring, with a full root-cause report.", false),
    c("liability-unlimited", "Liability", "The processor indemnifies the controller without limit for all losses, including regulatory fines.", false), stdConf,
  ]),
  ct("ct-harbourline-msa", "harbourline-logistics", "MSA", "Master services agreement (client paper)", 0, "draft", "liam-brennan", "2026-10-30", [
    c("parties", "Parties and purpose", "This agreement sets the terms on which Beryll provides security testing services to Harbourline under Statements of Work."),
    c("payment-120", "Fees and payment", "The Client shall pay each undisputed invoice within one hundred and twenty (120) days of receipt, without interest.", false),
    c("term-auto", "Term and renewal", "Initial term of three years, auto-renewing for successive three-year terms unless the Supplier gives nine months' notice.", false),
    c("scope-unilateral", "Change of scope", "The Client may vary scope, timetable and deliverables at any time by notice, without any change to the fees.", false),
    c("liability-unlimited", "Limitation of liability", "The Supplier's liability is unlimited. The Client's liability is capped at fees paid in the previous twelve months.", false), stdConf, stdLaw,
  ]),
];

/** The approved SOW template. Optional clauses are pre-approved wording, included only when agreed and costed. */
export const sowTemplate: SowTemplate = {
  id: "sow-template-v4",
  name: "Beryll SOW template v4",
  guidance: "Drag clauses into the SOW. Mandatory clauses must all be present before the SOW can move to Engineer Sign-off. Optional clauses are included only if agreed in the scoping call and costed by the engineer.",
  clauses: [
    { id: "scope", title: "Background, scope and exclusions", text: "Describes why the client is commissioning the work, the exact systems in scope (URLs, IP ranges, environments) and anything explicitly excluded.", standard: true, optional: false, guidance: "Copy from the scoping summary. Never write 'all systems'." },
    { id: "window", title: "Testing window and approach", text: "States the dates and hours during which testing may take place, the type of test (for example black-box or grey-box) and the source IP addresses used by Beryll.", standard: true, optional: false, guidance: "Confirm the dates with the engineer." },
    { id: "authorisation", title: "Authorisation to test", text: "No testing begins until the client has signed a written authorisation-to-test identifying the systems, testing window, source IP addresses and emergency contacts, and confirming the signatory's authority.", standard: true, optional: false, guidance: "Locked wording. Do not edit." },
    { id: "deliverables", title: "Deliverables", text: "A written report with an executive summary, technical findings ranked by severity and remediation advice, delivered within ten working days of the end of testing, plus one retest of Critical and High findings within sixty days.", standard: true, optional: false, guidance: "The retest is part of the standard price." },
    { id: "fees", title: "Fees and payment", text: "The fee is stated in euro excluding VAT. Invoices are payable within thirty (30) days of the invoice date. Late payments carry statutory interest.", standard: true, optional: false, guidance: "Payment beyond 45 days needs the Head of Commercial and Legal." },
    { id: "client-responsibilities", title: "Client responsibilities", text: "The client provides test accounts, a technical contact, backups before testing, and timely access to environments, and confirms any third-party approvals needed.", standard: true, optional: false, guidance: "Check hosting provider rules." },
    { id: "confidentiality", title: "Confidentiality and report handling", text: "The report is classified Restricted. It is delivered to named recipients through the secure portal and may be shared only with the client's professional advisers and auditors under confidentiality.", standard: true, optional: false, guidance: "Do not agree to unrestricted sharing." },
    { id: "liability", title: "Liability", text: "Liability under this SOW is governed by the limitation of liability in the Master Services Agreement, being fees paid or payable in the twelve months before the claim.", standard: true, optional: false, guidance: "Any change goes to Legal." },
    { id: "change-control", title: "Change control", text: "Any change to scope, dates or fees must be agreed in writing by both parties. New systems cannot be tested until the authorisation-to-test has been updated.", standard: true, optional: false, guidance: "Reject unilateral change wording." },
    { id: "out-of-hours", title: "Out-of-hours testing (optional)", text: "Testing may take place outside 09:00 to 17:30 on working days. An out-of-hours supplement is charged as stated in the fee schedule.", standard: true, optional: true, guidance: "Include if the client needs night testing." },
    { id: "exec-presentation", title: "Executive presentation (optional)", text: "A one-hour presentation of the findings to the client's leadership team, in person or by video, within ten working days of the report.", standard: true, optional: true, guidance: "Good for boards and audit committees." },
    { id: "extended-retest", title: "Extended retest (optional)", text: "The retest period is extended to one hundred and twenty days and covers Medium findings as well as Critical and High.", standard: true, optional: true, guidance: "Costed by the engineer." },
  ],
};
