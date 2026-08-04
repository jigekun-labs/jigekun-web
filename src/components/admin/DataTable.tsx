"use client";

import { useMemo, useState } from "react";
import type { CellValue, Row } from "@/lib/firestore-view";
import DocumentPanel from "./DocumentPanel";

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

/**
 * A cell reduced to something orderable. Dates are ISO strings, which sort
 * chronologically as plain text; booleans become 0/1; maps/arrays sort by their
 * preview. null means "no value" and is always pushed to the end (below).
 */
function sortKey(value: CellValue | undefined): number | string | null {
  if (!value || value.kind === "null") return null;
  switch (value.kind) {
    case "number":
      return value.value;
    case "bool":
      return value.value ? 1 : 0;
    case "date":
      return value.value;
    case "string":
      return value.value;
    case "json":
      return value.preview;
  }
}

type SortDir = "asc" | "desc";

function compareRows(a: Row, b: Row, field: string, dir: SortDir): number {
  const ka = sortKey(a.cells[field]);
  const kb = sortKey(b.cells[field]);

  // Empty values sink to the bottom regardless of direction.
  if (ka === null && kb === null) return 0;
  if (ka === null) return 1;
  if (kb === null) return -1;

  const c =
    typeof ka === "number" && typeof kb === "number"
      ? ka - kb
      : String(ka).localeCompare(String(kb), undefined, {
          numeric: true,
          sensitivity: "base",
        });

  return dir === "asc" ? c : -c;
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
  collection,
  columns,
  rows,
  /** False when the table holds only one page, so the filter can say so. */
  complete = true,
  /** Prefilled from `?filter=`, so a global-search hit lands already narrowed. */
  initialFilter = "",
}: {
  collection: string;
  columns: string[];
  rows: Row[];
  complete?: boolean;
  initialFilter?: string;
}) {
  // The id rather than the row itself: after a write the server sends fresh
  // rows, and holding the old object would leave the panel showing stale JSON.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState(initialFilter);
  const [sort, setSort] = useState<{ field: string; dir: SortDir } | null>(null);

  const selected = rows.find((row) => row.id === selectedId) ?? null;

  // Sorting reorders whatever rows are loaded. For a paged (incomplete)
  // collection that would only reorder the current page, which is misleading,
  // so headers are sortable only when the whole collection is in the browser.
  const sortable = complete;

  // id is deliberately excluded (it's an opaque key, not meaningful data).
  function toggleSort(col: string) {
    if (!sortable || col === "id") return;
    setSort((prev) => {
      if (!prev || prev.field !== col) return { field: col, dir: "asc" };
      if (prev.dir === "asc") return { field: col, dir: "desc" };
      return null; // third click → back to the default (newest-first) order
    });
  }

  // Indexed once per page load, not per keystroke.
  const index = useMemo(
    () => rows.map((row) => ({ row, text: searchableText(row) })),
    [rows]
  );

  const needle = filter.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      needle
        ? index.filter((entry) => entry.text.includes(needle)).map((e) => e.row)
        : rows,
    [index, needle, rows]
  );

  // Filter first, then sort. Array.prototype.sort is stable, so rows with equal
  // keys keep the server's default order (newest first).
  const visible = useMemo(
    () =>
      sort
        ? [...filtered].sort((a, b) => compareRows(a, b, sort.field, sort.dir))
        : filtered,
    [filtered, sort]
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
              {columns.map((col) => {
                const isSortable = sortable && col !== "id";
                const active = sort?.field === col;
                return (
                  <th
                    key={col}
                    aria-sort={
                      active
                        ? sort!.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className="whitespace-nowrap border-b border-gray-200 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {isSortable ? (
                      <button
                        onClick={() => toggleSort(col)}
                        className="group flex items-center gap-1 uppercase tracking-wide hover:text-gray-900"
                        title={`${col} 기준 정렬`}
                      >
                        {col}
                        <span
                          className={`text-[10px] leading-none ${
                            active
                              ? "text-gray-900"
                              : "text-gray-300 group-hover:text-gray-400"
                          }`}
                        >
                          {active ? (sort!.dir === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      </button>
                    ) : (
                      col
                    )}
                  </th>
                );
              })}
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
                onClick={() => setSelectedId(row.id)}
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
        <DocumentPanel
          // Remounts on a different row, so an editor left open on one document
          // never carries over to the next.
          key={selected.id}
          collection={collection}
          columns={columns}
          row={selected}
          onClose={() => setSelectedId(null)}
        />
      )}
      </div>
    </div>
  );
}
