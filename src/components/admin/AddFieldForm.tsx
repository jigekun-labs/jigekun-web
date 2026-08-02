"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addFieldAction, type AddFieldState } from "@/app/admin/field-actions";
import { FIELD_TYPES, validateFieldName, type FieldType } from "@/lib/field-types";

const INPUT =
  "w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-900";

/**
 * The field editor, shared by both places a field can be created: the detail
 * panel (one document) and the collection header (every document).
 *
 * Only the scope differs, so the name/type/value controls and their validation
 * live here once.
 */
export default function AddFieldForm({
  collection,
  scope,
  docId,
  docCount,
  onDone,
}: {
  collection: string;
  scope: "document" | "collection";
  /** Required when scope is "document". */
  docId?: string;
  /** Document count, shown so a bulk write states its size up front. */
  docCount?: number;
  /** Called after a successful write — closes the modal / collapses the form. */
  onDone?: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AddFieldState, FormData>(
    addFieldAction,
    {}
  );

  const [name, setName] = useState("");
  const [type, setType] = useState<FieldType>("string");
  // Only surfaced once the admin has typed something, so the form does not open
  // already complaining.
  const nameError = name ? validateFieldName(name) : null;

  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => nameRef.current?.focus(), []);

  // The table is rendered from a server component, so a write only shows up
  // after the route re-renders.
  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    const t = setTimeout(() => onDone?.(), 1200);
    return () => clearTimeout(t);
  }, [state.ok, router, onDone]);

  const hint = FIELD_TYPES.find((t) => t.value === type)?.hint;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="collection" value={collection} />
      <input type="hidden" name="scope" value={scope} />
      {docId && <input type="hidden" name="docId" value={docId} />}

      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          필드 이름
        </label>
        <input
          ref={nameRef}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="isVerified"
          autoComplete="off"
          spellCheck={false}
          className={`${INPUT} font-mono ${
            nameError ? "border-red-400 focus:border-red-500" : ""
          }`}
        />
        {nameError && (
          <p className="mt-1 text-xs text-red-600">{nameError}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          타입
        </label>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as FieldType)}
          className={INPUT}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {type !== "null" && (
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {scope === "collection" ? "기본값" : "값"}
          </label>
          <ValueInput type={type} />
          <p className="mt-1 text-xs text-gray-400">{hint}</p>
        </div>
      )}

      {scope === "collection" && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          {docCount !== undefined && docCount >= 0
            ? `${collection} 컬렉션의 문서 ${docCount.toLocaleString()}개에 이 필드를 추가합니다. `
            : `${collection} 컬렉션의 모든 문서에 이 필드를 추가합니다. `}
          이미 같은 이름의 필드가 있는 문서는 값을 그대로 둡니다.
        </p>
      )}

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-xs leading-relaxed text-green-800">
          {state.ok}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={pending || !!nameError || !name.trim()}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {pending ? "추가하는 중…" : "필드 추가"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}

/** One control per type — all named `value`, and only one is ever mounted. */
function ValueInput({ type }: { type: FieldType }) {
  switch (type) {
    case "boolean":
      return (
        <select name="value" defaultValue="false" className={INPUT}>
          <option value="false">false</option>
          <option value="true">true</option>
        </select>
      );
    case "number":
      return (
        <input
          name="value"
          type="number"
          step="any"
          defaultValue="0"
          className={`${INPUT} tabular-nums`}
        />
      );
    case "timestamp":
      return <input name="value" type="datetime-local" className={INPUT} />;
    case "json":
      return (
        <textarea
          name="value"
          rows={4}
          defaultValue="{}"
          spellCheck={false}
          className={`${INPUT} font-mono text-[12px]`}
        />
      );
    default:
      return (
        <input
          name="value"
          defaultValue=""
          autoComplete="off"
          className={INPUT}
        />
      );
  }
}
