"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { resolveHold } from "@/lib/payout-holds";

export type ResolveState = { ok?: string; error?: string };

/**
 * Closes a held payment after customer service has settled the money by hand
 * (paid the worker from the company account, or refunded the employer).
 * Records who closed it; the transaction refuses an already-closed hold.
 */
export async function resolveHoldAction(
  _prev: ResolveState,
  formData: FormData
): Promise<ResolveState> {
  const admin = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const outcome = String(formData.get("outcome") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  if (!id) return { error: "보류 건을 지정해주세요." };
  if (outcome !== "paid_worker" && outcome !== "refunded_employer") {
    return { error: "처리 결과를 선택해주세요." };
  }

  try {
    await resolveHold(id, outcome, note, admin);
    revalidatePath("/admin/payoutHolds");
    revalidatePath(`/admin/payoutHolds/${id}`);
    return {
      ok:
        outcome === "paid_worker"
          ? "작업자에게 지급한 것으로 처리했습니다."
          : "요청자에게 환불한 것으로 처리했습니다.",
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "처리에 실패했습니다." };
  }
}
