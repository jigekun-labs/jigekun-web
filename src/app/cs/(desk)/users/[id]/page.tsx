import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCs } from "@/lib/cs-auth";
import {
  fetchUserOverview,
  PENALTY_LABEL,
  PROVIDER_LABEL,
} from "@/lib/user-lookup";
import { ROLE_LABEL } from "@/lib/support-inquiries-shared";
import { STATUS_LABEL as HOLD_STATUS, REASON_LABEL } from "@/lib/payout-holds";
import { STATUS_KO } from "@/lib/job-timeline";
import { CS_LINKS } from "@/lib/desk-links";
import LoadError from "@/components/admin/LoadError";
import { kst, StatusBadge } from "@/components/cs/inquiry-bits";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-1.5 text-sm">
      <dt className="w-24 shrink-0 text-gray-500">{label}</dt>
      <dd className="min-w-0 break-words text-gray-900">{children}</dd>
    </div>
  );
}

function Card({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-900">
        {title}
        {count !== undefined && (
          <span className="ml-1 font-normal tabular-nums text-gray-400">{count}</span>
        )}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

const None = () => <p className="text-sm text-gray-400">없어요.</p>;
const n = (v: number | null, unit = "") => (v === null ? "-" : `${v.toLocaleString("ko-KR")}${unit}`);
const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) : "-";

/** One person, everything CS needs about them on one page. */
export default async function CsUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCs();
  const { id } = await params;

  let u;
  try {
    u = await fetchUserOverview(decodeURIComponent(id));
  } catch (e) {
    return <LoadError error={e} />;
  }
  if (!u) notFound();

  const r = u.reliability;
  const blocked = r.blockedUntil && r.blockedUntil > new Date().toISOString();

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b border-gray-200 bg-white px-8 py-5">
        <Link href="/cs/users" className="text-xs text-gray-500 hover:text-gray-900">
          ← 사용자 조회
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900">{u.name ?? "이름 없음"}</h1>
          {u.roles.map((role) => (
            <span key={role} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
              {ROLE_LABEL[role] ?? role}
            </span>
          ))}
          {u.isPro && (
            <span className="rounded bg-gray-900 px-1.5 py-0.5 text-xs text-white">프로</span>
          )}
          {blocked && (
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700">
              이용 제한 중 · {kst(r.blockedUntil)}까지
            </span>
          )}
        </div>
        <p className="mt-1 font-mono text-xs text-gray-400">{u.id}</p>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-6">
            <Card title="고객 문의" count={u.inquiries.length}>
              {u.inquiries.length === 0 ? (
                <None />
              ) : (
                <ul className="space-y-2">
                  {u.inquiries.map((q) => (
                    <li key={q.id} className="flex items-center gap-2 text-sm">
                      <StatusBadge status={q.status} />
                      <Link href={`/cs/inquiries/${encodeURIComponent(q.id)}`} className="truncate text-gray-900 hover:underline">
                        {q.title ?? "(제목 없음)"}
                      </Link>
                      <span className="ml-auto shrink-0 text-xs text-gray-500">{kst(q.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="보류 정산" count={u.holds.length}>
              {u.holds.length === 0 ? (
                <None />
              ) : (
                <ul className="space-y-2">
                  {u.holds.map((h) => (
                    <li key={h.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${
                          h.status === "held" ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"
                        }`}
                      >
                        {HOLD_STATUS[h.status]}
                      </span>
                      <Link href={CS_LINKS.hold(h.id)} className="text-gray-900 hover:underline">
                        {h.requestNo ?? h.jobId} · {h.jobTitle ?? ""}
                      </Link>
                      <span className="text-xs text-gray-500">
                        {h.workerId === u.id ? "작업자로" : "요청자로"} · {REASON_LABEL[h.reason] ?? h.reason}
                      </span>
                      <span className="ml-auto text-xs tabular-nums text-gray-700">
                        {h.amount.toLocaleString("ko-KR")}원
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {u.roles.includes("employer") && (
              <Card title="최근 요청한 작업" count={u.requested.length}>
                {u.requested.length === 0 ? (
                  <None />
                ) : (
                  <ul className="space-y-2">
                    {u.requested.map((j) => (
                      <li key={j.id} className="flex items-center gap-2 text-sm">
                        <span className="w-24 shrink-0 text-xs text-gray-500">{day(j.date)}</span>
                        <Link href={CS_LINKS.timeline(j.id)} className="truncate text-gray-900 hover:underline">
                          {j.requestNo ? `${j.requestNo} · ` : ""}
                          {j.title}
                        </Link>
                        <span className="ml-auto shrink-0 text-xs text-gray-500">
                          {STATUS_KO[j.status] ?? j.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {u.roles.includes("employee") && (
              <Card title="최근 일한 작업" count={u.worked.length}>
                {u.worked.length === 0 ? (
                  <None />
                ) : (
                  <ul className="space-y-2">
                    {u.worked.map((w) => (
                      <li key={w.offerId} className="flex items-center gap-2 text-sm">
                        <span className="w-24 shrink-0 text-xs text-gray-500">{day(w.at)}</span>
                        <Link href={CS_LINKS.timeline(w.jobId)} className="truncate text-gray-900 hover:underline">
                          {w.title}
                        </Link>
                        <span className="ml-auto shrink-0 text-xs text-gray-500">
                          {STATUS_KO[w.status] ?? w.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            <Card title="받은 후기" count={u.reviews.length}>
              {u.reviews.length === 0 ? (
                <None />
              ) : (
                <ul className="space-y-3">
                  {u.reviews.map((rv) => (
                    <li key={rv.id} className="text-sm">
                      <span className="font-medium text-gray-900">
                        {"★".repeat(Math.round(rv.rating ?? 0))}
                        <span className="text-gray-300">{"★".repeat(5 - Math.round(rv.rating ?? 0))}</span>
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {rv.type === "employer_to_worker" ? "요청자가 남김" : "작업자가 남김"} · {day(rv.at)}
                      </span>
                      {rv.comment && <p className="mt-0.5 whitespace-pre-wrap text-gray-700">{rv.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="패널티 기록" count={u.penalties.length}>
              {u.penalties.length === 0 ? (
                <None />
              ) : (
                <ul className="space-y-2">
                  {u.penalties.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 text-sm">
                      <span className="w-24 shrink-0 text-xs text-gray-500">{day(p.at)}</span>
                      <span className="text-gray-900">{PENALTY_LABEL[p.type] ?? p.type}</span>
                      <span className="text-xs text-gray-500">
                        +{n(p.points)}점 · 레벨 {n(p.level)}
                      </span>
                      {p.jobId && (
                        <Link href={CS_LINKS.timeline(p.jobId)} className="ml-auto text-xs text-gray-500 hover:underline">
                          작업 기록 →
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <aside className="space-y-6">
            <Card title="기본 정보">
              <dl>
                <Row label="전화">
                  {u.phone ? <a href={`tel:${u.phone}`} className="underline">{u.phone}</a> : "-"}
                </Row>
                <Row label="이메일">
                  {u.email ? <a href={`mailto:${u.email}`} className="underline">{u.email}</a> : "-"}
                </Row>
                <Row label="로그인">{u.authProvider ? PROVIDER_LABEL[u.authProvider] ?? u.authProvider : "-"}</Row>
                <Row label="현재 모드">{u.activeRole ? ROLE_LABEL[u.activeRole] ?? u.activeRole : "-"}</Row>
                <Row label="가입일">{day(u.createdAt)}</Row>
              </dl>
            </Card>

            <Card title="정산 계좌">
              <dl>
                <Row label="은행">{u.bank.name ?? "-"}</Row>
                <Row label="계좌번호">
                  <span className="font-mono">{u.bank.account ?? "-"}</span>
                </Row>
                <Row label="실명 확인">{u.bank.verified ? "확인됨" : "확인 전"}</Row>
              </dl>
              <p className="mt-2 text-xs text-gray-400">보류 정산을 직접 지급할 때만 사용해 주세요.</p>
            </Card>

            <Card title="신뢰도">
              <dl>
                <Row label="점수">{n(r.score)}</Row>
                <Row label="패널티 레벨">{n(r.penaltyLevel)}</Row>
                <Row label="평균 평점">
                  {r.avgRating === null ? "-" : `${r.avgRating.toFixed(1)} (${n(r.totalReviews)}개)`}
                </Row>
                <Row label="완료">{n(r.totalCompletedJobs, "건")}</Row>
                <Row label="노쇼">{n(r.totalNoShows, "건")}</Row>
                <Row label="지각">{n(r.totalLateArrivals, "건")}</Row>
                <Row label="취소">{n(r.totalCancellations, "건")}</Row>
              </dl>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
