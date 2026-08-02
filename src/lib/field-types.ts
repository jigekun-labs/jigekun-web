/**
 * The field types an admin can create from the dashboard, and the rules a field
 * name has to satisfy.
 *
 * Deliberately free of any firebase-admin import so both the browser form and
 * the server action can share it — the client gets instant validation, the
 * server re-runs the same check as the authoritative one.
 */

export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "timestamp"
  | "null"
  | "json";

export const FIELD_TYPES: { value: FieldType; label: string; hint: string }[] = [
  { value: "string", label: "문자열", hint: "예: pending" },
  { value: "number", label: "숫자", hint: "예: 0" },
  { value: "boolean", label: "참/거짓", hint: "true 또는 false" },
  { value: "timestamp", label: "날짜/시간", hint: "Firestore Timestamp로 저장" },
  { value: "null", label: "비어 있음 (null)", hint: "값 없이 필드만 만듭니다" },
  { value: "json", label: "JSON (map / 배열)", hint: '예: {"ko":"","ja":""}' },
];

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
