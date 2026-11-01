import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
  fetchHold,
  ISSUE_LABEL,
  REASON_LABEL,
  STATUS_LABEL,
} from "@/lib/payout-holds";
import LoadError from "@/components/admin/LoadError";
import ResolveHoldForm from "@/components/admin/ResolveHoldForm";

function kst(iso: string | null): string {
  return iso
    ? new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
    : "-";
}

const BY_LABEL: Record<string, string> = {
  worker: "작업자",
  employer: "요청자",
  system: "시스템",
};

/** One held wage: what happened (issues + both sides' status history), and
 * closing it once the money is settled. */
export default async function PayoutHoldPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  let data;
  try {
    data = await fetchHold(decodeURIComponent(id));
  } catch (e) {
    return <LoadError error={e} />;
  }
  if (!data) notFound();
  const { hold, issues, events } = data;

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-4 py-1.5 text-sm">
      <dt className="w-28 shrink-0 text-gray-500">{label}</dt>
      <dd className="min-w-0 break-all text-gray-900">{value}</dd>
    </div>
  );

  return (
    <div className="h-screen overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-6">
        <Link href="/admin/payoutHolds" className="text-sm text-gray-500 hover:underline">
          ← 보류 정산
        </Link>
        <h1 className="mt-3 text-lg font-bold text-gray-900">
          {hold.requestNo ?? hold.jobId} · {hold.workerName ?? hold.workerId}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{hold.jobTitle}</p>

        {hold.reason === "absent" && hold.workerCheckedIn && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            ⚠ 작업자가 GPS로 직접 도착 체크인했는데, 요청자가 &apos;안 왔어요&apos;로
            표시했어요. 상태 기록을 꼭 확인해 주세요.
          </div>
        )}

        <section className="mt-6 rounded-lg border border-gray-200 bg-white px-5 py-4">
          <dl>
            {row("상태", STATUS_LABEL[hold.status])}
            {row("사유", REASON_LABEL[hold.reason] ?? hold.reason)}
            {row("보류 금액", `${hold.amount.toLocaleString("ko-KR")}원 (작업 보수 ${hold.grossAmount.toLocaleString("ko-KR")}원)`)}
            {row("회사 계좌 입금", hold.sentToCompanyAt ? kst(hold.sentToCompanyAt) : "입금 전 (다음 영업일)")}
            {row("작업일", kst(hold.jobDate))}
            {row("작업", <Link className="underline" href={`/admin/timeline/${encodeURIComponent(hold.jobId)}`}>{hold.jobId} · 상태 기록 →</Link>)}
            {row("요청자", <Link className="underline" href={`/admin?q=${encodeURIComponent(hold.companyId)}`}>{hold.companyId}</Link>)}
            {row("작업자", <Link className="underline" href={`/admin?q=${encodeURIComponent(hold.workerId)}`}>{hold.workerId}</Link>)}
            {row("지급 기록", hold.ledgerId)}
            {row("보류일", kst(hold.createdAt))}
            {hold.status !== "held" && (
              <>
                {row("처리", `${kst(hold.resolvedAt)} · ${hold.resolvedBy ?? ""}`)}
                {hold.resolutionNote && row("메모", hold.resolutionNote)}
              </>
            )}
          </dl>
        </section>

        <h2 className="mt-8 text-sm font-semibold text-gray-900">
          접수된 이슈 · {issues.length}건
        </h2>
        {issues.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">없음</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {issues.map((i) => (
              <li key={i.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
                <p className="font-medium text-gray-900">
                  {ISSUE_LABEL[i.type] ?? i.type}
                  <span className="ml-2 text-xs text-gray-500">
                    {kst(i.createdAt)} · {i.status === "open" ? "열림" : "처리됨"}
                  </span>
                </p>
                {i.note && <p className="mt-1 whitespace-pre-wrap text-gray-700">{i.note}</p>}
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-8 text-sm font-semibold text-gray-900">상태 기록</h2>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">기록 없음</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                <th className="py-2 pr-4">시각</th>
                <th className="py-2 pr-4">누가</th>
                <th className="py-2 pr-4">항목</th>
                <th className="py-2">변경</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, n) => (
                <tr key={n} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-xs text-gray-600">{kst(e.at)}</td>
                  <td className="py-2 pr-4">{BY_LABEL[e.by] ?? e.by}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{e.field}</td>
                  <td className="py-2 font-mono text-xs">
                    {e.from ?? "-"} → {e.to ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {hold.status === "held" && (
          <section className="mt-8 rounded-lg border border-gray-200 bg-white px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">처리 완료로 바꾸기</h2>
            <p className="mt-1 text-xs text-gray-500">
              돈은 여기서 보내지지 않아요. 회사 계좌에서 작업자에게 직접 보내거나
              요청자에게 환불한 뒤 처리해 주세요. 이 건의 이슈도 함께 처리돼요.
            </p>
            <ResolveHoldForm id={hold.id} amount={hold.amount} />
          </section>
        )}
      </div>
    </div>
  );
}
