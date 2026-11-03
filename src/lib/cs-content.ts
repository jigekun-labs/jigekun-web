import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import { announcementStateOf, type AnnouncementState } from "./collection-schemas";

/**
 * Announcements and FAQs as the customer-service desk lists them. Both are
 * small, admin-authored collections, so they are read whole.
 */

export type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  isImportant: boolean;
  isMarketing: boolean;
  status: AnnouncementState;
  createdAt: string | null;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  order: number | null;
  isActive: boolean;
  /**
   * What the app actually shows: its query is `isActive == true` ordered by
   * `order`, so a FAQ missing either never appears there.
   */
  visibleInApp: boolean;
};

function iso(v: unknown): string | null {
  return v instanceof Timestamp ? v.toDate().toISOString() : null;
}

export async function listAnnouncements(): Promise<AnnouncementItem[]> {
  const snap = await adminDb().collection("announcements").get();
  return snap.docs
    .map((d) => ({
      id: d.id,
      title: String(d.get("title") ?? "") || d.id,
      // `content` is the plain-text copy written next to the block body.
      content: String(d.get("content") ?? ""),
      isImportant: d.get("isImportant") === true,
      isMarketing: d.get("isMarketing") === true,
      status: announcementStateOf(d.get("isActive"), d.get("notified")),
      createdAt: iso(d.get("createdAt")),
    }))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

/** In the app's order; FAQs without an `order` go last. */
export async function listFaqs(): Promise<FaqItem[]> {
  const snap = await adminDb().collection("faqs").get();
  return snap.docs
    .map((d) => {
      const raw = d.get("order");
      const order = typeof raw === "number" ? raw : null;
      const isActive = d.get("isActive") === true;
      return {
        id: d.id,
        question: String(d.get("question") ?? ""),
        answer: String(d.get("answer") ?? ""),
        order,
        isActive,
        visibleInApp: isActive && order !== null,
      };
    })
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
}
