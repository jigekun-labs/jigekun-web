import "server-only";

import { Timestamp, type DocumentData } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import { holdsForUser, type Hold } from "./payout-holds";
import { inquiriesForUser, type Inquiry } from "./support-inquiries";

/**
 * 사용자 조회 for the customer-service desk: find a person, then everything
 * about them on one page.
 *
 * Deliberately leaves out birthdate, address and location — CS has no use for
 * them. Bank details stay: settling a held wage means paying it by hand.
 */

export const PROVIDER_LABEL: Record<string, string> = {
  kakao: "카카오",
  naver: "네이버",
  apple: "Apple",
  email: "이메일",
};

export const PENALTY_LABEL: Record<string, string> = {
  cancellation: "취소",
  no_show: "노쇼",
  late_arrival: "지각",
};

export type UserHit = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  roles: string[];
};

export type UserOverview = UserHit & {
  activeRole: string | null;
  authProvider: string | null;
  isPro: boolean;
  createdAt: string | null;
  bank: { name: string | null; account: string | null; verified: boolean };
  reliability: {
    score: number | null;
    penaltyLevel: number | null;
    blockedUntil: string | null;
    avgRating: number | null;
    totalReviews: number | null;
    totalCompletedJobs: number | null;
    totalNoShows: number | null;
    totalLateArrivals: number | null;
    totalCancellations: number | null;
  };
  inquiries: Inquiry[];
  holds: Hold[];
  requested: { id: string; title: string; requestNo: string | null; date: string | null; status: string }[];
  worked: { offerId: string; jobId: string; title: string; status: string; at: string | null }[];
  reviews: { id: string; rating: number | null; comment: string; type: string; at: string | null }[];
  penalties: { id: string; type: string; points: number | null; level: number | null; jobId: string | null; at: string | null }[];
};

/** How many of each list the person page shows. */
const RECENT = 10;

function iso(v: unknown): string | null {
  return v instanceof Timestamp ? v.toDate().toISOString() : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
const newest = <T extends { at: string | null }>(a: T, b: T) =>
  (b.at ?? "").localeCompare(a.at ?? "");

function toHit(id: string, d: DocumentData): UserHit {
  const profile = (d.profile ?? {}) as Record<string, unknown>;
  return {
    id,
    name: str(profile.name) ?? str(d.name),
    phone: str(profile.phone) ?? str(d.phone),
    email: str(d.email),
    roles: Array.isArray(d.roles) ? d.roles.map(String) : [],
  };
}

/** 010-1234-5678 ↔ 01012345678: phones are stored either way. */
function phoneVariants(q: string): string[] {
  const digits = q.replace(/\D/g, "");
  if (digits.length < 9) return [];
  const out = new Set([q, digits]);
  if (digits.length === 11) {
    out.add(`${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`);
  } else if (digits.length === 10) {
    out.add(`${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`);
  }
  return [...out];
}

/**
 * Exact matches on the things CS gets told: a user id, an email, a phone
 * number (with or without dashes) or a full name. Firestore can't do partial
 * text search, and exact queries need no extra index.
 */
export async function searchUsers(raw: string): Promise<UserHit[]> {
  const q = raw.trim();
  if (!q) return [];
  const users = adminDb().collection("users");

  const queries: Promise<FirebaseFirestore.QuerySnapshot | null>[] = [];
  const byField = (field: string, value: string) =>
    queries.push(users.where(field, "==", value).limit(20).get());

  if (q.includes("@")) {
    byField("email", q);
    if (q.toLowerCase() !== q) byField("email", q.toLowerCase());
  }
  for (const p of phoneVariants(q)) byField("profile.phone", p);
  byField("profile.name", q);

  const [byId, ...rest] = await Promise.all([
    // A doc id can't contain "/" — asking for one would throw.
    q.includes("/") ? Promise.resolve(null) : users.doc(q).get(),
    ...queries,
  ]);

  const hits = new Map<string, UserHit>();
  if (byId?.exists) hits.set(byId.id, toHit(byId.id, byId.data()!));
  for (const snap of rest) {
    snap?.docs.forEach((d) => hits.set(d.id, toHit(d.id, d.data())));
  }
  return [...hits.values()];
}

export async function fetchUserOverview(id: string): Promise<UserOverview | null> {
  if (!id || id.includes("/")) return null;
  const db = adminDb();
  const snap = await db.collection("users").doc(id).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  const profile = (d.profile ?? {}) as Record<string, unknown>;
  const rel = (profile.reliability ?? {}) as Record<string, unknown>;

  const [inquiries, holds, listings, offers, reviews, penalties] = await Promise.all([
    inquiriesForUser(id),
    holdsForUser(id),
    db.collection("jobListings").where("companyId", "==", id).get(),
    db.collection("jobOffers").where("workerId", "==", id).get(),
    db.collection("reviews").where("targetId", "==", id).get(),
    db.collection("penaltyEvents").where("userId", "==", id).get(),
  ]);

  return {
    ...toHit(id, d),
    activeRole: str(d.activeRole),
    authProvider: str(d.authProvider),
    isPro: d.isPro === true,
    createdAt: iso(d.createdAt),
    bank: {
      name: str(profile.bankName),
      account: str(profile.bankAccount),
      verified: profile.bankVerified === true,
    },
    reliability: {
      score: num(rel.score),
      penaltyLevel: num(rel.penaltyLevel),
      blockedUntil: iso(rel.blockedUntil),
      avgRating: num(rel.avgRating),
      totalReviews: num(rel.totalReviews),
      totalCompletedJobs: num(rel.totalCompletedJobs),
      totalNoShows: num(rel.totalNoShows),
      totalLateArrivals: num(rel.totalLateArrivals),
      totalCancellations: num(rel.totalCancellations),
    },
    inquiries,
    holds,
    requested: listings.docs
      .map((j) => ({
        id: j.id,
        title: String(j.get("title") ?? j.id),
        requestNo: str(j.get("requestNo")),
        date: iso(j.get("date")),
        status: String(j.get("status") ?? ""),
        at: iso(j.get("date")) ?? iso(j.get("createdAt")),
      }))
      .sort(newest)
      .slice(0, RECENT),
    // Offers they only ever saw (offered, declined, lapsed) aren't their work.
    worked: offers.docs
      .filter((o) => !["pending", "declined", "expired"].includes(String(o.get("status"))))
      .map((o) => ({
        offerId: o.id,
        jobId: String(o.get("jobListingId") ?? ""),
        title: String(o.get("jobTitle") ?? o.get("jobListingId") ?? ""),
        status: String(o.get("status") ?? ""),
        at: iso(o.get("offeredAt")),
      }))
      .sort(newest)
      .slice(0, RECENT),
    reviews: reviews.docs
      .map((r) => ({
        id: r.id,
        rating: num(r.get("rating")),
        comment: String(r.get("comment") ?? ""),
        type: String(r.get("type") ?? ""),
        at: iso(r.get("createdAt")),
      }))
      .sort(newest)
      .slice(0, RECENT),
    penalties: penalties.docs
      .map((p) => ({
        id: p.id,
        type: String(p.get("eventType") ?? ""),
        points: num(p.get("penaltyPoints")),
        level: num(p.get("newLevel")),
        jobId: str(p.get("jobListingId")),
        at: iso(p.get("createdAt")),
      }))
      .sort(newest)
      .slice(0, RECENT),
  };
}
