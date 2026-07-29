import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { globalSearch, listCollections, type CollectionInfo, type GlobalHit } from "@/lib/firestore-view";
import LoadError from "@/components/admin/LoadError";

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // Gate the page itself, not just the layout: a layout and its page render
  // concurrently, so a layout-only redirect does not stop the reads below from
  // running (and throwing) first.
  await requireAdmin();

  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let collections: CollectionInfo[];
  let hits: GlobalHit[];
  try {
    [collections, hits] = await Promise.all([
      listCollections(),
      query ? globalSearch(query) : Promise.resolve<GlobalHit[]>([]),
    ]);
  } catch (e) {
    return <LoadError error={e} />;
  }

  return (
    <div className="px-8 py-8">
      <h1 className="text-xl font-bold text-gray-900">개요</h1>
      <p className="mt-1 text-sm text-gray-500">
        Firestore 컬렉션 {collections.length}개
      </p>

      {/* Global lookup: paste an id, email or phone and see everywhere it
          appears — the document itself plus every row that references it. */}
      <form method="get" className="mt-6 flex items-center gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="ID · 이메일 · 전화번호로 전체 검색"
          className="w-96 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          검색
        </button>
        {query && (
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">
            초기화
          </Link>
        )}
      </form>

      {query && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">
            <span className="font-mono">{query}</span> 검색 결과
          </h2>

          {hits.length === 0 ? (
            <p className="mt-3 rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500">
              어디에서도 찾지 못했습니다. 전체 검색은 문서 ID와 참조 필드
              (userId, workerId, jobListingId 등), 이메일, 전화번호만 정확히
              일치할 때 찾습니다.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
              {hits.map((hit) => (
                <li key={`${hit.collection}.${hit.field}`}>
                  <Link
                    href={`/admin/${hit.collection}?filter=${encodeURIComponent(
                      query
                    )}`}
                    className="flex items-center justify-between px-5 py-3 transition hover:bg-gray-50"
                  >
                    <span className="text-sm">
                      <span className="font-mono font-semibold text-gray-900">
                        {hit.collection}
                      </span>
                      <span className="ml-2 font-mono text-[12px] text-gray-500">
                        {hit.field === "id" ? "문서 ID" : hit.field}
                      </span>
                    </span>
                    <span className="text-sm tabular-nums text-gray-500">
                      {hit.count.toLocaleString()}건
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link
            key={c.name}
            href={`/admin/${c.name}`}
            className="rounded-xl border border-gray-200 bg-white px-5 py-4 transition hover:border-gray-300 hover:shadow-sm"
          >
            <p className="font-mono text-sm font-semibold text-gray-900">
              {c.name}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
              {c.count < 0 ? "—" : c.count.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">documents</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
