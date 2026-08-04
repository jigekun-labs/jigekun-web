"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  publishAnnouncementAction,
  type PublishState,
} from "@/app/admin/document-actions";
import { announcementState } from "@/lib/collection-schemas";
import type { Row } from "@/lib/firestore-view";

/**
 * Where this announcement stands with the app's fan-out trigger, and the only
 * button that deliberately sets it off.
 *
 * The dashboard never sends a notification itself. Publishing flips `isActive`,
 * and the app's `onAnnouncementPublished` Cloud Function does the rest — which
 * is also why an "armed" document is dangerous to touch at all.
 */
export default function AnnouncementStatus({ row }: { row: Row }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<PublishState, FormData>(
    publishAnnouncementAction,
    {}
  );
  // null = not confirming; "loud" = publish + notify; "silent" = publish only.
  const [confirming, setConfirming] = useState<"loud" | "silent" | null>(null);

  const status = announcementState(row.cells);
  const title =
    row.cells.title?.kind === "string" ? row.cells.title.value : row.id;

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  if (status === "sent") {
    return (
      <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
        <p className="text-xs font-medium text-gray-600">발송 완료</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
          이미 전체 사용자에게 발송된 공지입니다. 지금 내용을 수정해도 다시
          발송되지 않습니다.
        </p>
      </div>
    );
  }

  if (status === "armed") {
    return (
      <div className="border-b border-red-100 bg-red-50 px-5 py-3">
        <p className="text-xs font-bold text-red-700">
          ⚠ 편집하면 즉시 전체 발송됩니다
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-red-700">
          게시 상태(isActive=true)이지만 아직 발송 기록(notified)이 없습니다. 이
          상태에서는 제목 하나만 고쳐도 앱의 Cloud Function이 전체 사용자에게
          알림을 보냅니다.
        </p>
      </div>
    );
  }

  return (
    <div className="border-b border-amber-100 bg-amber-50 px-5 py-3">
      <p className="text-xs font-medium text-amber-900">초안 (미게시)</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
        앱에는 보이지 않습니다. 게시하면 전체 사용자에게 알림이 발송됩니다.
      </p>

      {state.error && (
        <p className="mt-2 rounded bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="mt-2 rounded bg-green-50 px-2 py-1.5 text-[11px] text-green-800">
          {state.ok}
        </p>
      )}

      {!state.ok &&
        (confirming ? (
          <form action={formAction} className="mt-2 space-y-2">
            <input type="hidden" name="id" value={row.id} />
            {confirming === "silent" && (
              <input type="hidden" name="silent" value="true" />
            )}
            <p
              className={`rounded bg-white px-2.5 py-2 text-[11px] leading-relaxed ${
                confirming === "loud" ? "text-red-700" : "text-gray-700"
              }`}
            >
              {confirming === "loud" ? (
                <>
                  「{title}」을(를) 전체 사용자에게 발송합니다. 되돌릴 수
                  없습니다.
                </>
              ) : (
                <>
                  「{title}」을(를) 앱에 게시합니다. 알림은 발송되지 않으며,
                  나중에 다시 발송할 수도 없습니다.
                </>
              )}
            </p>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium text-white disabled:bg-gray-300 ${
                  confirming === "loud"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-900 hover:bg-gray-800"
                }`}
              >
                {pending
                  ? "게시 중…"
                  : confirming === "loud"
                    ? "네, 발송합니다"
                    : "네, 알림 없이 게시합니다"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setConfirming("loud")}
              className="rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-800"
            >
              게시 + 알림 발송
            </button>
            <button
              onClick={() => setConfirming("silent")}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              알림 없이 게시
            </button>
          </div>
        ))}
    </div>
  );
}
