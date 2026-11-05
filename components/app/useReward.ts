"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui";
import type { RewardResult } from "./reward-types";

/** Toasts for a task result: XP gained, stage done, and one celebratory toast per new trophy. */
export function useReward() {
  const { toast } = useToast();
  return useCallback(
    (res: RewardResult, okTitle = "Task complete") => {
      if (!res.ok) {
        toast({ title: "That did not save", description: res.error, tone: "danger" });
        return;
      }
      if (res.alreadyDone) toast({ title: "Already complete", description: "You finished this earlier. No extra XP this time.", tone: "info" });
      else if (res.passed) toast({ title: okTitle, description: res.xpGained ? `+${res.xpGained} XP` : undefined, tone: "success" });
      else toast({ title: "Not passed yet", description: res.xpGained ? `+${res.xpGained} XP for trying. Have another go.` : "Have another go.", tone: "warn" });
      for (const s of res.stagesCompleted) toast({ title: `Stage complete: ${s}`, description: "The next stage is opening up.", tone: "success", duration: 7000 });
      for (const t of res.trophies) toast({ title: `Trophy earned: ${t.name}`, description: t.description, tone: "success", duration: 8000 });
    },
    [toast],
  );
}
