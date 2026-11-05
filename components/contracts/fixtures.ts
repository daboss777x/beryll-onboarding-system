// Seed data for the Beryll Contracts sandbox. Clients, sample contracts and the SOW template come
// from Tom's content (content/demo-contracts.ts). NDA/MSA starter templates, the tour card and the
// client-paper review document are mini-app fixtures. All companies and people are fictional.
import { clients, contracts, sowTemplate } from "@/content/demo-contracts";
import type { Contract as DemoContract } from "@/content/schema";
import type { AppContract, Clause, ClientOrg, ContractTemplate, LibraryClause, ReviewDoc } from "./types";

/** Maps Tom's contract shape onto the sandbox shape. */
export function fromDemoContract(d: DemoContract): AppContract {
  return {
    id: d.id,
    clientId: d.clientId,
    client: d.client,
    type: d.type,
    title: d.title,
    valueEur: d.valueEur,
    status: d.status,
    owner: d.owner,
    updatedAt: `${d.updatedAt}T09:00:00.000Z`,
    clauses: d.clauses.map(strip),
    // Signed SOWs in the seed already had their authorisation on file.
    attachments: d.type === "SOW" && d.status === "signed" ? [{ id: `att-${d.id}`, kind: "authorisation", name: "Authorisation to Test (signed).pdf", addedAt: `${d.updatedAt}T09:00:00.000Z` }] : [],
    history: [],
  };
}

const strip = ({ id, title, text, standard }: Clause): Clause => ({ id, title, text, standard });
const c = (id: string, title: string, text: string, standard = true): Clause => ({ id, title, text, standard });

export const CLIENTS: ClientOrg[] = clients.map(({ id, name, sector, country, contactName }) => ({ id, name, sector, country, contactName }));

const SOW_CORE: Clause[] = sowTemplate.clauses.filter((x) => !x.optional).map(strip);

/**
 * Optional, pre-approved clauses (all standard: true). Non-standard wording only enters a
 * contract as a custom clause written in the builder, which forces Legal Review.
 */
export const CLAUSE_LIBRARY: LibraryClause[] = [
  ...sowTemplate.clauses.filter((x) => x.optional).map((x) => ({ ...strip(x), guidance: x.guidance, appliesTo: ["SOW" as const] })),
  { ...c("mutual-nonsolicit", "Mutual non-solicitation", "Neither party will solicit the other's staff who worked on the engagement for 12 months after it ends."), guidance: "Protects our testers from being poached.", appliesTo: ["NDA", "MSA"] },
  { ...c("evidence-retention", "Extended evidence retention", "At the client's request, Beryll retains encrypted test evidence in the EEA for up to 12 months to support audit and regulator requests."), guidance: "Common for regulated clients (banks, NIS2 entities).", appliesTo: ["MSA"] },
];

export const TEMPLATES: ContractTemplate[] = [
  { id: "sow", type: "SOW", name: "Pentest SOW", description: "Statement of Work for a penetration test: scope, window, fees and authorisation.", clauses: SOW_CORE },
  {
    id: "nda",
    type: "NDA",
    name: "Mutual NDA",
    description: "Two-way confidentiality before scoping calls or sharing architecture details.",
    clauses: [
      c("nda-purpose", "Purpose", "The parties wish to share confidential information to evaluate a possible cyber security engagement (the \"Purpose\")."),
      c("nda-definition", "Confidential information", "Confidential information means any non-public information disclosed by either party, including network diagrams, credentials and security findings."),
      c("nda-obligations", "Obligations", "Each party will use confidential information only for the Purpose and protect it with at least the care it uses for its own."),
      c("nda-term", "Term", "These obligations last three years from the date of signature, and indefinitely for credentials and vulnerability details."),
    ],
  },
  {
    id: "msa",
    type: "MSA",
    name: "Master Services Agreement",
    description: "Umbrella terms for a client relationship. SOWs then sit underneath it.",
    clauses: [
      c("msa-services", "Services", "Beryll will provide the services described in each Statement of Work agreed under this Agreement."),
      c("msa-fees", "Fees and payment", "Fees are as set out in each SOW. Invoices are payable within thirty (30) days. Late payments carry interest at the statutory rate."),
      c("msa-data", "Data protection", "Where Beryll processes personal data for the client, the parties' Data Processing Agreement applies. Data stays in the EEA."),
      c("msa-liability", "Limitation of liability", "Each party's total liability is limited to the fees paid or payable in the 12 months before the claim. Neither party is liable for indirect loss."),
      c("msa-term", "Term and termination", "This Agreement lasts two years and either party may end it on 60 days' written notice. It does not renew automatically."),
      c("msa-law", "Governing law", "This Agreement is governed by the laws of Ireland and the Irish courts have exclusive jurisdiction."),
    ],
  },
];

export const SEED_CONTRACTS: AppContract[] = contracts.map(fromDemoContract);

/** Fresh card used by wt-approval-pipeline. Re-created on every run so the tour always starts clean. */
export const TOUR_PIPELINE_CONTRACT_ID = "tour-pipeline-sow";
export function tourPipelineContract(): AppContract {
  return {
    id: TOUR_PIPELINE_CONTRACT_ID,
    clientId: "harbourline-logistics",
    client: CLIENTS.find((x) => x.id === "harbourline-logistics")?.name ?? "Harbourline Logistics DAC",
    type: "SOW",
    title: "Warehouse Wi-Fi and WMS pentest",
    valueEur: 16800,
    status: "draft",
    owner: "You",
    updatedAt: new Date().toISOString(),
    clauses: [
      ...SOW_CORE,
      c("liability-2x", "Liability cap (client request)", "At Harbourline's request, Beryll's total liability under this SOW is increased to two times the fees paid or payable.", false),
    ],
    scope: { targets: "10.40.0.0/22, wms.harbourline.ie, warehouse SSIDs HL-OPS and HL-SCAN", window: "Weekdays 19:00 to 06:00", exclusions: "Forklift telematics gateway 10.40.3.17" },
    startDate: "2026-11-24",
    endDate: "2026-11-28",
    attachments: [],
    history: [],
  };
}

/** Client-supplied contract for the review view (and wt-review-contract). */
export const REVIEW_DOC: ReviewDoc = {
  id: "kestrel-ssa-client-paper",
  client: "Kestrel Health Technologies",
  type: "MSA",
  title: "Kestrel Supplier Services Agreement (client paper)",
  receivedAt: "2026-11-03",
  brief: "Kestrel's procurement team sent their own supplier agreement instead of ours. Read every clause, flag anything risky for Beryll, suggest an edit, then escalate to Legal.",
  clauses: [
    { id: "c1", heading: "1. Definitions", text: "\"Services\" means the security testing services described in any order. \"Supplier\" means Beryll Cyber Security Ltd." },
    { id: "c2", heading: "2. Services", text: "Supplier shall perform the Services with reasonable skill and care, in line with good industry practice." },
    { id: "c3", heading: "3. Scope", text: "Supplier may test any systems of the Customer and its affiliates that Supplier reasonably considers relevant to the Services." },
    { id: "c4", heading: "4. Liability", text: "Supplier's liability for any loss arising from the Services, including indirect and consequential loss, shall be unlimited." },
    { id: "c5", heading: "5. Payment", text: "Customer shall pay undisputed invoices within 120 days of receipt. Customer may withhold payment of any invoice it disputes in good faith." },
    { id: "c6", heading: "6. Data handling", text: "Supplier may store test evidence, including any personal data, with Customer's group hosting provider in the United States." },
    { id: "c7", heading: "7. Confidentiality", text: "Each party shall keep the other's confidential information secret for the term of this Agreement and two years after." },
    { id: "c8", heading: "8. Term", text: "This Agreement runs for 12 months and renews automatically for further 12-month periods unless terminated with 180 days' notice." },
  ],
};
