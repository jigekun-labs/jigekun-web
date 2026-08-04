"use client";

import type { FieldType } from "@/lib/field-types";

export const INPUT =
  "w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-900";

/**
 * `datetime-local` wants local wall-clock time with no zone, but Firestore
 * hands the browser an ISO instant. Convert in the admin's own timezone, which
 * is the one they are reading the table in.
 *
 * Only ever called from an event handler or a panel that renders after a click,
 * so the server never produces a different string during SSR.
 */
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/**
 * The value control for one field type. Controlled, and shared by the add and
 * edit forms so a `boolean` is entered the same way in both.
 *
 * Everything is submitted as a string under the name `value`; the server owns
 * turning it into a Firestore value.
 */
export default function FieldValueInput({
  type,
  value,
  onChange,
  /** Long-form text (an announcement body) gets a textarea instead. */
  multiline = false,
  name = "value",
}: {
  type: FieldType;
  value: string;
  onChange: (next: string) => void;
  multiline?: boolean;
  name?: string;
}) {
  if (type === "string" && multiline) {
    return (
      <textarea
        name={name}
        rows={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} leading-relaxed`}
      />
    );
  }

  switch (type) {
    case "boolean":
      return (
        <select
          name={name}
          value={value === "true" ? "true" : "false"}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT}
        >
          <option value="false">false</option>
          <option value="true">true</option>
        </select>
      );

    case "number":
      return (
        <input
          name={name}
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${INPUT} tabular-nums`}
        />
      );

    case "timestamp":
      return (
        <input
          name={name}
          type="datetime-local"
          step="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT}
        />
      );

    case "json":
      return (
        <textarea
          name={name}
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className={`${INPUT} font-mono text-[12px]`}
        />
      );

    default:
      return (
        <input
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          className={INPUT}
        />
      );
  }
}
