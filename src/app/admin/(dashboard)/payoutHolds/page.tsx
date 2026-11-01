import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listHolds, REASON_LABEL, STATUS_LABEL } from "@/lib/payout-holds";
import LoadError from "@/components/admin/LoadError";

function kst(iso: string | null): string {
  return iso
    ? new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
    : "-";
}

/**
 * 보류 정산 — held worker wages to settle by hand. Takes over the generic
 * `/admin/payoutHolds` table (a static segment beats `[collection]`).
 */
export default async function PayoutHoldsPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  // Gate the page itself — the layout renders concurrently.
  await requireAdmin();
  const { all } = await searchParams;
  const open = all !== "1";

  let holds;
  try {
    holds = await listHolds(open);
  } catch (e) {
    return <LoadError error={e} />;
  }

  const tab = (label: string, href: string, active: boolean) => (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-sm ${
        active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b border-gray-200 bg-white px-8 py-5">
        <h1 className="text-lg font-bold text-gray-900">보류 정산</h1>
        <p className="mt-1 text-sm text-gray-500">
          회사 계좌로 보류된 작업자 보수예요. 상태 기록을 확인한 뒤 직접
          지급·환불하고, 여기서 처리 완료로 바꿔 주세요.
        </p>
        <div className="mt-3 flex gap-2">
          {tab("처리 전", "/admin/payoutHolds", open)}
          {tab("전체", "/admin/payoutHolds?all=1", !open)}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {holds.length === 0 ? (
          <p className="text-sm text-gray-500">
            {open ? "처리할 보류 건이 없어요." : "보류 건이 없어요."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                <th className="py-2 pr-4">요청</th>
                <th className="py-2 pr-4">작업자</th>
                <th className="py-2 pr-4">사유</th>
                <th className="py-2 pr-4 text-right">금액</th>
                <th className="py-2 pr-4">회사 계좌</th>
                <th className="py-2 pr-4">상태</th>
                <th className="py-2">보류일</th>
              </tr>
            </thead>
            <tbody>
              {holds.map((h) => (
                <tr key={h.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/payoutHolds/${encodeURIComponent(h.id)}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {h.requestNo ?? h.jobId}
                    </Link>
                    <p className="text-xs text-gray-500">{h.jobTitle ?? ""}</p>
                  </td>
                  <td className="py-3 pr-4">{h.workerName ?? h.workerId}</td>
                  <td className="py-3 pr-4">
                    {REASON_LABEL[h.reason] ?? h.reason}
                    {h.reason === "absent" && h.workerCheckedIn && (
                      <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                        ⚠ GPS 도착함
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {h.amount.toLocaleString("ko-KR")}원
                  </td>
                  <td className="py-3 pr-4 text-xs text-gray-600">
                    {h.sentToCompanyAt ? "입금됨" : "입금 전"}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${
                        h.status === "held"
                          ? "bg-orange-50 text-orange-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {STATUS_LABEL[h.status]}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-gray-500">{kst(h.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
