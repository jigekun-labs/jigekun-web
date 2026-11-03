"use server";

import { revalidatePath } from "next/cache";
import { requireCs } from "@/lib/cs-auth";
import { resolveHoldFromForm, type ResolveState } from "@/lib/payout-holds";

/** /cs's resolve button — the same close as /admin's, under the CS session. */
export async function csResolveHoldAction(
  _prev: ResolveState,
  formData: FormData
): Promise<ResolveState> {
  const by = await requireCs();
  const { id, ...result } = await resolveHoldFromForm(formData, by);
  // The sidebar's held count lives in the layout.
  if (id) revalidatePath("/cs", "layout");
  return result;
}
