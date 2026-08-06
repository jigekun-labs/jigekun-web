"use client";

import { useState } from "react";
import {
  BLOCK_SPECS,
  specFor,
  type Block,
  type BlockFieldSpec,
} from "@/lib/announcement-blocks";

/**
 * Builds an announcement body as an ordered list of blocks.
 *
 * The order of this list is the order on screen — that is the whole layout
 * model, so reordering is the primary control rather than a nicety. Serialises
 * to JSON in a hidden input, which the server re-validates before writing.
 */
export default function BlockEditor({
  name,
  blocks,
  onChange,
}: {
  /** Form field the JSON is submitted under. */
  name: string;
  blocks: Block[];
  onChange: (next: Block[]) => void;
}) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function update(i: number, key: string, value: string) {
    onChange(
      blocks.map((b, j) => (j === i ? ({ ...b, [key]: value } as Block) : b))
    );
  }

  function move(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  function remove(i: number) {
    onChange(blocks.filter((_, j) => j !== i));
  }

  function add(type: string) {
    const spec = specFor(type);
    if (spec) onChange([...blocks, spec.make()]);
  }

  function drop(to: number) {
    if (dragFrom === null || dragFrom === to) return;
    const next = [...blocks];
    const [moved] = next.splice(dragFrom, 1);
    next.splice(to, 0, moved);
    onChange(next);
    setDragFrom(null);
    setDragOver(null);
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(blocks)} />

      <div className="flex flex-col gap-1.5">
        {blocks.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-400">
            아래에서 블록을 추가해 공지 내용을 만들어주세요.
          </p>
        )}

        {blocks.map((block, i) => {
          const spec = specFor(block.type);
          if (!spec) return null;

          return (
            <div
              key={i}
              draggable
              onDragStart={() => setDragFrom(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(i);
              }}
              onDragLeave={() => setDragOver((c) => (c === i ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                drop(i);
              }}
              onDragEnd={() => {
                setDragFrom(null);
                setDragOver(null);
              }}
              className={`flex gap-2 rounded-lg border bg-white px-2.5 py-2 ${
                dragOver === i ? "border-gray-900 bg-gray-50" : "border-gray-300"
              }`}
            >
              <span
                aria-hidden
                className="cursor-grab select-none pt-0.5 font-mono text-sm text-gray-400 active:cursor-grabbing"
              >
                ⠿
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="self-start rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {spec.label}
                </span>

                {/* Short fields sit side by side so a block stays one line
                    tall and the running order reads without scrolling. */}
                <div
                  className={
                    spec.fields.length > 1 && !spec.fields.some((f) => f.multiline)
                      ? "grid gap-1.5 sm:grid-cols-2"
                      : "flex flex-col gap-1.5"
                  }
                >
                  {spec.fields.map((field) => (
                    <BlockField
                      key={field.key}
                      field={field}
                      value={
                        (block as unknown as Record<string, string>)[
                          field.key
                        ] ?? ""
                      }
                      onChange={(v) => update(i, field.key, v)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <IconButton
                  label="위로 이동"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  ↑
                </IconButton>
                <IconButton
                  label="아래로 이동"
                  disabled={i === blocks.length - 1}
                  onClick={() => move(i, 1)}
                >
                  ↓
                </IconButton>
                <IconButton label="삭제" danger onClick={() => remove(i)}>
                  ✕
                </IconButton>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {BLOCK_SPECS.map((spec) => (
          <button
            key={spec.type}
            type="button"
            onClick={() => add(spec.type)}
            className="rounded-lg border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:border-solid hover:border-gray-900 hover:text-gray-900"
          >
            + {spec.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function BlockField({
  field,
  value,
  onChange,
}: {
  field: BlockFieldSpec;
  value: string;
  onChange: (next: string) => void;
}) {
  const cls = `w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[13px] outline-none focus:border-gray-900 ${
    field.mono ? "font-mono text-[12px]" : ""
  }`;

  if (field.multiline) {
    return (
      <textarea
        rows={3}
        value={value}
        placeholder={field.placeholder ?? field.label}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
      />
    );
  }

  return (
    <input
      value={value}
      placeholder={field.placeholder ?? field.label}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
      className={cls}
    />
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled = false,
  danger = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`h-5 w-6 rounded font-mono text-[11px] leading-none text-gray-400 disabled:opacity-30 ${
        disabled
          ? ""
          : danger
            ? "hover:bg-gray-100 hover:text-red-600"
            : "hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
}
