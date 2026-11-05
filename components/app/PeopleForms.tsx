"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Plus } from "lucide-react";
import { addShadowLogEntry, requestQuest } from "@/app/(hire)/actions";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { QUEST_TYPES, SHADOW_KINDS, type QuestType } from "./people-copy";
import { useActionToast } from "./useActionToast";

interface StaffOption {
  id: string;
  name: string;
  team: string;
}

/** "Plan a coffee" on a people-map card. */
export function MeetButton({ staffId, firstName, planned }: { staffId: string; firstName: string; planned: boolean }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(planned);
  const notify = useActionToast();
  const router = useRouter();
  if (done) return <span className="text-xs font-medium text-muted">Coffee on your quest list</span>;
  return (
    <Button
      size="sm"
      variant="secondary"
      loading={pending}
      leftIcon={<Coffee size={14} aria-hidden />}
      aria-label={`Plan a coffee with ${firstName}`}
      onClick={() =>
        start(async () => {
          const res = await requestQuest({ staffId, type: "coffee" });
          if (notify(res, "Quest added")) setDone(true);
          router.refresh();
        })
      }
    >
      Plan a coffee
    </Button>
  );
}

export function QuestRequestForm({ staff }: { staff: StaffOption[] }) {
  const [staffId, setStaffId] = useState("");
  const [type, setType] = useState<QuestType>("coffee");
  const [pending, start] = useTransition();
  const notify = useActionToast();
  const router = useRouter();
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await requestQuest({ staffId, type });
          if (notify(res, "Quest added")) setStaffId("");
          router.refresh();
        });
      }}
    >
      <Select label="Who" value={staffId} onChange={(e) => setStaffId(e.target.value)} required>
        <option value="" disabled>
          Choose a colleague
        </option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} · {s.team}
          </option>
        ))}
      </Select>
      <Select label="What" value={type} onChange={(e) => setType(e.target.value as QuestType)}>
        {(Object.keys(QUEST_TYPES) as QuestType[]).map((t) => (
          <option key={t} value={t}>
            {QUEST_TYPES[t].label}
          </option>
        ))}
      </Select>
      <Button type="submit" loading={pending} disabled={!staffId} leftIcon={<Plus size={16} aria-hidden />}>
        Add quest
      </Button>
    </form>
  );
}

export function ShadowLogForm({ staff }: { staff: StaffOption[] }) {
  const [interaction, setInteraction] = useState<string>(SHADOW_KINDS[0]);
  const [withWhom, setWithWhom] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();
  const notify = useActionToast();
  const router = useRouter();
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (notes.trim().length < 20) {
          setError("Write a little about what you observed (at least 20 characters).");
          return;
        }
        setError(undefined);
        start(async () => {
          const res = await addShadowLogEntry({ interaction, withWhom, notes });
          if (notify(res, "Shadow log updated")) {
            setNotes("");
            setWithWhom("");
          }
          router.refresh();
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="What was it?" value={interaction} onChange={(e) => setInteraction(e.target.value)}>
          {SHADOW_KINDS.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </Select>
        <Input label="Who did you shadow?" list="shadow-staff" value={withWhom} onChange={(e) => setWithWhom(e.target.value)} placeholder="e.g. Liam Brennan" maxLength={120} required />
        <datalist id="shadow-staff">
          {staff.map((s) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>
      </div>
      <Textarea
        label="What did you observe?"
        hint="How they opened, a question that worked, how they handled a push-back. No client data beyond the name."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={1500}
        rows={4}
        error={error}
      />
      <Button type="submit" loading={pending} className="self-start">
        Add to shadow log
      </Button>
    </form>
  );
}
