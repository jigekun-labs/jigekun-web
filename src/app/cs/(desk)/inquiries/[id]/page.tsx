import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCs } from "@/lib/cs-auth";
import {
  getInquiry,
  otherInquiries,
  ROLE_LABEL,
  STATUS_LABEL,
  type InquiryStatus,
} from "@/lib/support-inquiries";
import { CS_LINKS } from "@/lib/desk-links";
import LoadError from "@/components/admin/LoadError";
import InquiryStatusForm from "@/components/cs/InquiryStatusForm";
import { kst, StatusBadge } from "@/components/cs/inquiry-bits";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-1.5 text-sm">
      <dt className="w-20 shrink-0 text-gray-500">{label}</dt>
      <dd className="min-w-0 break-words text-gray-900">{children}</dd>
    </div>
  );
}

export default async function InquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCs();
  const { id } = await params;

  let inquiry, others;
  try {
    inquiry = await getInquiry(decodeURIComponent(id));
    others = inquiry ? await otherInquiries(inquiry) : [];
  } catch (e) {
    return <LoadError error={e} />;
  }
  if (!inquiry) notFound();

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b border-gray-200 bg-white px-8 py-5">
        <Link href="/cs/inquiries" className="text-xs text-gray-500 hover:text-gray-900">
          ← 고객 문의
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900">
            {inquiry.title ?? "(제목 없음)"}
          </h1>
          <StatusBadge status={inquiry.status} />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {inquiry.category ?? "분류 없음"} · {kst(inquiry.createdAt)}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-900">문의 내용</h2>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">
                {inquiry.message}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-900">상태</h2>
              <InquiryStatusForm id={inquiry.id} status={inquiry.status} />
              {inquiry.statusLog.length > 0 && (
                <ul className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  {[...inquiry.statusLog].reverse().map((e, i) => (
                    <li key={i}>
                      {kst(e.at)} · {e.by} ·{" "}
                      {STATUS_LABEL[e.from as InquiryStatus] ?? e.from} →{" "}
                      {STATUS_LABEL[e.to as InquiryStatus] ?? e.to}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-900">보낸 사람</h2>
              <dl className="mt-2">
                <Row label="이름">
                  {inquiry.name ?? "이름 없음"}
                  {inquiry.role && (
                    <span className="ml-1 text-gray-500">
                      ({ROLE_LABEL[inquiry.role] ?? inquiry.role})
                    </span>
                  )}
                </Row>
                <Row label="이메일">
                  {inquiry.email ? (
                    <a href={`mailto:${inquiry.email}`} className="underline">
                      {inquiry.email}
                    </a>
                  ) : (
                    "-"
                  )}
                </Row>
                <Row label="전화">
                  {inquiry.phone ? (
                    <a href={`tel:${inquiry.phone}`} className="underline">
                      {inquiry.phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </Row>
                <Row label="사용자 ID">
                  {inquiry.userId ? (
                    <Link
                      href={CS_LINKS.user(inquiry.userId)}
                      className="font-mono text-xs underline"
                    >
                      {inquiry.userId}
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-500">
                      계정과 연결되지 않음 (이전 버전 앱)
                    </span>
                  )}
                </Row>
              </dl>
              {!inquiry.emailSent && (
                <p className="mt-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                  알림 메일 발송에 실패한 문의예요. 메일함에는 없을 수 있어요.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-900">
                이 사용자의 다른 문의
              </h2>
              {others.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">없어요.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {others.map((o) => (
                    <li key={o.id} className="text-sm">
                      <Link
                        href={`/cs/inquiries/${encodeURIComponent(o.id)}`}
                        className="text-gray-900 hover:underline"
                      >
                        {o.title ?? "(제목 없음)"}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                        <StatusBadge status={o.status} />
                        {kst(o.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
