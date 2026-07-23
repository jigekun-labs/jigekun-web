import { notFound } from "next/navigation";
import Link from "next/link";
import {
  fetchAll,
  fetchPage,
  listCollections,
  FULL_LOAD_LIMIT,
  PAGE_SIZE,
} from "@/lib/firestore-view";
import DataTable from "@/components/admin/DataTable";

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<{ cursor?: string; filter?: string }>;
}) {
  const { collection } = await params;
  const { cursor, filter } = await searchParams;

  // Only real collections — keeps a typo'd URL from turning into an empty
  // table that looks like a collection with no documents.
  const known = await listCollections();
  const info = known.find((c) => c.name === collection);
  if (!info) notFound();

  // Small enough to hand over whole? Then the table filters locally and every
  // field is searchable by substring. Otherwise fall back to paging.
  const complete = info.count >= 0 && info.count <= FULL_LOAD_LIMIT;
  const page = complete
    ? await fetchAll(collection)
    : await fetchPage(collection, cursor);

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b border-gray-200 bg-white px-8 py-5">
        <h1 className="font-mono text-lg font-bold text-gray-900">
          {collection}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {complete
            ? `${page.rows.length.toLocaleString()}개 전체`
            : `${page.total.toLocaleString()}개 중 ${page.rows.length}개 표시${
                cursor ? " (다음 페이지)" : ""
              }`}
          <span className="ml-2 text-gray-400">
            · 정렬 {page.sortedBy ? `${page.sortedBy} ↓` : "문서 ID"}
          </span>
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        <DataTable
          key={filter ?? ""}
          columns={page.columns}
          rows={page.rows}
          complete={complete}
          initialFilter={filter ?? ""}
        />
      </div>

      {!complete && (
        <footer className="shrink-0 border-t border-gray-200 bg-white px-8 py-3 flex items-center gap-3">
          {cursor && (
            <Link
              href={`/admin/${collection}`}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              처음으로
            </Link>
          )}
          {page.nextCursor ? (
            <Link
              href={`/admin/${collection}?cursor=${page.nextCursor}`}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              다음 {PAGE_SIZE}개
            </Link>
          ) : (
            <span className="text-sm text-gray-400">마지막 페이지</span>
          )}
        </footer>
      )}
    </div>
  );
}
