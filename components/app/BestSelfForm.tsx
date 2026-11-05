"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitBestSelfStory } from "@/app/(hire)/actions";
import { Button, Input, Textarea } from "@/components/ui";
import { useReward } from "./useReward";

const MIN = 80;

/** Best Self story writer (§4.3). Drafts stay in the browser until submitted. */
export function BestSelfForm() {
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [strengths, setStrengths] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();
  const reward = useReward();
  const router = useRouter();
  const short = story.trim().length < MIN;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (short) {
          setError(`A few sentences, please: at least ${MIN} characters.`);
          return;
        }
        setError(undefined);
        start(async () => {
          const res = await submitBestSelfStory({ title, story, strengths });
          reward(res, "Best Self story shared");
          if (!res.ok) setError(res.error);
          router.refresh();
        });
      }}
    >
      <Input label="Give it a title" placeholder="The night the demo nearly failed" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
      <Textarea
        label="Your story"
        hint={`${story.trim().length} characters · at least ${MIN}`}
        error={error}
        rows={9}
        maxLength={4000}
        required
        placeholder="What was happening, what did you do, and how did it feel?"
        value={story}
        onChange={(e) => setStory(e.target.value)}
      />
      <Input
        label="Strengths you showed (optional)"
        hint="Comma separated, e.g. calm under pressure, listening"
        value={strengths}
        maxLength={300}
        onChange={(e) => setStrengths(e.target.value)}
      />
      <Button type="submit" size="lg" loading={pending} disabled={pending} className="self-start">
        Share my story
      </Button>
    </form>
  );
}
