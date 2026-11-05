"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useToast } from "@/components/ui";
import type { WalkthroughResult } from "@/content/walkthroughs/types";

/** May return anything; a returned `{ ok: false }` is treated as a failed save. */
export type WalkthroughCompleteHandler = (result: WalkthroughResult) => unknown;
/** The handler answered `{ ok: false, error }`: the message is shown to the hire as is. */
class SaveRefused extends Error {}

const Ctx = createContext<WalkthroughCompleteHandler | null>(null);

/**
 * Optional: wrap a subtree to persist results for every WalkthroughHost inside it.
 * An `onComplete` prop on WalkthroughHost takes precedence over this provider.
 */
export function WalkthroughResultProvider({ onComplete, children }: { onComplete: WalkthroughCompleteHandler; children: ReactNode }) {
  return <Ctx.Provider value={onComplete}>{children}</Ctx.Provider>;
}

/**
 * Returns report(result). Guided and Solo results go to the handler (prop, else provider, else
 * console). Watch results go to the handler only when watched to the end. Incomplete runs (hire exited early) are reported
 * silently; finished runs show a toast.
 */
export function useWalkthroughResult(override?: WalkthroughCompleteHandler) {
  const fromCtx = useContext(Ctx);
  const handler = override ?? fromCtx;
  const { toast } = useToast();
  const report = useCallback(
    async (r: WalkthroughResult) => {
      try {
        // Watch runs are persisted only when watched to the end (the roadmap's watch tasks need them).
        if (r.mode !== "watch" || r.completed) {
          if (handler) {
            const res = await handler(r);
            if (res && typeof res === "object" && (res as { ok?: unknown }).ok === false) {
              const msg = (res as { error?: unknown }).error;
              throw new SaveRefused(typeof msg === "string" && msg ? msg : "save failed");
            }
          }
          else console.info("[walkthrough] result", r);
        }
        if (!r.completed) return;
        toast({
          title: r.passed ? "Walkthrough complete" : "Run finished",
          description: r.mode === "watch" ? "Now try it yourself in Guided mode." : r.passed ? `Score ${r.score}: ${r.errors} error${r.errors === 1 ? "" : "s"}.` : "More than 2 errors. Have another go.",
          tone: r.passed ? "success" : "warn",
        });
      } catch (err) {
        console.error("[walkthrough] could not save result", err);
        // A refusal from the server (e.g. the daily attempt cap) carries a message written for the hire.
        if (r.completed) toast({ title: "Couldn't save your result", description: err instanceof SaveRefused ? err.message : "Your run finished, but we couldn't record it. Try again later.", tone: err instanceof SaveRefused ? "warn" : "danger" });
      }
    },
    [handler, toast],
  );
  return { report };
}
