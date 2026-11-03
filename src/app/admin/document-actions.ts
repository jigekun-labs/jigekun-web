"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import {
  createFromForm,
  publishFromForm,
  type CreateDocState,
  type PublishState,
} from "@/lib/create-document";

export type { CreateDocState, PublishState };

/** /admin's create form: any collection with a declared schema. */
export async function createDocumentAction(
  _prev: CreateDocState,
  formData: FormData
): Promise<CreateDocState> {
  await requireAdmin();
  const result = await createFromForm(formData);
  if (result.ok) {
    revalidatePath(`/admin/${String(formData.get("collection") ?? "")}`);
  }
  return result;
}

/** /admin's publish button for a draft announcement. */
export async function publishAnnouncementAction(
  _prev: PublishState,
  formData: FormData
): Promise<PublishState> {
  await requireAdmin();
  const result = await publishFromForm(formData);
  if (result.ok) revalidatePath("/admin/announcements");
  return result;
}
