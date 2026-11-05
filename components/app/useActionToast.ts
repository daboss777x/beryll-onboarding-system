"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui";
import type { ActionResult } from "./action-types";

/** Toast for a manager/buddy action result. Returns true on success. */
export function useActionToast() {
  const { toast } = useToast();
  return useCallback(
    (res: ActionResult, okTitle = "Saved") => {
      if (res.ok) toast({ title: okTitle, description: res.message, tone: "success" });
      else toast({ title: "That did not save", description: res.error, tone: "danger" });
      return res.ok;
    },
    [toast],
  );
}
