"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { completeLesson } from "@/app/(hire)/actions";
import { Button, buttonStyles } from "@/components/ui";
import { useReward } from "./useReward";

export function CompleteLessonButton({ moduleId, done }: { moduleId: string; done: boolean }) {
  const [pending, start] = useTransition();
  const [finished, setFinished] = useState(done);
  const reward = useReward();
  const router = useRouter();
  if (finished) {
    return (
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <p className="flex items-center gap-1.5 font-medium text-success">
          <CheckCircle2 size={18} aria-hidden /> Lesson complete
        </p>
        <Link href="/today" className={buttonStyles({ variant: "secondary", size: "sm" })}>
          Back to Today
        </Link>
      </div>
    );
  }
  return (
    <Button
      size="lg"
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await completeLesson(moduleId);
          reward(res, "Lesson complete");
          if (res.ok) setFinished(true);
          router.refresh();
        })
      }
    >
      Mark lesson complete
    </Button>
  );
}
