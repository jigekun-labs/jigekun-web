"use client";

import { useState } from "react";
import type { CollectionSchema } from "@/lib/collection-schemas";
import CreateDocumentForm from "./CreateDocumentForm";

/** Header button + modal, shown only on collections with a declared schema. */
export default function CreateDocumentButton({
  collection,
  schema,
}: {
  collection: string;
  schema: CollectionSchema;
}) {
  const [open, setOpen] = useState(false);

  // A block body is a layout being assembled, so it needs width to read the
  // order at a glance. A plain form (faqs) stays narrow — a wide modal for four
  // short fields just spreads them out.
  const wide = schema.fields.some((f) => f.control === "blocks");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
      >
        + 새 {schema.label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 py-10"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full rounded-xl bg-white p-5 shadow-xl ${
              wide ? "max-w-3xl" : "max-w-lg"
            }`}
          >
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900">
                새 {schema.label}
              </h2>
              <p className="mt-0.5 font-mono text-xs text-gray-500">
                {collection}
              </p>
            </div>
            <CreateDocumentForm
              collection={collection}
              schema={schema}
              onDone={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
