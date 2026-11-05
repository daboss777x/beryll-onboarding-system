"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { completeReview } from "@/app/(hire)/actions";
import { Button, useToast } from "@/components/ui";

export function ReviewDoneButton({ quizId, itemId }: { quizId: string; itemId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  return (
    <Button
      size="sm"
      variant="secondary"
      loading={pending}
      leftIcon={<Check size={14} aria-hidden />}
      onClick={() =>
        start(async () => {
          const res = await completeReview(quizId, itemId);
          toast(res.ok ? { title: "Reviewed", description: "It will come back once more to make it stick.", tone: "success" } : { title: "Could not save", tone: "danger" });
          router.refresh();
        })
      }
    >
      I&apos;ve got it
    </Button>
  );
}
