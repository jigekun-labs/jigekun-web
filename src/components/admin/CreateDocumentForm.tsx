"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createDocumentAction,
  type CreateDocState,
} from "@/app/admin/document-actions";
import type { CollectionSchema } from "@/lib/collection-schemas";
import FieldValueInput from "./FieldValueInput";

/**
 * Typed create form, driven by the collection's schema.
 *
 * Announcements default to a draft (`isActive: false`) because publishing is
 * not a dashboard action — it wakes a Cloud Function that pushes to every
 * user's phone. Anything that can cause that says so, in red, before you click.
 */
export default function CreateDocumentForm({
  collection,
  schema,
  onDone,
}: {
  collection: string;
  schema: CollectionSchema;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<CreateDocState, FormData>(
    createDocumentAction,
    {}
  );

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(schema.fields.map((f) => [f.name, f.initial ?? ""]))
  );
  const [silent, setSilent] = useState(false);

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [state.ok, router, onDone]);

  const set = (name: string, next: string) =>
    setValues((prev) => ({ ...prev, [name]: next }));

  // A danger note only counts when the switch it belongs to is actually on.
  const armed = schema.fields.filter(
    (f) => f.danger && values[f.name] === "true"
  );
  // Going live is only a broadcast if the trigger is not being pre-empted.
  const broadcasting = armed.length > 0 && !silent;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="collection" value={collection} />

      {schema.note && (
        <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-600">
          {schema.note}
        </p>
      )}

      {schema.fields.map((field) => (
        <div key={field.name}>
          <label className="mb-1 flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {field.label}
            <span className="font-mono normal-case tracking-normal text-gray-300">
              {field.name}
            </span>
            {field.required && <span className="text-red-400">*</span>}
          </label>

          <FieldValueInput
            type={field.type}
            value={values[field.name] ?? ""}
            onChange={(next) => set(field.name, next)}
            multiline={field.multiline}
            name={`f_${field.name}`}
          />

          {field.help && (
            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              {field.help}
            </p>
          )}
          {field.danger && values[field.name] === "true" && !silent && (
            <p className="mt-1 rounded-lg bg-red-50 px-2.5 py-2 text-xs leading-relaxed text-red-700">
              {field.danger}
            </p>
          )}
        </div>
      ))}

      {/* Only meaningful once the document is actually going live. */}
      {schema.silentPublish && armed.length > 0 && (
        <label className="flex cursor-pointer gap-2 rounded-lg border border-gray-200 px-3 py-2">
          <input
            type="checkbox"
            name="silent"
            value="true"
            checked={silent}
            onChange={(e) => setSilent(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <span className="text-xs font-medium text-gray-900">
              {schema.silentPublish.label}
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
              {schema.silentPublish.help}
            </span>
          </span>
        </label>
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

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:bg-gray-300 ${
            broadcasting
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gray-900 hover:bg-gray-800"
          }`}
        >
          {pending
            ? "저장 중…"
            : broadcasting
              ? "저장하고 전체 발송"
              : armed.length
                ? "알림 없이 게시"
                : "저장"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
