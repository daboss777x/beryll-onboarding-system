// Beryll Contracts mini-app domain types.
// Compatible with Tom's content shapes in content/schema.ts (Contract, Clause, SowTemplate, Client)
// plus the sandbox-only fields the mini-app needs (scope, dates, attachments, history).

export const CONTRACT_TYPES = ["NDA", "MSA", "SOW", "DPA", "Authorisation"] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

/** Approval board columns, in order. Harry owns this set (lib/data ContractStatus is a string). */
export const CONTRACT_STATUSES = ["draft", "legal_review", "engineer_signoff", "sent", "signed"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const STATUS_LABEL: Record<ContractStatus, string> = {
  draft: "Draft",
  legal_review: "Legal Review",
  engineer_signoff: "Engineer Sign-off",
  sent: "Sent to Client",
  signed: "Signed",
};

export interface Clause {
  id: string;
  title: string;
  text: string;
  /** false = non-standard wording: Legal must review before the contract moves on. */
  standard: boolean;
}

export interface LibraryClause extends Clause {
  guidance: string;
  /** Template types this clause can be added to. */
  appliesTo: ContractType[];
}

export interface ClientOrg {
  id: string;
  name: string;
  sector: string;
  country: string;
  contactName: string;
}

export interface SowScope {
  targets: string;
  window: string;
  exclusions: string;
}

export interface Attachment {
  id: string;
  kind: "authorisation";
  name: string;
  addedAt: string;
}

export interface ContractEvent {
  at: string;
  from: ContractStatus;
  to: ContractStatus;
}

export interface AppContract {
  id: string;
  clientId: string;
  client: string;
  type: ContractType;
  title: string;
  valueEur: number;
  status: ContractStatus;
  owner: string;
  updatedAt: string; // ISO
  clauses: Clause[];
  scope?: SowScope;
  startDate?: string; // ISO date
  endDate?: string;
  attachments: Attachment[];
  history: ContractEvent[];
}

export type TemplateId = "sow" | "nda" | "msa";

export interface ContractTemplate {
  id: TemplateId;
  type: ContractType;
  name: string;
  description: string;
  /** Core clauses every contract from this template starts with. */
  clauses: Clause[];
}

export const RISK_TYPES = ["liability", "data_transfer", "payment_terms", "scope", "authorisation", "auto_renewal", "other"] as const;
export type RiskType = (typeof RISK_TYPES)[number];
export const RISK_LABEL: Record<RiskType, string> = {
  liability: "Liability",
  data_transfer: "Data transfer",
  payment_terms: "Payment terms",
  scope: "Scope",
  authorisation: "Authorisation",
  auto_renewal: "Auto-renewal",
  other: "Other",
};

export interface ReviewDoc {
  id: string;
  client: string;
  type: ContractType;
  title: string;
  receivedAt: string;
  brief: string;
  clauses: { id: string; heading: string; text: string }[];
}

export interface ClauseFlag {
  clauseId: string;
  risk: RiskType;
  suggestion: string;
  at: string;
}

export interface ReviewState {
  flags: Record<string, ClauseFlag>;
  escalatedAt?: string;
}

export type ContractsView = "list" | "new" | "board" | "review";
