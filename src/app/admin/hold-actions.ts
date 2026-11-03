"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { resolveHoldFromForm, type ResolveState } from "@/lib/payout-holds";

export type { ResolveState };

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
  const { id, ...result } = await resolveHoldFromForm(formData, admin);
  if (id) {
    revalidatePath("/admin/payoutHolds");
    revalidatePath(`/admin/payoutHolds/${id}`);
  }
  return result;
}
