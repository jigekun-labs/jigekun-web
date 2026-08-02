"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { listCollections } from "@/lib/firestore-view";
import {
  addFieldToCollection,
  addFieldToDocument,
  parseFieldValue,
} from "@/lib/firestore-write";
import { validateFieldName, type FieldType } from "@/lib/field-types";

export type AddFieldState = { ok?: string; error?: string };

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
