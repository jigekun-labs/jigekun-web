"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-reads the page every couple of seconds while a reply is still waiting on
 * the Cloud Function, so 발송 대기 turns into 발송됨 without a manual reload.
 * Gives up after a minute; a reload shows the final state either way.
 */
export default function RefreshWhilePending({ pending }: { pending: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!pending) return;
    let ticks = 0;
    const t = setInterval(() => {
      if (++ticks > 30) clearInterval(t);
      else router.refresh();
    }, 2000);
    return () => clearInterval(t);
  }, [pending, router]);
  return null;
}
