"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";

/**
 * The desk's menu. Unlike /admin's sidebar this is a fixed list of jobs, not
 * every collection: customer service only ever sees what is built for them.
 */
const MENU = [
  { segment: "inquiries", href: "/cs/inquiries", label: "고객 문의" },
  { segment: "holds", href: "/cs/holds", label: "보류 정산" },
  { segment: "users", href: "/cs/users", label: "사용자 조회" },
  { segment: "announcements", href: "/cs/announcements", label: "공지사항" },
  { segment: "faqs", href: "/cs/faqs", label: "자주 묻는 질문" },
] as const;

export default function CsSidebar({
  email,
  badges,
  logout,
}: {
  email: string;
  /** Work waiting in a section; null when the count could not be read. */
  badges: Partial<Record<(typeof MENU)[number]["segment"], number | null>>;
  logout: () => Promise<void>;
}) {
  const segments = useSelectedLayoutSegments();
  const active = segments[0];

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/cs" className="text-base font-bold text-gray-900">
          지게꾼 고객센터
        </Link>
      </div>

      <nav className="flex-1 px-2 py-3">
        {MENU.map((item) => {
          const isActive = active === item.segment;
          const badge = badges[item.segment];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{item.label}</span>
              {!!badge && (
                <span
                  className={`ml-2 rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${
                    isActive ? "bg-white text-gray-900" : "bg-orange-500 text-white"
                  }`}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 px-5 py-4">
        <p className="truncate text-xs text-gray-500">{email}</p>
        <form action={logout}>
          <button
            type="submit"
            className="mt-2 text-xs font-medium text-gray-700 hover:text-gray-900"
          >
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
