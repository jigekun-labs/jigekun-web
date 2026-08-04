"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateFieldAction,
  type EditFieldState,
} from "@/app/admin/field-actions";
import { FIELD_TYPES, cellToInput, type FieldType } from "@/lib/field-types";
import { broadcastWarning } from "@/lib/collection-schemas";
import type { CellValue } from "@/lib/firestore-view";
import FieldValueInput, {
  INPUT,
  isoToLocalInput,
} from "./FieldValueInput";

/**
 * Inline editor for a single field of a single document.
 *
 * Scoped deliberately narrowly: one field, one document, one save. The table
 * itself stays read-only — editing lives in the detail panel, where there is
 * room to show the field's type and full value.
 */
export default function EditFieldForm({
  collection,
  docId,
  field,
  cell,
  cells,
  onDone,
}: {
  collection: string;
  docId: string;
  field: string;
  /** The value as currently displayed — prefills the form and guards the write. */
  cell: CellValue | undefined;
  /** Every cell of the document, so side effects of this edit can be detected. */
  cells: Record<string, CellValue>;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<EditFieldState, FormData>(
    updateFieldAction,
    {}
  );

  // What the admin was looking at. Captured once, on mount: it is the baseline
  // the server compares against, so it must not follow later re-renders.
  const [expected] = useState(() => cellToInput(cell));

  const [type, setType] = useState<FieldType>(expected.type);
  const [value, setValue] = useState(() =>
    expected.type === "timestamp"
      ? isoToLocalInput(expected.text)
      : expected.text
  );

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [state.ok, router, onDone]);

  const warning = broadcastWarning(collection, cells, field, value);

  // Changing the type makes the old text meaningless more often than not, so
  // start the new control from something valid for it.
  function changeType(next: FieldType) {
    setType(next);
    if (next === expected.type) {
      setValue(
        next === "timestamp" ? isoToLocalInput(expected.text) : expected.text
      );
      return;
    }
    setValue(next === "boolean" ? "false" : next === "json" ? "{}" : "");
  }

  return (
    <form action={formAction} className="space-y-2 pt-1">
      <input type="hidden" name="collection" value={collection} />
      <input type="hidden" name="docId" value={docId} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="expectedType" value={expected.type} />
      <input type="hidden" name="expectedValue" value={expected.text} />

      <select
        name="type"
        value={type}
        onChange={(e) => changeType(e.target.value as FieldType)}
        className={`${INPUT} py-1 text-xs`}
      >
        {FIELD_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {type !== "null" && (
        <FieldValueInput type={type} value={value} onChange={setValue} />
      )}

      {/* Saving an announcement can wake the app's fan-out trigger. Say so
          here, where the save button is, rather than only in the panel header. */}
      {warning && (
        <p className="rounded-lg bg-red-50 px-2.5 py-2 text-[11px] font-medium leading-relaxed text-red-700">
          ⚠ {warning}
        </p>
      )}

      {state.error && (
        <p className="rounded-lg bg-red-50 px-2.5 py-2 text-[11px] leading-relaxed text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-green-50 px-2.5 py-2 text-[11px] text-green-800">
          {state.ok}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium text-white disabled:bg-gray-300 ${
            warning ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-gray-800"
          }`}
        >
          {pending ? "저장 중…" : warning ? "저장하고 전체 발송" : "저장"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
