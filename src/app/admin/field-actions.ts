"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { listCollections } from "@/lib/firestore-view";
import {
  addFieldToCollection,
  addFieldToDocument,
  parseFieldValue,
  updateFieldInDocument,
} from "@/lib/firestore-write";
import { validateFieldName, type FieldType } from "@/lib/field-types";

export type AddFieldState = { ok?: string; error?: string };

export type EditFieldState = { ok?: string; error?: string };

/**
 * Changes the value of one existing field on one document.
 *
 * The form also submits the value the admin was looking at (`expectedType` /
 * `expectedValue`); the write is refused if the stored value no longer matches,
 * which is what keeps an edit made against a stale table from clobbering a
 * write the live app made in the meantime.
 */
export async function updateFieldAction(
  _prev: EditFieldState,
  formData: FormData
): Promise<EditFieldState> {
  await requireAdmin();

  const collection = String(formData.get("collection") ?? "");
  const docId = String(formData.get("docId") ?? "");
  const field = String(formData.get("field") ?? "").trim();
  const type = String(formData.get("type") ?? "string") as FieldType;
  const raw = String(formData.get("value") ?? "");
  const expectedType = String(
    formData.get("expectedType") ?? "string"
  ) as FieldType;
  const expectedRaw = String(formData.get("expectedValue") ?? "");

  if (!field) return { error: "필드를 지정해주세요." };
  if (!docId) return { error: "문서를 지정해주세요." };

  const known = await listCollections();
  if (!known.some((c) => c.name === collection)) {
    return { error: `알 수 없는 컬렉션입니다: ${collection}` };
  }

  const parsed = parseFieldValue(type, raw);
  if (!parsed.ok) return { error: parsed.error };

  const expected = parseFieldValue(expectedType, expectedRaw);
  if (!expected.ok) {
    // The old value came from the table, so this means the row was rendered
    // from something the form cannot represent — refuse rather than guess.
    return { error: "이전 값을 확인할 수 없습니다. 새로고침 후 다시 시도해주세요." };
  }

  try {
    await updateFieldInDocument(
      collection,
      docId,
      field,
      parsed.value,
      expected.value
    );
    revalidatePath(`/admin/${collection}`);
    return { ok: `'${field}' 값을 저장했습니다.` };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "저장에 실패했습니다.",
    };
  }
}

/**
 * Creates a field, either on one document or across a whole collection.
 *
 * This is the dashboard's only write path, so everything is re-checked here
 * rather than trusted from the form: the session, the collection name (against
 * the real list, so a crafted post cannot invent a collection), the field name,
 * and the value's type.
 */
export async function addFieldAction(
  _prev: AddFieldState,
  formData: FormData
): Promise<AddFieldState> {
  await requireAdmin();

  const collection = String(formData.get("collection") ?? "");
  const scope = String(formData.get("scope") ?? "");
  const docId = String(formData.get("docId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "string") as FieldType;
  const raw = String(formData.get("value") ?? "");

  const nameError = validateFieldName(name);
  if (nameError) return { error: nameError };

  const known = await listCollections();
  if (!known.some((c) => c.name === collection)) {
    return { error: `알 수 없는 컬렉션입니다: ${collection}` };
  }

  const parsed = parseFieldValue(type, raw);
  if (!parsed.ok) return { error: parsed.error };

  try {
    if (scope === "collection") {
      const result = await addFieldToCollection(collection, name, parsed.value);
      revalidatePath(`/admin/${collection}`);

      if (result.updated === 0) {
        return {
          ok: `모든 문서(${result.total.toLocaleString()}개)에 이미 '${name}' 필드가 있어 변경하지 않았습니다.`,
        };
      }
      return {
        ok:
          `'${name}' 필드를 ${result.updated.toLocaleString()}개 문서에 추가했습니다` +
          (result.skipped > 0
            ? ` (이미 있던 ${result.skipped.toLocaleString()}개는 그대로 두었습니다).`
            : "."),
      };
    }

    if (!docId) return { error: "문서를 먼저 선택해주세요." };

    await addFieldToDocument(collection, docId, name, parsed.value);
    revalidatePath(`/admin/${collection}`);
    return { ok: `'${name}' 필드를 추가했습니다.` };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "필드 추가에 실패했습니다.",
    };
  }
}
