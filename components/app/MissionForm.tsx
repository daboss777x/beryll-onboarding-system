"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { submitMission } from "@/app/(hire)/actions";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { SUGGESTION_LIMITS } from "./mission-defs";
import { useReward } from "./useReward";

export interface SopOption {
  id: string;
  title: string;
  ownerName: string;
  summary: string;
}

export function MissionForm({ missionId, sops }: { missionId: string; sops: SopOption[] }) {
  const [sopId, setSopId] = useState("");
  const [section, setSection] = useState("");
  const [problem, setProblem] = useState("");
  const [fix, setFix] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"sop" | "problem" | "fix", string>>>({});
  const [pending, start] = useTransition();
  const reward = useReward();
  const router = useRouter();
  const sop = sops.find((s) => s.id === sopId);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const errs: typeof errors = {};
        if (!sopId) errs.sop = "Pick the SOP you want to improve.";
        if (problem.trim().length < SUGGESTION_LIMITS.min) errs.problem = "At least 20 characters.";
        if (fix.trim().length < SUGGESTION_LIMITS.min) errs.fix = "At least 20 characters.";
        setErrors(errs);
        if (Object.keys(errs).length) return;
        start(async () => {
          const res = await submitMission(missionId, { sopId, section, problem, fix });
          reward(res, "Mission submitted");
          if (res.ok) router.refresh();
        });
      }}
    >
      <Select label="Which SOP?" value={sopId} onChange={(e) => setSopId(e.target.value)} error={errors.sop}>
        <option value="" disabled>
          Choose an SOP
        </option>
        {sops.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </Select>
      {sop && (
        <p className="rounded-md bg-surface-strong p-3 text-sm">
          <span className="font-medium">Owner: {sop.ownerName}. </span>
          <span className="text-muted">{sop.summary}</span>
        </p>
      )}
      <Input label="Which part?" hint="Optional: a heading, a step number or a short quote." value={section} maxLength={SUGGESTION_LIMITS.section} onChange={(e) => setSection(e.target.value)} />
      <Textarea
        label="What could be better?"
        hint="What slowed you down, confused you, or is out of date?"
        rows={4}
        value={problem}
        maxLength={SUGGESTION_LIMITS.problem}
        onChange={(e) => setProblem(e.target.value)}
        error={errors.problem}
      />
      <Textarea
        label="Your proposed fix"
        hint="Write it as you would want it to read, and why it helps the next hire."
        rows={5}
        value={fix}
        maxLength={SUGGESTION_LIMITS.fix}
        onChange={(e) => setFix(e.target.value)}
        error={errors.fix}
      />
      <Button type="submit" loading={pending} className="self-start" leftIcon={<Send size={16} aria-hidden />}>
        Send to the SOP owner
      </Button>
    </form>
  );
}
