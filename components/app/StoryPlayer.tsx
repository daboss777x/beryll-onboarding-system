"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { completeJobPreview } from "@/app/(hire)/actions";
import type { Story } from "@/content";
import { Badge, Button, GlassCard, buttonStyles, cn } from "@/components/ui";
import { Markdown } from "./Markdown";
import { useReward } from "./useReward";

/** Branching story player (job preview). Choices show their consequence before moving on. */
export function StoryPlayer({ story, done }: { story: Story; done: boolean }) {
  const [nodeId, setNodeId] = useState(story.startNodeId);
  const [path, setPath] = useState<string[]>([story.startNodeId]);
  const [picked, setPicked] = useState<Story["nodes"][number]["choices"][number] | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const reward = useReward();
  const router = useRouter();
  const node = story.nodes.find((n) => n.id === nodeId) ?? story.nodes[0];

  const restart = () => {
    setNodeId(story.startNodeId);
    setPath([story.startNodeId]);
    setPicked(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <GlassCard variant="strong" className="flex flex-col gap-4" aria-live="polite">
        {node.title && <p className="text-xs font-semibold tracking-wide text-accent uppercase">{node.title}</p>}
        <Markdown source={node.body} />

        {picked ? (
          <div className="flex flex-col gap-3">
            <div className={cn("rounded-lg p-3 text-sm", picked.quality === "good" ? "bg-success-soft" : picked.quality === "poor" ? "bg-warn-soft" : "bg-surface-strong")}>
              <p className="mb-1 font-medium">You chose: {picked.text}</p>
              <p>{picked.consequence}</p>
            </div>
            <Button
              className="self-start"
              rightIcon={<ArrowRight size={16} aria-hidden />}
              onClick={() => {
                setNodeId(picked.nextId);
                setPath((p) => [...p, picked.nextId]);
                setPicked(null);
              }}
            >
              Continue
            </Button>
          </div>
        ) : node.choices.length ? (
          <div className="flex flex-col gap-2" role="group" aria-label="What do you do?">
            {node.choices.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setPicked(c)}
                className="glass min-h-11 rounded-lg px-4 py-3 text-left text-sm font-medium hover:border-accent hover:bg-surface-strong"
              >
                {c.text}
              </button>
            ))}
          </div>
        ) : null}

        {node.ending && (
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <Badge tone={node.ending.kind === "good" ? "success" : node.ending.kind === "bad" ? "danger" : "warn"} className="self-start">
              {node.ending.kind === "good" ? "Strong week" : node.ending.kind === "bad" ? "Tough week" : "Mixed week"}
            </Badge>
            <p className="font-medium">{node.ending.summary}</p>
            <p className="text-sm text-muted">{node.ending.lesson}</p>
            <div className="flex flex-wrap gap-2">
              {saved || done ? (
                <>
                  <p className="flex items-center gap-1.5 font-medium text-success">
                    <CheckCircle2 size={18} aria-hidden /> Preview complete
                  </p>
                  <Link href="/today" className={buttonStyles({ variant: "secondary", size: "sm" })}>
                    Back to Today
                  </Link>
                </>
              ) : (
                <Button
                  loading={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await completeJobPreview(node.ending!.kind, path);
                      reward(res, "Job preview complete");
                      if (res.ok) setSaved(true);
                      router.refresh();
                    })
                  }
                >
                  Finish the week
                </Button>
              )}
              <Button variant="ghost" leftIcon={<RotateCcw size={16} aria-hidden />} onClick={restart}>
                Play again
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
