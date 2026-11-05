import "server-only";
import type { PersonaCard, PersonaSecret, RedlineContract, RedlineKey, Rubric, Sop, TranslatorPublic, TranslatorRubric } from "@/content/schema";
import { personaCards } from "@/content/personas/cards";
import { personaSecrets } from "@/content/server/persona-secrets";
import { rubric } from "@/content/server/rubric";
import { redlineKeys } from "@/content/server/redline-keys";
import { translatorRubric } from "@/content/server/translator-rubric";
import { redlineContracts } from "@/content/labs/redline-contracts";
import { translatorDrills } from "@/content/labs/translator-drills";
import { staff } from "@/content/staff";
import { sops } from "@/content/sops";
import type { StaffMember } from "../types";

/** Typed, server-only access to the content the AI features need. */

export const CERT_PERSONA_ID = "cert-healthtech";

export function getPersona(id: string): { card: PersonaCard; secret: PersonaSecret } | null {
  const card = personaCards.find((p) => p.id === id);
  const secret = personaSecrets.find((s) => s.personaId === id);
  return card && secret ? { card, secret } : null;
}

export function getRubric(): Rubric {
  return rubric;
}

export function getRedline(contractId: string): { contract: RedlineContract; key: RedlineKey } | null {
  const contract = redlineContracts.find((c) => c.id === contractId);
  const key = redlineKeys.find((k) => k.contractId === contractId);
  return contract && key ? { contract, key } : null;
}

export type TranslatorItem =
  | { kind: "finding"; item: TranslatorPublic["findings"][number]; key: TranslatorRubric["findings"][number] }
  | { kind: "ask"; item: TranslatorPublic["asks"][number]; key: TranslatorRubric["asks"][number] };

export function getTranslatorItem(itemId: string): TranslatorItem | null {
  const f = translatorDrills.findings.find((x) => x.id === itemId);
  const fk = translatorRubric.findings.find((x) => x.findingId === itemId);
  if (f && fk) return { kind: "finding", item: f, key: fk };
  const a = translatorDrills.asks.find((x) => x.id === itemId);
  const ak = translatorRubric.asks.find((x) => x.askId === itemId);
  if (a && ak) return { kind: "ask", item: a, key: ak };
  return null;
}

export function getTranslatorScoringNote(): string {
  return translatorRubric.scoring;
}

/** SOPs for Ask Beryl (the embed script reads content/sops directly). */
export function getSops(): Sop[] {
  return sops;
}

export function getStaffContent(): StaffMember[] {
  return staff;
}

/** Server-side checklist for the SOW draft check (labId "sow-check"). */
export interface SowElement {
  id: "scope" | "exclusions" | "timeline" | "authorisation" | "liability" | "payment";
  label: string;
  keywords: RegExp[];
  why: string;
  model: string;
}

export const SOW_ELEMENTS: SowElement[] = [
  {
    id: "scope",
    label: "Scope",
    keywords: [/\bin[- ]scope\b/i, /\bscope\b/i, /\btargets?\b/i, /\b(ip|url|host|application|app|endpoint|domain)s?\b/i],
    why: "The engineers need an exact list of what they may test.",
    model: "In scope: the customer portal at portal.example.ie and its API (12 endpoints), tested from the internet.",
  },
  {
    id: "exclusions",
    label: "Exclusions",
    keywords: [/\bout[- ]of[- ]scope\b/i, /\bexclu(de|ded|sion|sions)\b/i, /\bnot (included|in scope)\b/i],
    why: "Saying what is out of scope protects both sides from scope creep and accidental testing.",
    model: "Out of scope: third-party payment provider, denial-of-service testing and social engineering.",
  },
  {
    id: "timeline",
    label: "Timeline",
    keywords: [/\btimeline\b/i, /\bschedule\b/i, /\bstart(s|ing)? (date|on)\b/i, /\b\d+\s*(working\s*)?(days?|weeks?)\b/i, /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i, /\bdeadline\b/i],
    why: "Dates and testing windows set expectations and tell operations when to expect traffic.",
    model: "Testing 2-6 March (5 working days), draft report by 13 March, retest within 30 days.",
  },
  {
    id: "authorisation",
    label: "Authorisation to test",
    keywords: [/\bauthori[sz](ation|ed|e)\b/i, /\bpermission to test\b/i, /\bletter of authority\b/i, /\bconsent\b/i],
    why: "No testing starts without signed authorisation from someone entitled to give it.",
    model: "Testing starts only after the client's Head of IT signs Beryll's authorisation-to-test form.",
  },
  {
    id: "liability",
    label: "Liability",
    keywords: [/\bliabilit(y|ies)\b/i, /\bcap(ped)?\b/i, /\blimited to\b/i, /\bindemn/i],
    why: "Liability must follow the MSA cap; unlimited liability is an escalation to legal.",
    model: "Liability is capped as set out in the MSA (fees paid in the previous 12 months).",
  },
  {
    id: "payment",
    label: "Payment",
    keywords: [/\bpayment\b/i, /\binvoice[sd]?\b/i, /€\s*\d|\beur\b/i, /\bfees?\b/i, /\bnet\s*\d+\b/i, /\bpurchase order\b|\bpo\b/i],
    why: "Fees, invoicing points and terms avoid disputes later.",
    model: "Fixed fee EUR 14,500 ex VAT; 50% invoiced on signature, 50% on report delivery, net 30.",
  },
];
