"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { saveChecklist } from "@/app/(hire)/actions";
import { Button, Checkbox, ProgressBar, buttonStyles, useToast } from "@/components/ui";
import { useReward } from "./useReward";

export interface ChecklistItemView {
  id: string;
  title: string;
  detail: string;
  why?: string;
}

export function ChecklistForm({ checklistId, items, initialChecked, done }: { checklistId: string; items: ChecklistItemView[]; initialChecked: string[]; done: boolean }) {
  const [checked, setChecked] = useState<Set<string>>(new Set(done ? items.map((i) => i.id) : initialChecked));
  const [finished, setFinished] = useState(done);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const reward = useReward();
  const { toast } = useToast();
  const router = useRouter();
  const pct = items.length ? Math.round((checked.size / items.length) * 100) : 0;
  const all = checked.size === items.length;

  const save = () =>
    start(async () => {
      const res = await saveChecklist(checklistId, [...checked]);
      if ("saved" in res) {
        toast({ title: "Progress saved", description: `${checked.size} of ${items.length} done.`, tone: "info" });
      } else {
        reward(res, "Checklist complete");
        if (res.ok) setFinished(true);
      }
      if (res.ok) setDirty(false);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <ProgressBar value={pct} label={`${checked.size} of ${items.length} done`} />
      <ul className="flex flex-col divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="py-3">
            <Checkbox
              label={item.title}
              description={item.why ? `${item.detail} Why: ${item.why}` : item.detail}
              checked={checked.has(item.id)}
              disabled={finished || pending}
              onChange={(e) => {
                const next = new Set(checked);
                if (e.target.checked) next.add(item.id);
                else next.delete(item.id);
                setChecked(next);
                setDirty(true);
              }}
            />
          </li>
        ))}
      </ul>
      {finished ? (
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <p className="flex items-center gap-1.5 font-medium text-success">
            <CheckCircle2 size={18} aria-hidden /> All done
          </p>
          <Link href="/today" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Back to Today
          </Link>
        </div>
      ) : (
        <Button size="lg" className="self-start" loading={pending} disabled={pending || (!dirty && !all)} onClick={save}>
          {all ? "Complete checklist" : "Save progress"}
        </Button>
      )}
    </div>
  );
}
