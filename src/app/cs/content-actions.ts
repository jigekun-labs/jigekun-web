"use server";

import { revalidatePath } from "next/cache";
import { requireCs } from "@/lib/cs-auth";
import {
  createFromForm,
  publishFromForm,
  type CreateDocState,
  type PublishState,
} from "@/lib/create-document";

/**
 * What customer service may author. The shared create logic accepts any
 * collection with a schema (coupons included), so /cs narrows it here.
 */
const CS_COLLECTIONS = new Set(["announcements", "faqs"]);

export async function csCreateDocumentAction(
  _prev: CreateDocState,
  formData: FormData
): Promise<CreateDocState> {
  await requireCs();
  const collection = String(formData.get("collection") ?? "");
  if (!CS_COLLECTIONS.has(collection)) {
    return { error: `고객센터에서는 만들 수 없는 항목입니다: ${collection}` };
  }
  const result = await createFromForm(formData);
  if (result.ok) revalidatePath(`/cs/${collection}`);
  return result;
}

export async function csPublishAnnouncementAction(
  _prev: PublishState,
  formData: FormData
): Promise<PublishState> {
  await requireCs();
  const result = await publishFromForm(formData);
  if (result.ok) revalidatePath("/cs/announcements");
  return result;
}
