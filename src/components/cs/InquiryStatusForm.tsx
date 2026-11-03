"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  setInquiryStatusAction,
  type StatusState,
} from "@/app/cs/inquiry-actions";
import {
  MOVE_TO_LABEL,
  STATUSES,
  type InquiryStatus,
} from "@/lib/support-inquiries-shared";

/** One button per other status; each submits that status. */
export default function InquiryStatusForm({
  id,
  status,
}: {
  id: string;
  status: InquiryStatus;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<StatusState, FormData>(
    setInquiryStatusAction,
    {}
  );

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap gap-2">
        {STATUSES.filter((s) => s !== status).map((s) => (
          <button
            key={s}
            type="submit"
            name="status"
            value={s}
            disabled={pending}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            {MOVE_TO_LABEL[s]} 변경
          </button>
        ))}
      </div>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="mt-2 text-sm text-green-700">{state.ok}</p>}
    </form>
  );
}
