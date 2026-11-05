"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { confirmQuestAction, sendKudosAction } from "@/app/(buddy)/actions";
import { Button, Textarea } from "@/components/ui";
import { useActionToast } from "./useActionToast";

export function ConfirmQuestButton({ questId, title }: { questId: string; title: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const notify = useActionToast();
  const router = useRouter();
  if (done)
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
        <CheckCircle2 size={16} aria-hidden /> Confirmed
      </span>
    );
  return (
    <Button
      size="sm"
      loading={pending}
      aria-label={`Confirm: ${title}`}
      onClick={() =>
        start(async () => {
          const res = await confirmQuestAction(questId);
          if (notify(res, "Quest confirmed")) setDone(true);
          router.refresh();
        })
      }
    >
      Confirm it happened
    </Button>
  );
}

export function KudosForm({ firstName, starters }: { firstName: string; starters: string[] }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const notify = useActionToast();
  const router = useRouter();
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await sendKudosAction(text);
          if (notify(res, "Kudos sent")) setText("");
          router.refresh();
        });
      }}
    >
      <ul className="flex flex-wrap gap-2" aria-label="Starters">
        {starters.map((s) => (
          <li key={s}>
            <button type="button" onClick={() => setText(s)} className="min-h-9 rounded-full border border-border bg-surface px-3 text-xs hover:bg-surface-strong">
              {s}
            </button>
          </li>
        ))}
      </ul>
      <Textarea label={`Kudos for ${firstName}`} rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Name one specific thing they did well." />
      <Button type="submit" loading={pending} disabled={pending || text.trim().length < 5} className="self-start">
        Send kudos
      </Button>
    </form>
  );
}
