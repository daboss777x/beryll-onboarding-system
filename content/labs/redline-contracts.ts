import type { RedlineContract } from "../schema";

/** Three fictional client contracts for the Contract Redline Lab. Risks are planted; the key is in content/server/redline-keys.ts. */
export const redlineContracts: RedlineContract[] = [
  {
    "id": "redline-harbourline-msa",
    "docType": "MSA",
    "title": "Master Services Agreement",
    "client": "Harbourline Logistics DAC",
    "brief": "Harbourline Logistics is a Cork freight firm and a new prospect. Their procurement team sent their own paper rather than ours. You have 20 minutes before the call: highlight every clause that puts Beryll or the engagement at risk, say why, and decide whether to escalate to legal.",
    "clauses": [
      {
        "id": "c1",
        "heading": "1. Parties and purpose",
        "text": "This Master Services Agreement is made between Harbourline Logistics DAC (the Client) and Beryll Cyber Security Limited (the Supplier) and sets the terms on which the Supplier provides security testing and related services described in each Statement of Work."
      },
      {
        "id": "c2",
        "heading": "2. Services",
        "text": "The Supplier shall provide the services described in each Statement of Work with reasonable skill and care, by suitably qualified personnel. Each Statement of Work forms part of this Agreement once signed by both parties."
      },
      {
        "id": "c3",
        "heading": "3. Fees and payment",
        "text": "The Client shall pay each undisputed invoice within one hundred and twenty (120) days of the date of receipt of the invoice. No interest shall accrue on late payments."
      },
      {
        "id": "c4",
        "heading": "4. Term and renewal",
        "text": "This Agreement commences on the Effective Date and continues for an initial term of three (3) years. It shall automatically renew for successive three (3) year terms unless the Supplier gives written notice of non-renewal at least nine (9) months before the end of the then-current term."
      },
      {
        "id": "c5",
        "heading": "5. Change of scope",
        "text": "The Client may, at any time and by written notice, vary the scope, timetable or deliverables of any Statement of Work. The Supplier shall implement the variation without any adjustment to the fees."
      },
      {
        "id": "c6",
        "heading": "6. Confidentiality",
        "text": "Each party shall keep confidential all non-public information received from the other, use it only to perform this Agreement, and protect it with at least the care it uses for its own confidential information. This obligation survives for five (5) years after termination."
      },
      {
        "id": "c7",
        "heading": "7. Limitation of liability",
        "text": "The Supplier's liability to the Client arising out of or in connection with this Agreement, whether in contract, tort (including negligence) or otherwise, shall be unlimited. The Client's liability shall not exceed the fees paid in the twelve months before the claim."
      },
      {
        "id": "c8",
        "heading": "8. Indemnity",
        "text": "The Supplier shall indemnify the Client against all losses, costs, claims and expenses, including claims by third parties, arising from or connected with the services, regardless of whether the Supplier was at fault."
      },
      {
        "id": "c9",
        "heading": "9. Governing law",
        "text": "This Agreement and any dispute arising from it are governed by the laws of Ireland, and the parties submit to the exclusive jurisdiction of the Irish courts."
      }
    ]
  },
  {
    "id": "redline-kestrel-sow",
    "docType": "SOW",
    "title": "Statement of Work: Patient Portal Penetration Test",
    "client": "Kestrel Health Technologies Ltd",
    "brief": "Kestrel Health Technologies makes software for GP practices. The CTO has drafted this SOW himself to save time and wants it signed this week. Check the draft against Beryll's SOW rules and flag what must change before engineering sees it.",
    "clauses": [
      {
        "id": "c1",
        "heading": "1. Background",
        "text": "Kestrel Health Technologies Ltd (the Client) engages Beryll Cyber Security Limited (the Supplier) to carry out a web application penetration test of the Client's patient portal at portal.kestrel-health.example."
      },
      {
        "id": "c2",
        "heading": "2. Scope",
        "text": "The in-scope assets are the patient portal web application, its public API and the supporting authentication service. Out of scope: the Client's corporate network, third-party payment provider and the production database servers."
      },
      {
        "id": "c3",
        "heading": "3. Start of work",
        "text": "The Supplier will begin testing on 18 November 2026. The Client agrees that signing this SOW constitutes the Client's consent to the Supplier carrying out the Services."
      },
      {
        "id": "c4",
        "heading": "4. Additional systems",
        "text": "The Supplier shall also test any additional systems or applications that the Client identifies during the engagement, at no additional charge, within the same timescale."
      },
      {
        "id": "c5",
        "heading": "5. Deliverables",
        "text": "The Supplier will deliver a written report with an executive summary, technical findings ranked by severity, and remediation advice within ten (10) working days of completing testing."
      },
      {
        "id": "c6",
        "heading": "6. Fees and payment",
        "text": "The fee is a fixed price of EUR 18,500 excluding VAT. The Client shall pay the full fee ninety (90) days after the Client has, in its sole discretion, accepted the report."
      },
      {
        "id": "c7",
        "heading": "7. Report handling",
        "text": "The Client may publish the report or share it with any third party, including customers and prospective customers, without restriction and without the Supplier's consent."
      },
      {
        "id": "c8",
        "heading": "8. Liability for disruption",
        "text": "The Supplier shall be liable, without limit, for any outage, data loss or disruption to the Client's systems resulting from the testing, even where testing was within the agreed window and scope."
      },
      {
        "id": "c9",
        "heading": "9. Retest",
        "text": "One retest of the findings reported as Critical or High is included if requested within sixty (60) days of delivery of the report."
      }
    ]
  },
  {
    "id": "redline-corrib-dpa",
    "docType": "DPA",
    "title": "Data Processing Agreement",
    "client": "Corrib Payments Limited",
    "brief": "Corrib Payments, a Galway payments start-up, will give Beryll access to systems containing cardholder and customer personal data during a security assessment. They have sent their DPA. Review it as the contract owner and decide what goes to Amara Okafor in Legal.",
    "clauses": [
      {
        "id": "c1",
        "heading": "1. Roles",
        "text": "Corrib Payments Limited is the controller and Beryll Cyber Security Limited is the processor of any personal data that Beryll accesses while performing the services under the Master Services Agreement."
      },
      {
        "id": "c2",
        "heading": "2. Instructions and purpose",
        "text": "The Processor shall process personal data only on the Controller's documented instructions and only for the purpose of performing the security assessment, including with regard to transfers of personal data, unless required by law."
      },
      {
        "id": "c3",
        "heading": "3. International transfers",
        "text": "The Processor may transfer personal data to any country in the world, including to affiliates and service providers, without further notice to or consent from the Controller. No transfer mechanism is required."
      },
      {
        "id": "c4",
        "heading": "4. Subprocessors",
        "text": "The Processor may appoint or replace any subprocessor at any time without notifying the Controller and without flowing down these obligations in writing."
      },
      {
        "id": "c5",
        "heading": "5. Security measures",
        "text": "The Processor shall implement appropriate technical and organisational measures to protect personal data, including encryption in transit and at rest, access controls on a need-to-know basis, and staff confidentiality commitments."
      },
      {
        "id": "c6",
        "heading": "6. Personal data breach",
        "text": "The Processor shall notify the Controller of any actual or suspected personal data breach within six (6) hours of the breach occurring, with a full root-cause report at the time of notification."
      },
      {
        "id": "c7",
        "heading": "7. Liability",
        "text": "The Processor shall indemnify the Controller without limit for all losses, including administrative fines imposed on the Controller by any supervisory authority, arising from the Processor's processing."
      },
      {
        "id": "c8",
        "heading": "8. Return and deletion",
        "text": "On termination of the services, the Processor shall retain a copy of all personal data for an indefinite period for its own business purposes, and shall delete it only on the Controller's written request."
      },
      {
        "id": "c9",
        "heading": "9. Staff and confidentiality",
        "text": "The Processor shall ensure that persons authorised to process personal data are bound by confidentiality obligations and have received appropriate training in data protection."
      }
    ]
  }
];
