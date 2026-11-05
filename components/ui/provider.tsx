"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { ToastProvider } from "./Toast";

/** Mount once in the root layout: honours prefers-reduced-motion and provides toasts. */
export function UIProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
}
