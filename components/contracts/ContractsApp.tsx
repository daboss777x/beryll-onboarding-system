"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileSearch, FileText, SquareKanban } from "lucide-react";
import { GemMark } from "@/components/brand";
import { Badge, cn } from "@/components/ui";
import { WalkthroughHost, type WalkthroughCompleteHandler } from "@/components/walkthrough";
import { emitTour } from "@/components/walkthrough/bus";
import type { Walkthrough } from "@/content/walkthroughs/types";
import { ApprovalBoard } from "./ApprovalBoard";
import { ContractList } from "./ContractList";
import { ContractReview } from "./ContractReview";
import { ContractsProvider, useContracts } from "./data";
import { NewContractFlow } from "./NewContractFlow";
import type { ContractsView } from "./types";

const TABS = [
  { view: "list", label: "Contracts", icon: FileText },
  { view: "board", label: "Approval board", icon: SquareKanban },
  { view: "review", label: "Contract review", icon: FileSearch },
] as const;

/**
 * Beryll Contracts mini-app. Needs a <Suspense> boundary above it (reads search params).
 * `onWalkthroughComplete` gets Guided/Solo walkthrough results (a server action works here).
 */
export function ContractsApp({ userId = "demo", onWalkthroughComplete }: { userId?: string; onWalkthroughComplete?: WalkthroughCompleteHandler }) {
  return (
    <ContractsProvider userId={userId}>
      <Shell onWalkthroughComplete={onWalkthroughComplete} />
    </ContractsProvider>
  );
}

function Shell({ onWalkthroughComplete }: { onWalkthroughComplete?: WalkthroughCompleteHandler }) {
  const params = useSearchParams();
  const initial = params.get("view");
  const [view, setView] = useState<ContractsView>(initial === "board" || initial === "review" ? initial : "list");
  const [highlight, setHighlight] = useState<string>();
  const { prepareTour } = useContracts();

  const go = (v: ContractsView) => {
    setView(v);
    emitTour("view.changed", { view: v });
  };

  const onSetup = useCallback(
    (wt: Walkthrough) => {
      prepareTour(wt.id);
      setHighlight(undefined);
      setView(wt.startView);
    },
    [prepareTour],
  );

  const tabView = view === "new" ? "list" : view;

  return (
    <div data-tour="contracts-app" className="flex min-h-[70dvh] flex-col gap-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="glass flex size-11 items-center justify-center rounded-lg">
            <GemMark size={24} />
          </span>
          <div>
            <h1 id="contracts-heading" tabIndex={-1} className="text-2xl font-semibold outline-none">
              Beryll Contracts
            </h1>
            <p className="text-sm text-muted">
              Practice sandbox <Badge tone="aqua" className="ml-1">Your copy</Badge>
            </p>
          </div>
        </div>
        <nav aria-label="Contracts sections" className="glass inline-flex max-w-full gap-1 self-start overflow-x-auto rounded-lg p-1 sm:self-auto">
          {TABS.map((t) => {
            const on = tabView === t.view;
            const Icon = t.icon;
            return (
              <button
                key={t.view}
                type="button"
                data-tour={`tab-${t.view}`}
                aria-current={on ? "page" : undefined}
                onClick={() => go(t.view)}
                className={cn("inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-md px-3.5 text-sm font-medium transition", on ? "bg-accent text-on-accent shadow-glass" : "text-muted hover:text-text")}
              >
                <Icon size={16} aria-hidden />
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      {view === "list" && (
        <ContractList
          highlightId={highlight}
          onNew={() => {
            setView("new");
            emitTour("contract.new_started", {});
          }}
        />
      )}
      {view === "new" && (
        <NewContractFlow
          onCancel={() => setView("list")}
          onSaved={(c) => {
            setHighlight(c.id);
            setView("list");
          }}
        />
      )}
      {view === "board" && <ApprovalBoard />}
      {view === "review" && <ContractReview />}

      <WalkthroughHost onSetup={onSetup} onComplete={onWalkthroughComplete} exitFocusId="contracts-heading" />
    </div>
  );
}
