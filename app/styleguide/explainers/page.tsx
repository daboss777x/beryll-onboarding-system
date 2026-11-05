"use client";

import { useState } from "react";
import { EXPLAINERS, EXPLAINER_IDS, type ExplainerId } from "@/components/explainers";
import { Badge } from "@/components/ui";

export default function ExplainersStyleguidePage() {
  const [done, setDone] = useState<Partial<Record<ExplainerId, boolean>>>({});
  return (
    <main className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Lesson explainers</h1>
        <p className="text-muted">Animated, step-based, keyboard accessible. Arrow keys move steps; reduced motion shows static steps.</p>
      </header>
      {EXPLAINER_IDS.map((id) => {
        const Explainer = EXPLAINERS[id];
        return (
          <section key={id} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-mono text-sm font-semibold">{id}</h2>
              {done[id] && <Badge tone="success">onComplete fired</Badge>}
            </div>
            <Explainer onComplete={() => setDone((d) => ({ ...d, [id]: true }))} />
          </section>
        );
      })}
    </main>
  );
}
