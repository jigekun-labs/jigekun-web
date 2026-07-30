/**
 * Instant navigation feedback. Next renders this the moment a collection is
 * clicked and swaps in the real table once the server finishes fetching, so
 * the click no longer feels like nothing happened. The sidebar (in the layout)
 * stays put; only this content area is replaced.
 *
 * Shaped like the table it stands in for — a header bar plus shimmer rows —
 * rather than a bare spinner, so the layout doesn't jump when data arrives.
 */
export default function CollectionLoading() {
  return (
    <div className="flex h-screen flex-col" aria-busy="true">
      <header className="shrink-0 border-b border-gray-200 bg-white px-8 py-5">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-3 w-64 animate-pulse rounded bg-gray-100" />
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {/* Filter bar placeholder */}
        <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-2">
          <div className="h-8 w-80 animate-pulse rounded-lg bg-gray-100" />
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 py-3">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">불러오는 중…</span>
    </div>
  );
}
