"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import type { CollectionInfo } from "@/lib/firestore-view";

/**
 * Collection list. The names come straight from `listCollections()` — no
 * hardcoded menu — so a collection added in Firestore shows up here on the next
 * page load without a code change.
 */
export default function Sidebar({
  collections,
  email,
  logout,
}: {
  collections: CollectionInfo[];
  email: string;
  logout: () => Promise<void>;
}) {
  const segments = useSelectedLayoutSegments();
  const active = segments[0];

  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-white flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/admin" className="text-base font-bold text-gray-900">
          지게꾼 Admin
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Collections
        </p>
        {collections.length === 0 && (
          <p className="px-3 py-2 text-sm text-gray-400">컬렉션이 없습니다</p>
        )}
        {collections.map((c) => {
          const isActive = active === c.name;
          return (
            <Link
              key={c.name}
              href={`/admin/${c.name}`}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="truncate font-mono text-[13px]">{c.name}</span>
              <span
                className={`ml-2 shrink-0 text-[11px] tabular-nums ${
                  isActive ? "text-gray-300" : "text-gray-400"
                }`}
              >
                {c.count < 0 ? "—" : c.count.toLocaleString()}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 px-5 py-4">
        <p className="truncate text-xs text-gray-500">{email}</p>
        <form action={logout}>
          <button
            type="submit"
            className="mt-2 text-xs font-medium text-gray-600 hover:text-gray-900"
          >
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
