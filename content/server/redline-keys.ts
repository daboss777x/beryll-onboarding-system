import "server-only";
import type { RedlineKey } from "../schema";

export const redlineKeys: RedlineKey[] = [
  {
    "contractId": "redline-harbourline-msa",
    "risks": [
      {
        "id": "r1",
        "clauseId": "c3",
        "category": "payment",
        "severity": "medium",
        "whatIsWrong": "120-day payment terms with no late-payment interest. Beryll's standard is 30 days; the Head of Commercial can approve up to 45.",
        "suggestedFix": "Replace with payment within 30 days of invoice and statutory late-payment interest; offer 45 days at most, with Siobhán's approval.",
        "escalateToLegal": false
      },
      {
        "id": "r2",
        "clauseId": "c4",
        "category": "auto_renewal",
        "severity": "medium",
        "whatIsWrong": "A three-year initial term that auto-renews for three-year terms, and only the Supplier can stop it with nine months' notice: a notice trap that locks Beryll into prices and terms.",
        "suggestedFix": "Make the term 12 months, renewing annually, with mutual 60 days' notice, and a price review at each renewal.",
        "escalateToLegal": true
      },
      {
        "id": "r3",
        "clauseId": "c5",
        "category": "scope_change",
        "severity": "high",
        "whatIsWrong": "The Client may change scope, timetable and deliverables unilaterally with no change in fee. Engineers would be forced to deliver more for the same price, and any new target would need a new authorisation.",
        "suggestedFix": "Changes only by written change request agreed by both parties, with fees and dates adjusted, and no testing of new targets before a signed authorisation covers them.",
        "escalateToLegal": true
      },
      {
        "id": "r4",
        "clauseId": "c7",
        "category": "liability",
        "severity": "high",
        "whatIsWrong": "Unlimited liability for Beryll, while the Client's is capped. A single test incident could exceed the company's insurance. Our standard is a cap at fees paid in the previous 12 months.",
        "suggestedFix": "Mutual cap at fees paid or payable in the 12 months before the claim (legal may agree up to 2x). Unlimited liability never without Managing Director and legal approval.",
        "escalateToLegal": true
      },
      {
        "id": "r5",
        "clauseId": "c8",
        "category": "indemnity",
        "severity": "high",
        "whatIsWrong": "A no-fault indemnity covering all losses and third-party claims connected with the services, uncapped. This shifts all risk of security testing onto Beryll.",
        "suggestedFix": "Limit to third-party IP claims or Beryll's negligence or wilful default, and subject to the liability cap.",
        "escalateToLegal": true
      }
    ],
    "safeClauseIds": [
      "c1",
      "c2",
      "c6",
      "c9"
    ]
  },
  {
    "contractId": "redline-kestrel-sow",
    "risks": [
      {
        "id": "r1",
        "clauseId": "c3",
        "category": "authorisation",
        "severity": "high",
        "whatIsWrong": "Testing starts on a fixed date and signing the SOW is treated as consent. There is no separate signed authorisation-to-test letter naming the signatory's authority, target hosts, IP ranges, testing windows and emergency contacts. Testing without one risks an offence under computer-misuse law.",
        "suggestedFix": "Add: no testing begins until a signed authorisation-to-test (rules of engagement) from an authorised signatory is on file, and confirm any third-party hosting permissions.",
        "escalateToLegal": false
      },
      {
        "id": "r2",
        "clauseId": "c4",
        "category": "scope_change",
        "severity": "high",
        "whatIsWrong": "Uncapped extra systems at no charge in the same timescale. Scope creep with no fee change, and no authorisation for those systems.",
        "suggestedFix": "Extra systems only by a written change request with revised fee, dates and a new or amended authorisation.",
        "escalateToLegal": false
      },
      {
        "id": "r3",
        "clauseId": "c6",
        "category": "payment",
        "severity": "medium",
        "whatIsWrong": "Payment 90 days after acceptance at the Client's sole discretion means Beryll may never be paid. Standard is 30 days from invoice, with the invoice issued on report delivery.",
        "suggestedFix": "Invoice on delivery of the report; payment within 30 days; acceptance deemed after 10 working days without comments.",
        "escalateToLegal": false
      },
      {
        "id": "r4",
        "clauseId": "c7",
        "category": "confidentiality",
        "severity": "medium",
        "whatIsWrong": "Unrestricted sharing of the report. It is a Restricted document listing exploitable vulnerabilities and could expose Beryll's methods or be misrepresented.",
        "suggestedFix": "Client may share with its professional advisers and auditors under confidentiality, and may share a summary letter with customers. Beryll can supply a customer-facing attestation.",
        "escalateToLegal": true
      },
      {
        "id": "r5",
        "clauseId": "c8",
        "category": "liability",
        "severity": "high",
        "whatIsWrong": "Unlimited liability for any disruption, even inside the agreed scope and window. Testing carries a small inherent risk, so this exposes Beryll to unquantified loss.",
        "suggestedFix": "Apply the standard liability cap (fees paid in 12 months), a backup-before-test obligation on the Client, and agreed stop-test procedures.",
        "escalateToLegal": true
      }
    ],
    "safeClauseIds": [
      "c1",
      "c2",
      "c5",
      "c9"
    ]
  },
  {
    "contractId": "redline-corrib-dpa",
    "risks": [
      {
        "id": "r1",
        "clauseId": "c3",
        "category": "data_transfer",
        "severity": "high",
        "whatIsWrong": "Transfers to any country without notice or a transfer mechanism. Transfers outside the EU/EEA need an adequacy decision, SCCs or another lawful safeguard under GDPR.",
        "suggestedFix": "Processing stays in the EU/EEA; any transfer only with the Controller's prior written consent and SCCs or an equivalent safeguard.",
        "escalateToLegal": true
      },
      {
        "id": "r2",
        "clauseId": "c4",
        "category": "subprocessors",
        "severity": "high",
        "whatIsWrong": "Subprocessors can be appointed without notice and without flowing down obligations, which GDPR requires.",
        "suggestedFix": "Maintain a list of approved subprocessors, give 30 days' notice of changes with a right to object, and flow down equivalent terms in writing.",
        "escalateToLegal": true
      },
      {
        "id": "r3",
        "clauseId": "c6",
        "category": "confidentiality",
        "severity": "medium",
        "whatIsWrong": "Six hours from when the breach occurs, with a full root-cause report immediately, is unachievable: the clock should start at awareness, and root cause takes time.",
        "suggestedFix": "Notify without undue delay and in any case within 48 hours of becoming aware, with updates as facts emerge.",
        "escalateToLegal": true
      },
      {
        "id": "r4",
        "clauseId": "c7",
        "category": "liability",
        "severity": "high",
        "whatIsWrong": "Unlimited indemnity including regulatory fines. Fines may not be insurable or even indemnifiable, and the exposure is unbounded.",
        "suggestedFix": "Liability under the DPA falls within the cap in the MSA; no indemnity for fines imposed because of the Controller's own failings.",
        "escalateToLegal": true
      },
      {
        "id": "r5",
        "clauseId": "c8",
        "category": "data_transfer",
        "severity": "medium",
        "whatIsWrong": "Beryll may keep personal data indefinitely for its own purposes. A processor may not use data for its own purposes, and indefinite retention breaches storage limitation.",
        "suggestedFix": "Delete or return all personal data within 30 days of the end of the services (and certify deletion), except where law requires retention.",
        "escalateToLegal": true
      }
    ],
    "safeClauseIds": [
      "c1",
      "c2",
      "c5",
      "c9"
    ]
  }
];
