"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * After a successful save: re-render the route (the tables come from server
 * components, so a write only shows once it does), then close the form after
 * `delayMs` so the confirmation can be read first.
 *
 * Runs once per action result. `onDone` is read through a ref rather than
 * listed as a dependency: callers pass an inline `() => setOpen(false)`, which
 * is a new function on every render — including the render the refresh itself
 * causes — so depending on it re-ran the effect, refreshed again, and reset
 * the timer forever: the form never closed and the page kept refetching.
 */
export function useAfterSave(
  state: { ok?: string },
  onDone: (() => void) | undefined,
  delayMs: number
) {
  const router = useRouter();
  const latestOnDone = useRef(onDone);
  useEffect(() => {
    latestOnDone.current = onDone;
  });

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    const t = setTimeout(() => latestOnDone.current?.(), delayMs);
    return () => clearTimeout(t);
  }, [state, router, delayMs]);
}
