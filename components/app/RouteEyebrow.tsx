"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Page eyebrow rendered by the layout (outside the route's loading boundary) so it is part of the
 * first paint, even while the page itself is still streaming behind the skeleton. Shows only on `path`.
 */
export function RouteEyebrow({ path, children }: { path: string; children: ReactNode }) {
  if (usePathname() !== path) return null;
  return <p className="mb-1 text-xs font-semibold tracking-wide text-accent uppercase">{children}</p>;
}
