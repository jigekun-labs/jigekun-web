import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";

/**
 * One job's status history (the app's `statusEvents`, functions/src/jobflow/
 * statusLog.ts): the job's own status changes, and for every worker who took
 * it, their own status, what the employer said about them, issues filed and
 * whether their pay is held — for answering "what actually happened?" on any
 * job, not only held ones.
 */

/** Stored status values → how CS reads them. */
export const STATUS_KO: Record<string, string> = {
  // job
  payment_on_hold: "결제 대기",
  matching: "매칭 중",
  no_workers_nearby: "주변 작업자 없음",
  matched: "매칭 완료",
  paid: "결제 완료",
  on_the_way: "이동 중",
  ready_to_start: "전원 도착",
  active: "작업 중",
  completed: "완료",
  cancelled: "취소",
  // worker (offer)
  pending: "제안 받음",
  accepted: "수락",
  arrived: "도착",
  worker_completed: "종료 알림",
  declined: "거절",
  expired: "마감",
  on_hold: "정산 보류",
  no_show: "노쇼",
  // employer's view of a worker
  arriving_soon: "곧 도착 예정",
  unreachable: "연락이 안 됨",
  absent: "안 왔어요",
};

export const FIELD_KO: Record<string, string> = {
  jobStatus: "작업",
  status: "작업자 상태",
  employerStatus: "요청자 확인",
};

export const BY_KO: Record<string, string> = {
  worker: "작업자",
  employer: "요청자",
  system: "시스템",
};

export const ISSUE_KO: Record<string, string> = {
  left_mid_job: "작업 중 이탈",
  other: "기타",
};

export type TimelineEvent = {
  field: string;
  from: string | null;
  to: string | null;
  by: string;
  at: string | null;
};

export type TimelineWorker = {
  offerId: string;
  workerId: string;
  name: string;
  isPro: boolean;
  status: string;
  employerStatus: string | null;
  events: TimelineEvent[];
  issues: { id: string; type: string; note: string; status: string; at: string | null }[];
  hold: { id: string; status: string; amount: number } | null;
};

export type JobTimeline = {
  jobId: string;
  requestNo: string | null;
  title: string;
  status: string;
  date: string | null;
  startTime: string | null;
  duration: number;
  companyId: string;
  companyName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  completedBy: string | null;
  jobEvents: TimelineEvent[];
  workers: TimelineWorker[];
};

function iso(v: unknown): string | null {
  return v instanceof Timestamp ? v.toDate().toISOString() : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

/** Offers that never got as far as the job (offered, then passed on). */
const NEVER_TOOK = new Set(["pending", "declined", "expired"]);

export async function fetchJobTimeline(jobId: string): Promise<JobTimeline | null> {
  const db = adminDb();
  const jobSnap = await db.collection("jobListings").doc(jobId).get();
  if (!jobSnap.exists) return null;
  const job = jobSnap.data()!;

  const [offers, events, issues, holds, company] = await Promise.all([
    db.collection("jobOffers").where("jobListingId", "==", jobId).get(),
    db.collection("statusEvents").where("jobId", "==", jobId).get(),
    db.collection("jobIssues").where("jobId", "==", jobId).get(),
    db.collection("payoutHolds").where("jobId", "==", jobId).get(),
    db.collection("users").doc(String(job.companyId ?? "_")).get(),
  ]);

  const toEvent = (d: FirebaseFirestore.DocumentData): TimelineEvent => ({
    field: String(d.field ?? ""),
    from: str(d.from),
    to: str(d.to),
    by: String(d.by ?? "system"),
    at: iso(d.at),
  });
  const byTime = (a: { at: string | null }, b: { at: string | null }) =>
    (a.at ?? "").localeCompare(b.at ?? "");

  const allEvents = events.docs.map((d) => ({ offerId: d.get("offerId") as string | undefined, e: toEvent(d.data()) }));
  const withEvents = new Set(allEvents.map((x) => x.offerId).filter(Boolean));

  const taken = offers.docs.filter(
    (o) => !NEVER_TOOK.has(String(o.get("status"))) || withEvents.has(o.id)
  );
  const names = new Map<string, string>();
  await Promise.all(
    [...new Set(taken.map((o) => String(o.get("workerId"))))].map(async (uid) => {
      const u = await db.collection("users").doc(uid).get();
      names.set(uid, (u.get("profile.name") as string) || uid);
    })
  );

  const workers: TimelineWorker[] = taken
    .map((o) => {
      const d = o.data();
      const workerId = String(d.workerId ?? "");
      const hold = holds.docs.find((h) => h.get("offerId") === o.id);
      return {
        offerId: o.id,
        workerId,
        name: names.get(workerId) ?? workerId,
        isPro: d.isPro === true && job.proEnabled === true,
        status: String(d.status ?? ""),
        employerStatus: str(d.employerStatus),
        events: allEvents
          .filter((x) => x.offerId === o.id)
          .map((x) => x.e)
          .sort(byTime),
        issues: issues.docs
          .filter((i) => i.get("offerId") === o.id)
          .map((i) => ({
            id: i.id,
            type: String(i.get("type") ?? ""),
            note: String(i.get("note") ?? ""),
            status: String(i.get("status") ?? ""),
            at: iso(i.get("createdAt")),
          }))
          .sort(byTime),
        hold: hold
          ? {
              id: hold.id,
              status: String(hold.get("status") ?? ""),
              amount: Number(hold.get("amount")) || 0,
            }
          : null,
      };
    })
    .sort((a, b) => (a.events[0]?.at ?? "~").localeCompare(b.events[0]?.at ?? "~"));

  return {
    jobId,
    requestNo: str(job.requestNo),
    title: String(job.title ?? jobId),
    status: String(job.status ?? ""),
    date: iso(job.date),
    startTime: str(job.startTime),
    duration: Number(job.duration) || 0,
    companyId: String(job.companyId ?? ""),
    companyName: (company.get("profile.name") as string) ?? null,
    startedAt: iso(job.startedAt),
    completedAt: iso(job.completedAt),
    completedBy: str(job.completedBy),
    jobEvents: allEvents
      .filter((x) => x.e.field === "jobStatus")
      .map((x) => x.e)
      .sort(byTime),
    workers,
  };
}
