"use server";

import { revalidatePath } from "next/cache";
import { requireCs } from "@/lib/cs-auth";
import {
  MOVE_TO_LABEL,
  queueReply,
  REPLY_LIMITS,
  setInquiryStatus,
  STATUSES,
  type InquiryStatus,
} from "@/lib/support-inquiries";

export type StatusState = { ok?: string; error?: string };

/** Moves an inquiry between 답변 전 / 답변함 / 종료, recording who did it. */
export async function setInquiryStatusAction(
  _prev: StatusState,
  formData: FormData
): Promise<StatusState> {
  const by = await requireCs();

  const id = String(formData.get("id") ?? "");
  const to = String(formData.get("status") ?? "") as InquiryStatus;
  if (!id) return { error: "문의를 지정해주세요." };
  if (!STATUSES.includes(to)) return { error: "상태를 선택해주세요." };

  try {
    await setInquiryStatus(id, to, by);
    // The sidebar's open count lives in the layout.
    revalidatePath("/cs", "layout");
    return { ok: `${MOVE_TO_LABEL[to]} 바꿨습니다.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "상태 변경에 실패했습니다." };
  }
}

export type ReplyState = { ok?: string; error?: string };

/**
 * Queues an email answer. The app's Cloud Function sends it and then marks
 * the inquiry 답변함 — so the page shows it as 발송 대기 for a moment first.
 */
export async function sendReplyAction(
  _prev: ReplyState,
  formData: FormData
): Promise<ReplyState> {
  const by = await requireCs();

  const id = String(formData.get("id") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const body = String(formData.get("body") ?? "");
  if (!id) return { error: "문의를 지정해주세요." };
  if (!body.trim()) return { error: "답변 내용을 입력해주세요." };
  if (body.length > REPLY_LIMITS.body) {
    return { error: `답변은 ${REPLY_LIMITS.body.toLocaleString()}자 이하로 적어주세요.` };
  }
  if (subject.length > REPLY_LIMITS.subject) {
    return { error: `제목은 ${REPLY_LIMITS.subject}자 이하로 적어주세요.` };
  }

  try {
    await queueReply(id, subject, body, by);
    revalidatePath("/cs", "layout");
    return { ok: "답변을 보냈습니다. 잠시 후 발송 결과가 표시돼요." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "답변 발송에 실패했습니다." };
  }
}
