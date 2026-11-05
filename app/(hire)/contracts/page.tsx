import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui";
import { ContractsApp } from "@/components/contracts/ContractsApp";
import { requireUser } from "@/lib/data/auth";
import { saveWalkthroughResult } from "./actions";

export const metadata: Metadata = { title: "Beryll Contracts · Beryll Onboard" };

export default async function ContractsPage() {
  const profile = await requireUser("hire");
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        {/* Sandbox state is per hire (localStorage key includes the id). */}
        <ContractsApp userId={profile.id} onWalkthroughComplete={saveWalkthroughResult} />
      </Suspense>
    </div>
  );
}
