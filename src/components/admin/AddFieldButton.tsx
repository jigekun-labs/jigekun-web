"use client";

import { useState } from "react";
import AddFieldForm from "./AddFieldForm";

/**
 * Collection-header entry point: adds a field to every document at once, so it
 * shows up as a real column rather than only on the rows that happen to have it.
 */
export default function AddFieldButton({
  collection,
  docCount,
}: {
  collection: string;
  docCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        + 새 필드
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
          >
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900">새 필드 추가</h2>
              <p className="mt-0.5 font-mono text-xs text-gray-500">
                {collection}
              </p>
            </div>
            <AddFieldForm
              collection={collection}
              scope="collection"
              docCount={docCount}
              onDone={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
