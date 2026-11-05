"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";

/** Shared error boundary body for route-group error.tsx files. */
export function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-xl py-6">
      <EmptyState
        icon={<TriangleAlert size={26} aria-hidden />}
        title="Something went wrong"
        description="This page could not load. Your progress is safe. Try again, and if it keeps happening tell your buddy or manager."
        action={
          <Button onClick={reset} leftIcon={<RefreshCw size={16} aria-hidden />}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
