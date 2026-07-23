"use client";

import { useMemo, useState } from "react";
import type { CellValue, Row } from "@/lib/firestore-view";

/**
 * Every value in a document, flattened to one lowercase string.
 *
 * Values only — keys are excluded on purpose, otherwise typing "email" would
 * match every row in the collection. Derived from the JSON already sent for the
 * detail panel, so filtering costs no extra payload.
 */
function searchableText(row: Row): string {
  const parts: string[] = [row.id];

  const walk = (value: unknown) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) return value.forEach(walk);
    if (typeof value === "object") return Object.values(value).forEach(walk);
    parts.push(String(value));
  };

  try {
    walk(JSON.parse(row.json));
  } catch {
    parts.push(row.json);
  }

  return parts.join(" ").toLowerCase();
}

function Cell({ value }: { value: CellValue | undefined }) {
  if (!value || value.kind === "null") {
    return <span className="text-gray-300">—</span>;
  }

  switch (value.kind) {
    case "bool":
      return (
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
            value.value
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {String(value.value)}
        </span>
      );
    case "number":
      return (
        <span className="tabular-nums">{value.value.toLocaleString()}</span>
      );
    case "date":
      // Sortable, unambiguous, and narrow: 2026-07-22 14:03
      return (
        <span className="whitespace-nowrap tabular-nums text-gray-600">
          {value.value.slice(0, 16).replace("T", " ")}
        </span>
      );
    case "json":
      return (
        <span className="font-mono text-[11px] text-gray-500">
          {value.preview}
        </span>
      );
    case "string":
      return (
        <span title={value.value.length > 40 ? value.value : undefined}>
          {value.value.length > 40
            ? `${value.value.slice(0, 39)}…`
            : value.value}
        </span>
      );
  }
}

export default function DataTable({
  columns,
  rows,
  /** False when the table holds only one page, so the filter can say so. */
  complete = true,
  /** Prefilled from `?filter=`, so a global-search hit lands already narrowed. */
  initialFilter = "",
}: {
  columns: string[];
  rows: Row[];
  complete?: boolean;
  initialFilter?: string;
}) {
  const [selected, setSelected] = useState<Row | null>(null);
  const [filter, setFilter] = useState(initialFilter);

  // Indexed once per page load, not per keystroke.
  const index = useMemo(
    () => rows.map((row) => ({ row, text: searchableText(row) })),
    [rows]
  );

  const needle = filter.trim().toLowerCase();
  const visible = useMemo(
    () =>
      needle
        ? index.filter((entry) => entry.text.includes(needle)).map((e) => e.row)
        : rows,
    [index, needle, rows]
  );

  if (rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        문서가 없습니다
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 py-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={
            complete
              ? "필터 — 모든 필드에서 포함되는 값 찾기"
              : "필터 — 현재 페이지에서만 검색"
          }
          className="w-80 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-900"
        />
        <span className="text-xs tabular-nums text-gray-500">
          {needle
            ? `${visible.length.toLocaleString()} / ${rows.length.toLocaleString()}`
            : `${rows.length.toLocaleString()}개`}
        </span>
        {needle && (
          <button
            onClick={() => setFilter("")}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            지우기
          </button>
        )}
        {!complete && (
          <span className="text-xs text-amber-700">
            이 컬렉션은 너무 커서 페이지 단위로만 필터됩니다
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
      <div className="min-w-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap border-b border-gray-200 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  일치하는 문서가 없습니다
                </td>
              </tr>
            )}
            {visible.map((row) => (
              <tr
                key={row.id}
                onClick={() => setSelected(row)}
                className={`cursor-pointer border-b border-gray-100 transition hover:bg-blue-50/50 ${
                  selected?.id === row.id ? "bg-blue-50" : "bg-white"
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className="max-w-[280px] truncate px-4 py-2.5 text-gray-800"
                  >
                    <Cell value={row.cells[col]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <aside className="w-[420px] shrink-0 overflow-auto border-l border-gray-200 bg-white">
          <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-gray-100 bg-white px-5 py-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Document
              </p>
              <p className="truncate font-mono text-sm text-gray-900">
                {selected.id}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="shrink-0 text-sm text-gray-400 hover:text-gray-700"
            >
              닫기
            </button>
          </div>
          <pre className="whitespace-pre-wrap break-all px-5 py-4 font-mono text-[12px] leading-relaxed text-gray-700">
            {selected.json}
          </pre>
        </aside>
      )}
      </div>
    </div>
  );
}
