"use client";

import { useState } from "react";
import type { CellValue, Row } from "@/lib/firestore-view";
import AddFieldForm from "./AddFieldForm";
import EditFieldForm from "./EditFieldForm";
import AnnouncementStatus from "./AnnouncementStatus";

/** The Firestore type name, shown next to each field so an edit is informed. */
function typeLabel(cell: CellValue | undefined): string {
  if (!cell) return "—";
  switch (cell.kind) {
    case "null":
      return "null";
    case "string":
      return "string";
    case "number":
      return "number";
    case "bool":
      return "boolean";
    case "date":
      return "timestamp";
    case "json":
      return "map / array";
  }
}

/**
 * A value at full length, wrapped rather than truncated — the panel is where
 * you go precisely because the cell was too small.
 */
function FieldValue({ cell }: { cell: CellValue | undefined }) {
  if (!cell || cell.kind === "null") {
    return <span className="text-gray-300">—</span>;
  }

  switch (cell.kind) {
    case "bool":
      return (
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
            cell.value
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {String(cell.value)}
        </span>
      );
    case "number":
      return <span className="tabular-nums">{cell.value.toLocaleString()}</span>;
    case "date":
      return (
        <span className="tabular-nums text-gray-600">
          {cell.value.slice(0, 19).replace("T", " ")}
        </span>
      );
    case "json":
      return (
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded bg-gray-50 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-gray-600">
          {cell.value}
        </pre>
      );
    case "string":
      return <span className="break-all">{cell.value}</span>;
  }
}

/**
 * The row detail panel: every field of the selected document, each editable on
 * its own.
 *
 * Editing lives here rather than in the table on purpose. Inline cell editing
 * would put a write control on every cell of a 1,000-row grid — heavy to
 * render, and far too easy to change the wrong row. One document at a time,
 * one field at a time, with the type visible, is the safer shape.
 */
export default function DocumentPanel({
  collection,
  columns,
  row,
  onClose,
}: {
  collection: string;
  columns: string[];
  row: Row;
  onClose: () => void;
}) {
  const [view, setView] = useState<"fields" | "json">("fields");
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Column order (priority fields first), narrowed to what this document has.
  // `id` is the synthetic document-id column, shown in the header instead.
  const fields = columns.filter(
    (col) => col !== "id" && row.cells[col] !== undefined
  );

  return (
    <aside className="flex w-[420px] shrink-0 flex-col overflow-auto border-l border-gray-200 bg-white">
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Document
            </p>
            <p className="truncate font-mono text-sm text-gray-900">{row.id}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-sm text-gray-400 hover:text-gray-700"
          >
            닫기
          </button>
        </div>

        <div className="mt-3 flex gap-1">
          {(["fields", "json"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                view === v
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {v === "fields" ? "필드" : "JSON"}
            </button>
          ))}
        </div>
      </div>

      {collection === "announcements" && <AnnouncementStatus row={row} />}

      {view === "json" ? (
        <pre className="whitespace-pre-wrap break-all px-5 py-4 font-mono text-[12px] leading-relaxed text-gray-700">
          {row.json}
        </pre>
      ) : (
        <div className="flex-1 divide-y divide-gray-100">
          {fields.length === 0 && (
            <p className="px-5 py-4 text-sm text-gray-400">필드가 없습니다</p>
          )}
          {fields.map((field) => (
            <div key={field} className="px-5 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate font-mono text-[12px] font-medium text-gray-900">
                    {field}
                  </span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-gray-400">
                    {typeLabel(row.cells[field])}
                  </span>
                </div>
                {editing !== field && (
                  <button
                    onClick={() => {
                      setEditing(field);
                      setAdding(false);
                    }}
                    className="shrink-0 text-[11px] font-medium text-gray-400 hover:text-gray-900"
                  >
                    편집
                  </button>
                )}
              </div>

              {editing === field ? (
                <EditFieldForm
                  // Remount when the row or field changes so the editor never
                  // keeps another document's baseline value.
                  key={`${row.id}:${field}`}
                  collection={collection}
                  docId={row.id}
                  field={field}
                  cell={row.cells[field]}
                  cells={row.cells}
                  onDone={() => setEditing(null)}
                />
              ) : (
                <div className="mt-1 text-[13px] text-gray-700">
                  <FieldValue cell={row.cells[field]} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 px-5 py-4">
        {adding ? (
          <AddFieldForm
            key={row.id}
            collection={collection}
            scope="document"
            docId={row.id}
            onDone={() => setAdding(false)}
          />
        ) : (
          <button
            onClick={() => {
              setAdding(true);
              setEditing(null);
            }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + 필드 추가
          </button>
        )}
      </div>
    </aside>
  );
}
