import Link from "next/link";
import { requireCs } from "@/lib/cs-auth";
import {
  countByStatus,
  listInquiries,
  RECENT_LIMIT,
  ROLE_LABEL,
  STATUSES,
  STATUS_LABEL,
  type InquiryStatus,
} from "@/lib/support-inquiries";
import LoadError from "@/components/admin/LoadError";
import { kst, StatusBadge } from "@/components/cs/inquiry-bits";

type Tab = InquiryStatus | "all";

/** 고객 문의 inbox: unanswered first, as tabs by status. */
export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // Gate the page itself — the layout renders concurrently.
  await requireCs();
  const { status } = await searchParams;
  const tab: Tab =
    status === "all" || STATUSES.includes(status as InquiryStatus)
      ? (status as Tab)
      : "open";

  let list, counts;
  try {
    [list, counts] = await Promise.all([listInquiries(tab), countByStatus()]);
  } catch (e) {
    return <LoadError error={e} />;
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    ...STATUSES.map((s) => ({ key: s, label: STATUS_LABEL[s], count: counts[s] })),
    { key: "all", label: "전체" },
  ];

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b border-gray-200 bg-white px-8 py-5">
        <h1 className="text-lg font-bold text-gray-900">고객 문의</h1>
        <p className="mt-1 text-sm text-gray-500">
          앱의 문의하기로 접수된 문의예요. 답변한 뒤 상태를 바꿔 주세요.
        </p>
        <div className="mt-3 flex gap-2">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.key === "open" ? "/cs/inquiries" : `/cs/inquiries?status=${t.key}`}
              className={`rounded-full px-3 py-1 text-sm ${
                tab === t.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1 tabular-nums opacity-70">{t.count}</span>
              )}
            </Link>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {list.items.length === 0 ? (
          <p className="text-sm text-gray-500">
            {tab === "open" ? "답변할 문의가 없어요." : "문의가 없어요."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                <th className="py-2 pr-4">접수</th>
                <th className="py-2 pr-4">상태</th>
                <th className="py-2 pr-4">분류</th>
                <th className="py-2 pr-4">문의</th>
                <th className="py-2">보낸 사람</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((q) => (
                <tr key={q.id} className="border-b border-gray-100 align-top hover:bg-gray-50">
                  <td className="whitespace-nowrap py-3 pr-4 text-xs text-gray-500">
                    {kst(q.createdAt)}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 text-gray-600">
                    {q.category ?? "-"}
                  </td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/cs/inquiries/${encodeURIComponent(q.id)}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {q.title ?? "(제목 없음)"}
                    </Link>
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{q.message}</p>
                  </td>
                  <td className="py-3">
                    {q.name ?? "이름 없음"}
                    {q.role && (
                      <span className="ml-1 text-xs text-gray-500">
                        {ROLE_LABEL[q.role] ?? q.role}
                      </span>
                    )}
                    <p className="text-xs text-gray-500">{q.email ?? q.phone ?? ""}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {list.truncated && (
          <p className="mt-4 text-xs text-gray-400">
            최근 {RECENT_LIMIT}건까지만 표시합니다.
          </p>
        )}
      </div>
    </div>
  );
}
