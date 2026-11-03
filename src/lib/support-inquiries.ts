import "server-only";

import {
  FieldValue,
  Timestamp,
  type DocumentData,
} from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import {
  STATUSES,
  STATUS_LABEL,
  type InquiryStatus,
} from "./support-inquiries-shared";

export * from "./support-inquiries-shared";

/**
 * 고객 문의 — `supportInquiries`, written by the app's `sendSupportEmail`
 * Cloud Function (functions/src/support/sendSupportEmail.ts in the app repo)
 * before it emails the support inbox. Customer service works them here.
 */
export const INQUIRIES = "supportInquiries";

/** How many of the newest inquiries the "종료"/"전체" tabs reach back over. */
export const RECENT_LIMIT = 300;

export type StatusChange = {
  from: string;
  to: string;
  by: string;
  at: string | null;
};

export type Inquiry = {
  id: string;
  authUid: string | null;
  /** The user doc id; null when the app build had no matching user doc. */
  userId: string | null;
  name: string | null;
  role: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  title: string | null;
  message: string;
  status: InquiryStatus;
  emailSent: boolean;
  createdAt: string | null;
  statusLog: StatusChange[];
};

function iso(v: unknown): string | null {
  return v instanceof Timestamp ? v.toDate().toISOString() : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

function toInquiry(id: string, d: DocumentData): Inquiry {
  const status = STATUSES.includes(d.status) ? (d.status as InquiryStatus) : "open";
  const log = Array.isArray(d.statusLog) ? d.statusLog : [];
  return {
    id,
    authUid: str(d.authUid),
    userId: str(d.userId),
    name: str(d.name),
    role: str(d.role),
    phone: str(d.phone),
    email: str(d.email),
    category: str(d.category),
    title: str(d.title),
    message: typeof d.message === "string" ? d.message : "",
    status,
    emailSent: d.emailSent === true,
    createdAt: iso(d.createdAt),
    statusLog: log.map((e: Record<string, unknown>) => ({
      from: String(e.from ?? ""),
      to: String(e.to ?? ""),
      by: String(e.by ?? ""),
      at: iso(e.at),
    })),
  };
}

const newestFirst = (a: Inquiry, b: Inquiry) =>
  (b.createdAt ?? "").localeCompare(a.createdAt ?? "");

/**
 * Inquiries for one tab, newest first.
 *
 * "open" and "answered" fetch every match and sort here: those piles stay
 * small, and filtering on status while ordering by date would need a composite
 * index. "closed" and "all" read the newest RECENT_LIMIT and filter, since
 * closed only ever grows.
 */
export async function listInquiries(
  tab: InquiryStatus | "all"
): Promise<{ items: Inquiry[]; truncated: boolean }> {
  const col = adminDb().collection(INQUIRIES);

  if (tab === "open" || tab === "answered") {
    const snap = await col.where("status", "==", tab).get();
    return {
      items: snap.docs.map((d) => toInquiry(d.id, d.data())).sort(newestFirst),
      truncated: false,
    };
  }

  const snap = await col.orderBy("createdAt", "desc").limit(RECENT_LIMIT).get();
  const items = snap.docs.map((d) => toInquiry(d.id, d.data()));
  return {
    items: tab === "all" ? items : items.filter((i) => i.status === tab),
    truncated: snap.size === RECENT_LIMIT,
  };
}

export async function countByStatus(): Promise<Record<InquiryStatus, number>> {
  const col = adminDb().collection(INQUIRIES);
  const counts = await Promise.all(
    STATUSES.map(async (s) => {
      const snap = await col.where("status", "==", s).count().get();
      return [s, snap.data().count] as const;
    })
  );
  return Object.fromEntries(counts) as Record<InquiryStatus, number>;
}

export async function getInquiry(id: string): Promise<Inquiry | null> {
  const snap = await adminDb().collection(INQUIRIES).doc(id).get();
  return snap.exists ? toInquiry(snap.id, snap.data()!) : null;
}

/**
 * The same person's other inquiries, newest first — by user doc id when the
 * inquiry is linked to one, otherwise by the app session it came from.
 */
export async function otherInquiries(inquiry: Inquiry): Promise<Inquiry[]> {
  const [field, value] = inquiry.userId
    ? ["userId", inquiry.userId]
    : ["authUid", inquiry.authUid];
  if (!value) return [];

  const snap = await adminDb()
    .collection(INQUIRIES)
    .where(field, "==", value)
    .limit(50)
    .get();
  return snap.docs
    .filter((d) => d.id !== inquiry.id)
    .map((d) => toInquiry(d.id, d.data()))
    .sort(newestFirst);
}

/**
 * Moves an inquiry to `to`, recording who did it. Refuses a no-op so a stale
 * page can't log a change that didn't happen.
 */
export async function setInquiryStatus(
  id: string,
  to: InquiryStatus,
  by: string
): Promise<void> {
  const db = adminDb();
  const ref = db.collection(INQUIRIES).doc(id);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("문의를 찾을 수 없습니다.");
    const from = String(snap.get("status") ?? "open");
    if (from === to) throw new Error(`이미 '${STATUS_LABEL[to]}' 상태입니다.`);

    tx.update(ref, {
      status: to,
      statusUpdatedAt: FieldValue.serverTimestamp(),
      statusUpdatedBy: by,
      // serverTimestamp() isn't allowed inside an array element.
      statusLog: FieldValue.arrayUnion({ from, to, by, at: Timestamp.now() }),
    });
  });
}
