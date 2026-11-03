"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { sendReplyAction, type ReplyState } from "@/app/cs/inquiry-actions";

const BODY_LIMIT = 5000;

/**
 * Write and send an email answer. It always goes to the inquiry's own address
 * (shown, not editable). Sending asks once more, since a sent email can't be
 * taken back.
 */
export default function ReplyForm({
  id,
  to,
  name,
  title,
}: {
  id: string;
  to: string;
  name: string | null;
  title: string | null;
}) {
  const router = useRouter();
  const template = `안녕하세요${name ? `, ${name}님` : ""}. 지게꾼 고객센터입니다.\n\n\n\n감사합니다.\n지게꾼 고객센터 드림`;
  const [subject, setSubject] = useState(`Re: [지게꾼 문의] ${title ?? "문의하신 내용"}`);
  const [body, setBody] = useState(template);
  const [confirming, setConfirming] = useState(false);

  // After a send: show the queued reply and start over with a fresh draft.
  const [state, formAction, pending] = useActionState<ReplyState, FormData>(
    async (prev, formData) => {
      const result = await sendReplyAction(prev, formData);
      if (result.ok) {
        setBody(template);
        setConfirming(false);
        router.refresh();
      }
      return result;
    },
    {}
  );

  const empty = body.trim() === template.trim() || !body.trim();

  return (
    <form action={formAction} className="mt-3 space-y-3">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm text-gray-600">
        받는 사람 <span className="font-medium text-gray-900">{to}</span>
      </p>
      <input
        name="subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        maxLength={200}
        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-900"
      />
      <textarea
        name="body"
        rows={9}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setConfirming(false);
        }}
        maxLength={BODY_LIMIT}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-relaxed outline-none focus:border-gray-900"
      />
      <p className="text-xs text-gray-400">
        문의 원문은 메일 아래에 자동으로 붙어요. 사용자가 회신하면 고객센터 메일함으로 와요.
      </p>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-green-700">{state.ok}</p>}

      {!confirming ? (
        <button
          type="button"
          disabled={empty}
          onClick={() => setConfirming(true)}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          답변 보내기
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-700">{to}로 보낼까요? 보낸 메일은 취소할 수 없어요.</span>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {pending ? "보내는 중…" : "네, 보내기"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg px-3 py-2 text-sm text-gray-600"
          >
            취소
          </button>
        </div>
      )}
    </form>
  );
}
