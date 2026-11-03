import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";

/**
 * 보류 정산 — the app's `payoutHolds` collection (functions/src/jobflow/
 * payoutHolds.ts in the app repo). One doc per held worker wage:
 * `{jobId}_{employerId}_{workerId}`. The wage itself was paid to the company
 * account; customer service checks what happened (issues + status history),
 * settles the money by hand, then closes the hold here.
 */
export const HOLDS = "payoutHolds";

export type HoldStatus = "held" | "paid_worker" | "refunded_employer";

export const REASON_LABEL: Record<string, string> = {
  absent: "안 왔어요 (요청자 표시)",
  issue: "이슈 접수",
  not_ended: "요청자 미종료 (7일)",
};

export const STATUS_LABEL: Record<HoldStatus, string> = {
  held: "처리 전",
  paid_worker: "작업자에게 지급",
  refunded_employer: "요청자에게 환불",
};

export const ISSUE_LABEL: Record<string, string> = {
  left_mid_job: "작업 중 이탈",
  other: "기타",
};

export type Hold = {
  id: string;
  jobId: string;
  requestNo: string | null;
  jobTitle: string | null;
  jobDate: string | null;
  companyId: string;
  workerId: string;
  workerName: string | null;
  offerId: string;
  reason: string;
  issueIds: string[];
  workerCheckedIn: boolean;
  amount: number;
  grossAmount: number;
  ledgerId: string;
  status: HoldStatus;
  sentToCompanyAt: string | null;
  resolutionNote: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string | null;
};

export type HoldIssue = {
  id: string;
  type: string;
  note: string;
  status: string;
  createdAt: string | null;
};

export type StatusEvent = {
  field: string;
  from: string | null;
  to: string | null;
  by: string;
  at: string | null;
};

function iso(v: unknown): string | null {
  return v instanceof Timestamp ? v.toDate().toISOString() : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function toHold(id: string, d: FirebaseFirestore.DocumentData): Hold {
  return {
    id,
    jobId: String(d.jobId ?? ""),
    requestNo: str(d.requestNo),
    jobTitle: str(d.jobTitle),
    jobDate: iso(d.jobDate),
    companyId: String(d.companyId ?? ""),
    workerId: String(d.workerId ?? ""),
    workerName: str(d.workerName),
    offerId: String(d.offerId ?? ""),
    reason: String(d.reason ?? ""),
    issueIds: Array.isArray(d.issueIds) ? d.issueIds.map(String) : [],
    workerCheckedIn: d.workerCheckedIn === true,
    amount: Number(d.amount) || 0,
    grossAmount: Number(d.grossAmount) || 0,
    ledgerId: String(d.ledgerId ?? ""),
    status: (d.status as HoldStatus) ?? "held",
    sentToCompanyAt: iso(d.sentToCompanyAt),
    resolutionNote: str(d.resolutionNote),
    resolvedBy: str(d.resolvedBy),
    resolvedAt: iso(d.resolvedAt),
    createdAt: iso(d.createdAt),
  };
}

/** Holds, newest first; `open` = only those not yet settled. */
export async function listHolds(open: boolean): Promise<Hold[]> {
  let q: FirebaseFirestore.Query = adminDb().collection(HOLDS);
  if (open) q = q.where("status", "==", "held");
  const snap = await q.get();
  return snap.docs
    .map((d) => toHold(d.id, d.data()))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

/** How many holds are still waiting to be settled. */
export async function countHeld(): Promise<number> {
  const snap = await adminDb()
    .collection(HOLDS)
    .where("status", "==", "held")
    .count()
    .get();
  return snap.data().count;
}

/** Holds where this user is the worker or the requester, newest first. */
export async function holdsForUser(userId: string): Promise<Hold[]> {
  const col = adminDb().collection(HOLDS);
  const [asWorker, asRequester] = await Promise.all([
    col.where("workerId", "==", userId).get(),
    col.where("companyId", "==", userId).get(),
  ]);
  const byId = new Map<string, Hold>();
  for (const d of [...asWorker.docs, ...asRequester.docs]) {
    byId.set(d.id, toHold(d.id, d.data()));
  }
  return [...byId.values()].sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
  );
}

/** One hold with its issues and the worker's status history on that job. */
export async function fetchHold(id: string): Promise<{
  hold: Hold;
  issues: HoldIssue[];
  events: StatusEvent[];
} | null> {
  const db = adminDb();
  const snap = await db.collection(HOLDS).doc(id).get();
  if (!snap.exists) return null;
  const hold = toHold(snap.id, snap.data()!);

  const [issues, events] = await Promise.all([
    db.collection("jobIssues").where("offerId", "==", hold.offerId).get(),
    db.collection("statusEvents").where("offerId", "==", hold.offerId).get(),
  ]);
  return {
    hold,
    issues: issues.docs
      .map((d) => ({
        id: d.id,
        type: String(d.get("type") ?? ""),
        note: String(d.get("note") ?? ""),
        status: String(d.get("status") ?? ""),
        createdAt: iso(d.get("createdAt")),
      }))
      .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? "")),
    events: events.docs
      .map((d) => ({
        field: String(d.get("field") ?? ""),
        from: str(d.get("from")),
        to: str(d.get("to")),
        by: String(d.get("by") ?? "system"),
        at: iso(d.get("at")),
      }))
      .sort((a, b) => (a.at ?? "").localeCompare(b.at ?? "")),
  };
}

/**
 * Close a hold once the money is settled by hand. Only a `held` hold can be
 * closed (no double resolution); its open issues are resolved with it, and
 * the worker's offer gets its final state — completed when paid, no_show when
 * the employer was refunded — so the app stops showing "운영팀 확인 중".
 */
export async function resolveHold(
  id: string,
  outcome: Exclude<HoldStatus, "held">,
  note: string,
  admin: string
): Promise<void> {
  const db = adminDb();
  const ref = db.collection(HOLDS).doc(id);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("보류 건을 찾을 수 없습니다.");
    if (snap.get("status") !== "held") {
      throw new Error("이미 처리된 보류 건입니다.");
    }
    const offerId = String(snap.get("offerId") ?? "");
    const issueIds: string[] = snap.get("issueIds") ?? [];
    const issueRefs = issueIds.map((i) => db.collection("jobIssues").doc(i));
    const issues = await Promise.all(issueRefs.map((r) => tx.get(r)));

    const now = FieldValue.serverTimestamp();
    tx.update(ref, {
      status: outcome,
      resolutionNote: note || null,
      resolvedBy: admin,
      resolvedAt: now,
    });
    issues.forEach((s, i) => {
      if (s.exists && s.get("status") === "open") {
        tx.update(issueRefs[i], {
          status: "resolved",
          resolvedBy: admin,
          resolvedAt: now,
        });
      }
    });
    if (offerId) {
      tx.update(db.collection("jobOffers").doc(offerId), {
        status: outcome === "paid_worker" ? "completed" : "no_show",
        holdResolution: outcome,
        // Logged by the app's status history as a system change.
        changedBy: "system",
        changedAt: now,
      });
    }
  });
}

export type ResolveState = { ok?: string; error?: string };

/**
 * The resolve form's work, shared by /admin and /cs. Not a server action:
 * each area's action checks its own session and passes who is signed in.
 */
export async function resolveHoldFromForm(
  formData: FormData,
  by: string
): Promise<ResolveState & { id?: string }> {
  const id = String(formData.get("id") ?? "");
  const outcome = String(formData.get("outcome") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  if (!id) return { error: "보류 건을 지정해주세요." };
  if (outcome !== "paid_worker" && outcome !== "refunded_employer") {
    return { error: "처리 결과를 선택해주세요." };
  }

  try {
    await resolveHold(id, outcome, note, by);
    return {
      id,
      ok:
        outcome === "paid_worker"
          ? "작업자에게 지급한 것으로 처리했습니다."
          : "요청자에게 환불한 것으로 처리했습니다.",
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "처리에 실패했습니다." };
  }
}
