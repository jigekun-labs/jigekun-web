/**
 * The field types an admin can create from the dashboard, and the rules a field
 * name has to satisfy.
 *
 * Deliberately free of any firebase-admin import so both the browser form and
 * the server action can share it — the client gets instant validation, the
 * server re-runs the same check as the authoritative one.
 */

import type { CellValue } from "./firestore-view";

export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "timestamp"
  | "null"
  | "json";

/**
 * Labels stay in Firestore's own vocabulary — `string`, `timestamp`, `map` —
 * because that is what the console and the app's code call them. The Korean
 * hint underneath carries the explanation instead.
 */
export const FIELD_TYPES: { value: FieldType; label: string; hint: string }[] = [
  { value: "string", label: "string", hint: "문자열 · 예: pending" },
  { value: "number", label: "number", hint: "숫자 · 예: 0" },
  { value: "boolean", label: "boolean", hint: "true 또는 false" },
  { value: "timestamp", label: "timestamp", hint: "날짜/시간 · Timestamp로 저장" },
  { value: "null", label: "null", hint: "값 없이 필드만 만듭니다" },
  { value: "json", label: "map / array", hint: '예: {"ko":"","ja":""}' },
];

/**
 * A table cell turned back into the form's (type, text) pair — used both to
 * prefill the editor and to tell the server what value the admin was looking
 * at, so a stale edit can be refused instead of overwriting.
 */
export function cellToInput(cell: CellValue | undefined): {
  type: FieldType;
  text: string;
} {
  if (!cell) return { type: "string", text: "" };

  switch (cell.kind) {
    case "null":
      return { type: "null", text: "" };
    case "string":
      return { type: "string", text: cell.value };
    case "number":
      return { type: "number", text: String(cell.value) };
    case "bool":
      return { type: "boolean", text: String(cell.value) };
    case "date":
      return { type: "timestamp", text: cell.value };
    case "json":
      return { type: "json", text: cell.value };
  }
}

/** Reserved by Firestore itself — `__name__` and friends. */
const RESERVED = /^__.*__$/;

/** Characters Firestore treats specially inside a field path. */
const ILLEGAL = /[./[\]*`~]/;

/**
 * Returns a Korean error message, or null when the name is usable.
 *
 * `id` is rejected on top of Firestore's own rules: the table synthesises an
 * `id` column from the document id, so a real field by that name would take the
 * column over and hide every document's id.
 */
export function validateFieldName(raw: string): string | null {
  const name = raw.trim();

  if (!name) return "필드 이름을 입력해주세요.";
  if (name.length > 100) return "필드 이름은 100자 이하여야 합니다.";
  if (name === "id") {
    return "'id'는 문서 ID 열과 충돌하므로 사용할 수 없습니다.";
  }
  if (RESERVED.test(name)) {
    return "'__이름__' 형태는 Firestore 예약어입니다.";
  }
  if (ILLEGAL.test(name)) {
    return "필드 이름에 . / [ ] * ` ~ 는 사용할 수 없습니다.";
  }

  return null;
}
