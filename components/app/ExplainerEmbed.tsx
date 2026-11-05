"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { EXPLAINERS, type ExplainerId } from "@/components/explainers";

export function ExplainerEmbed({ id }: { id: ExplainerId }) {
  const [done, setDone] = useState(false);
  const Explainer = EXPLAINERS[id];
  if (!Explainer) return null;
  return (
    <div className="my-4">
      <Explainer onComplete={() => setDone(true)} />
      {done && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-success" role="status">
          <CheckCircle2 size={16} aria-hidden /> Explainer finished
        </p>
      )}
    </div>
  );
}
