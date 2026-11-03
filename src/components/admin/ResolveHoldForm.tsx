"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ResolveState } from "@/app/admin/hold-actions";

export type ResolveAction = (
  prev: ResolveState,
  formData: FormData
) => Promise<ResolveState>;

/** Close a held payment: what was done with the money, plus a note. Asks to
 * confirm before writing — it can't be undone from the dashboard. */
export default function ResolveHoldForm({
  id,
  amount,
  action,
}: {
  id: string;
  amount: number;
  /** /admin's or /cs's resolve action — each checks its own session. */
  action: ResolveAction;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ResolveState, FormData>(
    action,
    {}
  );
  const [outcome, setOutcome] = useState<"" | "paid_worker" | "refunded_employer">("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  const won = `${amount.toLocaleString("ko-KR")}원`;
  const option = (value: typeof outcome, label: string) => (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="radio"
        name="outcome"
        value={value}
        checked={outcome === value}
        onChange={() => {
          setOutcome(value);
          setConfirming(false);
        }}
      />
      {label}
    </label>
  );

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <input type="hidden" name="id" value={id} />
      <div className="space-y-2">
        {option("paid_worker", `작업자에게 ${won} 지급했어요`)}
        {option("refunded_employer", `요청자에게 ${won} 환불했어요`)}
      </div>
      <textarea
        name="note"
        rows={3}
        maxLength={1000}
        placeholder="처리 내용 메모 (예: 통화로 확인 — 작업자 정상 출근, 10/31 이체 완료)"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-green-700">{state.ok}</p>}
      {!confirming ? (
        <button
          type="button"
          disabled={!outcome}
          onClick={() => setConfirming(true)}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          처리 완료
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">되돌릴 수 없어요. 처리할까요?</span>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {pending ? "처리 중…" : "네, 처리"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-md px-3 py-2 text-sm text-gray-600"
          >
            취소
          </button>
        </div>
      )}
    </form>
  );
}
