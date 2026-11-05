"use client";

// Thin client-side adapter for the Beryll Contracts sandbox.
//
// Decision (Davis, 2026-11-04): the sandbox stays per-browser (localStorage) for the demo.
// It is practice state only: nothing here awards XP or completes tasks. Walkthrough results go
// through the server action app/(hire)/contracts/actions.ts, which re-scores them. If the
// sandbox ever needs to be cross-device or graded, move these side effects into server actions
// on getRepo() (listContracts / createContract / updateContractClauses / moveContractStatus),
// keep the useContracts API unchanged, and run ./rules.ts canMove() on the server too.
// Seeded from Tom's content/demo-contracts.ts via ./fixtures.ts (fromDemoContract).

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { REVIEW_DOC, SEED_CONTRACTS, tourPipelineContract } from "./fixtures";
import { canMove, statusAfterClauseEdit, type MoveCheck } from "./rules";
import type { AppContract, ClauseFlag, Clause, ContractStatus, ReviewState } from "./types";

export interface ContractsState {
  contracts: AppContract[];
  reviews: Record<string, ReviewState>;
}

type Action =
  | { type: "hydrate"; state: ContractsState }
  | { type: "create"; contract: AppContract }
  | { type: "setClauses"; id: string; clauses: Clause[] }
  | { type: "move"; id: string; to: ContractStatus }
  | { type: "attach"; id: string }
  | { type: "flag"; docId: string; flag: ClauseFlag }
  | { type: "unflag"; docId: string; clauseId: string }
  | { type: "escalate"; docId: string }
  | { type: "tourSetup"; walkthroughId: string }
  | { type: "reset" };

const nowIso = () => new Date().toISOString();

export function seedState(): ContractsState {
  return { contracts: SEED_CONTRACTS.map((c) => ({ ...c })), reviews: {} };
}

function patch(state: ContractsState, id: string, fn: (c: AppContract) => AppContract): ContractsState {
  return { ...state, contracts: state.contracts.map((c) => (c.id === id ? { ...fn(c), updatedAt: nowIso() } : c)) };
}

function reducer(state: ContractsState, a: Action): ContractsState {
  switch (a.type) {
    case "hydrate":
      return a.state;
    case "create":
      return { ...state, contracts: [a.contract, ...state.contracts.filter((c) => c.id !== a.contract.id)] };
    case "setClauses":
      return patch(state, a.id, (c) => ({ ...c, clauses: a.clauses, status: statusAfterClauseEdit(c, a.clauses) }));
    case "move":
      return patch(state, a.id, (c) => ({ ...c, status: a.to, history: [...c.history, { at: nowIso(), from: c.status, to: a.to }] }));
    case "attach":
      return patch(state, a.id, (c) =>
        c.attachments.some((x) => x.kind === "authorisation")
          ? c
          : { ...c, attachments: [...c.attachments, { id: `att-${Date.now()}`, kind: "authorisation", name: "Authorisation to Test (signed).pdf", addedAt: nowIso() }] },
      );
    case "flag": {
      const r = state.reviews[a.docId] ?? { flags: {} };
      return { ...state, reviews: { ...state.reviews, [a.docId]: { ...r, flags: { ...r.flags, [a.flag.clauseId]: a.flag } } } };
    }
    case "unflag": {
      const r = state.reviews[a.docId];
      if (!r) return state;
      const flags = { ...r.flags };
      delete flags[a.clauseId];
      return { ...state, reviews: { ...state.reviews, [a.docId]: { ...r, flags } } };
    }
    case "escalate": {
      const r = state.reviews[a.docId] ?? { flags: {} };
      return { ...state, reviews: { ...state.reviews, [a.docId]: { ...r, escalatedAt: nowIso() } } };
    }
    case "tourSetup":
      if (a.walkthroughId === "wt-approval-pipeline") {
        const t = tourPipelineContract();
        return { ...state, contracts: [t, ...state.contracts.filter((c) => c.id !== t.id)] };
      }
      if (a.walkthroughId === "wt-review-contract") {
        return { ...state, reviews: { ...state.reviews, [REVIEW_DOC.id]: { flags: {} } } };
      }
      return state;
    case "reset":
      return seedState();
  }
}

export type MoveResult = MoveCheck & { from?: ContractStatus };

/**
 * The sandbox API the components use. Every mutation returns a Promise so this adapter can be
 * swapped for server actions without touching the components. Today it resolves immediately
 * (localStorage); a rejected Promise means "not saved" and the components show an error toast.
 */
export interface ContractsApi {
  state: ContractsState;
  hydrated: boolean;
  createContract: (c: AppContract) => Promise<void>;
  setClauses: (id: string, clauses: Clause[]) => Promise<void>;
  /** Checks the approval rules (./rules.ts) and applies the move only when allowed. */
  moveContract: (id: string, to: ContractStatus) => Promise<MoveResult>;
  attachAuthorisation: (id: string) => Promise<void>;
  flagClause: (docId: string, flag: ClauseFlag) => Promise<void>;
  removeFlag: (docId: string, clauseId: string) => Promise<void>;
  escalate: (docId: string) => Promise<void>;
  /** Puts the sandbox in a walkthrough's start state. Synchronous: it runs before the first step. */
  prepareTour: (walkthroughId: string) => void;
  resetSandbox: () => Promise<void>;
}

const Ctx = createContext<ContractsApi | null>(null);

const storageKey = (userId: string) => `beryll-contracts:v1:${userId}`;

function load(userId: string): ContractsState | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const s = JSON.parse(raw) as ContractsState;
    return Array.isArray(s?.contracts) && s.reviews && typeof s.reviews === "object" ? s : null;
  } catch {
    return null;
  }
}

export function ContractsProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, seedState);
  const stateRef = useRef(state);
  const hydratedRef = useRef(false);
  const pendingTour = useRef<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /** Dispatch and keep stateRef in step, so rule checks right after an action see it. */
  const apply = useCallback((a: Action) => {
    dispatch(a);
    stateRef.current = reducer(stateRef.current, a);
  }, []);

  useEffect(() => {
    const saved = load(userId);
    if (saved) apply({ type: "hydrate", state: saved });
    // A walkthrough that started before hydration (child effects run first) is re-applied on top
    // of the saved state, otherwise hydration would wipe its fresh tour data.
    if (pendingTour.current) apply({ type: "tourSetup", walkthroughId: pendingTour.current });
    pendingTour.current = null;
    hydratedRef.current = true;
    setHydrated(true);
  }, [userId, apply]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(state));
    } catch {
      /* storage full or blocked: sandbox still works in memory */
    }
  }, [state, userId]);

  const api = useMemo<ContractsApi>(() => {
    const run = (a: Action) => {
      apply(a);
      return Promise.resolve();
    };
    return {
      state,
      hydrated,
      createContract: (contract) => run({ type: "create", contract }),
      setClauses: (id, clauses) => run({ type: "setClauses", id, clauses }),
      moveContract: async (id, to) => {
        const c = stateRef.current.contracts.find((x) => x.id === id);
        if (!c) return { ok: false, title: "Contract not found", reason: "It may have been removed. Refresh and try again." };
        const check = canMove(c, to);
        if (check.ok) apply({ type: "move", id, to });
        return { ...check, from: c.status };
      },
      attachAuthorisation: (id) => run({ type: "attach", id }),
      flagClause: (docId, flag) => run({ type: "flag", docId, flag }),
      removeFlag: (docId, clauseId) => run({ type: "unflag", docId, clauseId }),
      escalate: (docId) => run({ type: "escalate", docId }),
      prepareTour: (walkthroughId) => {
        if (!hydratedRef.current) pendingTour.current = walkthroughId;
        apply({ type: "tourSetup", walkthroughId });
      },
      resetSandbox: () => run({ type: "reset" }),
    };
  }, [state, hydrated, apply]);

  return createElement(Ctx.Provider, { value: api }, children);
}

export function useContracts(): ContractsApi {
  const c = useContext(Ctx);
  if (!c) throw new Error("useContracts must be used inside <ContractsProvider>");
  return c;
}
