"use server";

import { revalidatePath } from "next/cache";
import { requireCs } from "@/lib/cs-auth";
import {
  MOVE_TO_LABEL,
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
