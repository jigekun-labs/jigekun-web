"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { listCollections } from "@/lib/firestore-view";
import {
  createDocument,
  nextOrder,
  parseFieldValue,
  publishAnnouncement,
  serverNow,
} from "@/lib/firestore-write";
import { schemaFor } from "@/lib/collection-schemas";

export type CreateDocState = { ok?: string; error?: string; id?: string };

/**
 * Creates a document in one of the collections the dashboard knows the shape of.
 *
 * Only fields declared in the schema are read off the form, so an extra input
 * in a crafted post cannot smuggle a field into the document.
 */
export async function createDocumentAction(
  _prev: CreateDocState,
  formData: FormData
): Promise<CreateDocState> {
  await requireAdmin();

  const collection = String(formData.get("collection") ?? "");

  const schema = schemaFor(collection);
  if (!schema) {
    return { error: `이 컬렉션에는 문서를 만들 수 없습니다: ${collection}` };
  }

  const known = await listCollections();
  if (!known.some((c) => c.name === collection)) {
    return { error: `알 수 없는 컬렉션입니다: ${collection}` };
  }

  const values: Record<string, unknown> = {};

  for (const field of schema.fields) {
    const raw = String(formData.get(`f_${field.name}`) ?? "");

    if (field.autoWhenBlank && !raw.trim()) {
      values[field.name] = await nextOrder(collection);
      continue;
    }

    if (field.required && !raw.trim()) {
      return { error: `${field.label}을(를) 입력해주세요.` };
    }

    const parsed = parseFieldValue(field.type, raw);
    if (!parsed.ok) return { error: `${field.label}: ${parsed.error}` };

    values[field.name] = parsed.value;
  }

  // Publishing without notifying: pre-stamp the flag the trigger checks, so it
  // claims the document and returns before fanning anything out.
  const silent =
    !!schema.silentPublish && String(formData.get("silent") ?? "") === "true";
  const live = values.isActive === true;

  if (silent && live) {
    values[schema.silentPublish!.guardField] = true;
    values.notifiedAt = serverNow();
  }

  try {
    const id = await createDocument(collection, values);
    revalidatePath(`/admin/${collection}`);

    // Say plainly whether this one went out, since the Cloud Function reacts to
    // the write rather than to anything the dashboard does.
    let ok: string;
    if (live && silent) {
      ok = "게시했습니다. 앱에는 표시되지만 알림은 발송되지 않습니다.";
    } else if (live) {
      ok = "공지를 저장하고 게시했습니다. 전체 사용자에게 알림이 발송됩니다.";
    } else {
      ok = `${schema.label} 문서를 만들었습니다.`;
    }

    return { id, ok };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "문서 생성에 실패했습니다.",
    };
  }
}

export type PublishState = { ok?: string; error?: string };

/**
 * Publishes a draft announcement. The fan-out is the Cloud Function's job; this
 * only flips the flag it watches for.
 */
export async function publishAnnouncementAction(
  _prev: PublishState,
  formData: FormData
): Promise<PublishState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "공지를 지정해주세요." };

  const silent = String(formData.get("silent") ?? "") === "true";

  try {
    await publishAnnouncement(id, silent);
    revalidatePath("/admin/announcements");
    return {
      ok: silent
        ? "게시했습니다. 앱에는 표시되지만 알림은 발송되지 않습니다."
        : "게시했습니다. 전체 사용자에게 알림이 발송됩니다 (잠시 후 반영).",
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "게시에 실패했습니다." };
  }
}
