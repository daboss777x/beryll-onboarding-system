"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FastForward, RotateCcw } from "lucide-react";
import { demoJump, demoReset, demoSkipDays } from "@/app/(hire)/actions";
import { Button, Select, useToast } from "@/components/ui";
import { useReward } from "./useReward";

export interface StageOption {
  id: string;
  title: string;
}

/** Demo-only control: moves the hire's program day. Shown only in demo mode on demo profiles. */
export function DemoTimeSkip({ stages, programDay }: { stages: StageOption[]; programDay: number }) {
  const [pending, start] = useTransition();
  const [stage, setStage] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const reward = useReward();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) toast({ title: ok, tone: "info" });
      else toast({ title: "Time-skip failed", description: res.error, tone: "danger" });
      router.refresh();
    });

  return (
    <div className="rounded-lg border border-dashed border-border-strong p-3" aria-busy={pending}>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
        <FastForward size={14} aria-hidden /> Demo time-skip
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => demoSkipDays(1), `Moved to day ${programDay + 1}`)}>
          +1 day
        </Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => demoSkipDays(7), `Moved to day ${programDay + 7}`)}>
          +7 days
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          leftIcon={<RotateCcw size={14} aria-hidden />}
          onClick={() => run(demoReset, "Demo reset: back to day 0 and the starting progress")}
        >
          Reset
        </Button>
      </div>
      <form
        className="mt-2 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!stage) return;
          start(async () => {
            const res = await demoJump(stage);
            reward(res, "Jumped ahead");
            router.refresh();
          });
        }}
      >
        <Select
          aria-label="Jump to stage"
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          wrapperClassName="min-w-0 flex-1"
          className="min-h-10 text-sm"
        >
          <option value="">Jump to stage…</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </Select>
        <Button size="sm" type="submit" disabled={pending || !stage}>
          Go
        </Button>
      </form>
    </div>
  );
}
