"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react";
import { submitSignatureStory } from "@/app/(hire)/labs/actions";
import { Markdown } from "@/components/app/Markdown";
import { useReward } from "@/components/app/useReward";
import type { Story } from "@/content/schema";
import { Badge, Button, GlassCard, buttonStyles, cn } from "@/components/ui";

type Choice = Story["nodes"][number]["choices"][number];

/** Branching story with a required pass: only the good ending counts. The server replays the path to decide. */
export function SignatureStoryLab({ story, done }: { story: Story; done: boolean }) {
  const [started, setStarted] = useState(false);
  const [nodeId, setNodeId] = useState(story.startNodeId);
  const [choices, setChoices] = useState<string[]>([]);
  const [picked, setPicked] = useState<Choice | null>(null);
  const [result, setResult] = useState<{ passed: boolean } | null>(null);
  const [finished, setFinished] = useState(done);
  const [pending, start] = useTransition();
  const reward = useReward();
  const router = useRouter();
  const node = story.nodes.find((n) => n.id === nodeId) ?? story.nodes[0];

  const restart = () => {
    setNodeId(story.startNodeId);
    setChoices([]);
    setPicked(null);
    setResult(null);
    setStarted(true);
  };

  const next = () => {
    if (!picked) return;
    const path = [...choices, picked.id];
    setChoices(path);
    setNodeId(picked.nextId);
    setPicked(null);
    const target = story.nodes.find((n) => n.id === picked.nextId);
    if (target?.ending) {
      start(async () => {
        const res = await submitSignatureStory(path);
        if (!res.ok) {
          reward({ ok: false, error: res.error });
          return;
        }
        setResult({ passed: res.passed });
        reward(res.reward, "Signature Guardian: story passed");
        if (res.passed) setFinished(true);
        router.refresh();
      });
    }
  };

  if (!started) {
    return (
      <GlassCard variant="strong" className="flex flex-col gap-4">
        {finished && (
          <p className="inline-flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 size={16} aria-hidden /> You have passed this story. Replay it any time.
          </p>
        )}
        <Markdown source={story.intro} />
        <div>
          <Button onClick={restart} rightIcon={<ArrowRight size={16} aria-hidden />}>
            {finished ? "Replay the story" : "Start the story"}
          </Button>
        </div>
      </GlassCard>
    );
  }

  const ending = node.ending;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted">Step {choices.length + 1}</p>
      <GlassCard variant="strong" className="flex flex-col gap-4" aria-live="polite">
        {node.title && <p className="text-xs font-semibold tracking-wide text-accent uppercase">{node.title}</p>}
        <Markdown source={node.body} />

        {ending ? (
          <div className={cn("flex flex-col gap-2 rounded-lg p-4 text-sm", ending.kind === "good" ? "bg-success-soft" : ending.kind === "mixed" ? "bg-warn-soft" : "bg-danger-soft")}>
            <p className="inline-flex items-center gap-2 font-semibold">
              {ending.kind === "good" ? <ShieldCheck size={18} aria-hidden className="text-success" /> : <TriangleAlert size={18} aria-hidden className={ending.kind === "bad" ? "text-danger" : "text-warn"} />}
              {ending.kind === "good" ? "Passed" : ending.kind === "mixed" ? "Near miss: not a pass" : "Serious incident: not a pass"}
            </p>
            <p>{ending.summary}</p>
            <p className="text-muted">{ending.lesson}</p>
            {pending && <p className="text-xs text-muted">Saving your result…</p>}
            {result && !result.passed && <p className="font-medium">A pass is required. Try again and find the path that keeps every test signed and in scope.</p>}
            <div className="mt-1 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={restart} leftIcon={<RotateCcw size={14} aria-hidden />} disabled={pending}>
                Play again
              </Button>
              {ending.kind === "good" && (
                <Link href="/roadmap" className={buttonStyles({ size: "sm" })}>
                  Back to the roadmap
                </Link>
              )}
            </div>
          </div>
        ) : picked ? (
          <div className="flex flex-col gap-3">
            <div className={cn("rounded-lg p-3 text-sm", picked.quality === "good" ? "bg-success-soft" : picked.quality === "poor" ? "bg-warn-soft" : "bg-surface-strong")}>
              <p className="mb-1 font-medium">You chose: {picked.text}</p>
              <p>{picked.consequence}</p>
            </div>
            <div>
              <Button onClick={next} rightIcon={<ArrowRight size={16} aria-hidden />}>
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">What do you do?</p>
            {node.choices.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setPicked(c)}
                className="glass min-h-11 rounded-lg px-4 py-3 text-left text-sm transition hover:border-accent hover:bg-accent-soft"
              >
                {c.text}
              </button>
            ))}
          </div>
        )}
      </GlassCard>
      {finished && !ending && <Badge tone="success">Already passed: this run is practice</Badge>}
    </div>
  );
}
