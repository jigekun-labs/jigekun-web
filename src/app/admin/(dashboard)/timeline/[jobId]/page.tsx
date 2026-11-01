import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
  BY_KO,
  FIELD_KO,
  ISSUE_KO,
  STATUS_KO,
  fetchJobTimeline,
  type TimelineEvent,
} from "@/lib/job-timeline";
import LoadError from "@/components/admin/LoadError";

function kst(iso: string | null, withDate = true): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    ...(withDate
      ? { month: "numeric", day: "numeric" }
      : {}),
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const ko = (v: string | null) => (v ? STATUS_KO[v] ?? v : "-");

const BY_STYLE: Record<string, string> = {
  worker: "bg-blue-50 text-blue-700",
  employer: "bg-purple-50 text-purple-700",
  system: "bg-gray-100 text-gray-600",
};

function Events({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-400">기록 없음</p>;
  }
  return (
    <table className="w-full text-sm">
      <tbody>
        {events.map((e, n) => (
          <tr key={n} className="border-b border-gray-100 last:border-0">
            <td className="w-36 py-1.5 pr-3 align-top text-xs tabular-nums text-gray-500">
              {kst(e.at)}
            </td>
            <td className="w-20 py-1.5 pr-3 align-top">
              <span className={`rounded px-1.5 py-0.5 text-xs ${BY_STYLE[e.by] ?? BY_STYLE.system}`}>
                {BY_KO[e.by] ?? e.by}
              </span>
            </td>
            <td className="w-24 py-1.5 pr-3 align-top text-xs text-gray-500">
              {FIELD_KO[e.field] ?? e.field}
            </td>
            <td className="py-1.5 align-top">
              <span className="text-gray-400">{ko(e.from)}</span>
              <span className="mx-1.5 text-gray-300">→</span>
              <span className="font-medium text-gray-900">{ko(e.to)}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * 상태 기록 — one job: its own status history, then each worker who took it
 * (their own taps, the employer's marks about them, issues, a held payment).
 * Linked from the jobListings / jobOffers rows and from 보류 정산.
 */
export default async function JobTimelinePage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  await requireAdmin();
  const { jobId } = await params;

  let t;
  try {
    t = await fetchJobTimeline(decodeURIComponent(jobId));
  } catch (e) {
    return <LoadError error={e} />;
  }
  if (!t) notFound();

  return (
    <div className="h-screen overflow-y-auto">
      <div className="mx-auto max-w-4xl px-8 py-6">
        <p className="text-xs text-gray-500">상태 기록</p>
        <h1 className="mt-1 text-lg font-bold text-gray-900">
          {t.requestNo ?? t.jobId} · {t.title}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {t.date ? new Date(t.date).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) : ""}{" "}
          {t.startTime ?? ""} · {t.duration}시간 · 요청자{" "}
          <Link className="underline" href={`/admin?q=${encodeURIComponent(t.companyId)}`}>
            {t.companyName ?? t.companyId}
          </Link>{" "}
          · 현재 <span className="font-medium">{ko(t.status)}</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          시작 {kst(t.startedAt)} · 완료 {kst(t.completedAt)}
          {t.completedBy ? ` (${BY_KO[t.completedBy] ?? t.completedBy})` : ""}
        </p>

        <section className="mt-6 rounded-lg border border-gray-200 bg-white px-5 py-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">작업</h2>
          <Events events={t.jobEvents} />
        </section>

        <h2 className="mt-8 text-sm font-semibold text-gray-900">
          작업자 · {t.workers.length}명
        </h2>
        {t.workers.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">이 작업을 맡은 작업자가 없어요.</p>
        )}
        {t.workers.map((w) => (
          <section key={w.offerId} className="mt-3 rounded-lg border border-gray-200 bg-white px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                className="font-semibold text-gray-900 hover:underline"
                href={`/admin?q=${encodeURIComponent(w.workerId)}`}
              >
                {w.name}
              </Link>
              {w.isPro && (
                <span className="rounded bg-gray-900 px-1.5 py-0.5 text-[11px] text-white">담당 프로</span>
              )}
              <span className="text-xs text-gray-500">
                작업자 상태 <span className="font-medium text-gray-900">{ko(w.status)}</span>
                {" · "}요청자 확인{" "}
                <span className="font-medium text-gray-900">{ko(w.employerStatus)}</span>
              </span>
              {w.hold && (
                <Link
                  href={`/admin/payoutHolds/${encodeURIComponent(w.hold.id)}`}
                  className="ml-auto rounded bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 hover:underline"
                >
                  보류 정산 {w.hold.amount.toLocaleString("ko-KR")}원 ·{" "}
                  {w.hold.status === "held" ? "처리 전" : "처리됨"} →
                </Link>
              )}
            </div>

            {w.issues.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {w.issues.map((i) => (
                  <li key={i.id} className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm">
                    <span className="font-medium text-red-800">
                      ⚠ 이슈 · {ISSUE_KO[i.type] ?? i.type}
                    </span>
                    <span className="ml-2 text-xs text-red-700">
                      {kst(i.at)} · {i.status === "open" ? "열림" : "처리됨"}
                    </span>
                    {i.note && <p className="mt-1 whitespace-pre-wrap text-red-900">{i.note}</p>}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3">
              <Events events={w.events} />
            </div>
          </section>
        ))}

        <p className="mt-6 text-xs text-gray-400">
          상태 기록은 앱 서버가 남겨요(배포 이후부터). 작업자·요청자·시스템 중 누가
          바꿨는지는 각 변경에 함께 기록돼요.
        </p>
      </div>
    </div>
  );
}
