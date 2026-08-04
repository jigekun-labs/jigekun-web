import "server-only";

import {
  DocumentReference,
  FieldPath,
  FieldValue,
  GeoPoint,
  Timestamp,
} from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import { jsonReplacer } from "./firestore-view";
import type { FieldType } from "./field-types";

/** Firestore caps a batch at 500 writes; leave headroom. */
const BATCH_SIZE = 400;

/**
 * Ceiling on a collection-wide backfill. Above this the write would very likely
 * outlive the serverless request budget and land half-applied, so it is refused
 * with an explanation rather than started.
 */
export const MAX_BACKFILL = 5000;

export type ParsedValue =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

/** Turns the form's string input into the Firestore value for `type`. */
export function parseFieldValue(type: FieldType, raw: string): ParsedValue {
  const text = raw.trim();

  switch (type) {
    case "null":
      return { ok: true, value: null };

    case "string":
      // Not trimmed: an admin may genuinely want trailing whitespace, and an
      // empty string is a legitimate default for a text column.
      return { ok: true, value: raw };

    case "number": {
      if (!text) return { ok: false, error: "숫자를 입력해주세요." };
      const n = Number(text);
      if (!Number.isFinite(n)) {
        return { ok: false, error: `숫자로 읽을 수 없습니다: ${text}` };
      }
      return { ok: true, value: n };
    }

    case "boolean":
      if (text === "true") return { ok: true, value: true };
      if (text === "false") return { ok: true, value: false };
      return { ok: false, error: "true 또는 false를 선택해주세요." };

    case "timestamp": {
      if (!text) return { ok: false, error: "날짜와 시간을 입력해주세요." };
      const date = new Date(text);
      if (Number.isNaN(date.getTime())) {
        return { ok: false, error: `날짜로 읽을 수 없습니다: ${text}` };
      }
      return { ok: true, value: Timestamp.fromDate(date) };
    }

    case "json": {
      if (!text) return { ok: false, error: "JSON을 입력해주세요." };
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        return {
          ok: false,
          error: `JSON 형식이 아닙니다: ${
            e instanceof Error ? e.message : "파싱 실패"
          }`,
        };
      }
      if (parsed === null || typeof parsed !== "object") {
        return {
          ok: false,
          error: "map 또는 배열만 넣을 수 있습니다. 단일 값은 위에서 타입을 골라주세요.",
        };
      }
      return { ok: true, value: parsed };
    }
  }
}

/**
 * Adds `field` to one document.
 *
 * Runs in a transaction so the "does it already exist?" check and the write
 * cannot straddle a concurrent update — this is add-only, and an existing value
 * (including an explicit null) is never overwritten.
 */
export async function addFieldToDocument(
  collection: string,
  docId: string,
  field: string,
  value: unknown
): Promise<void> {
  const db = adminDb();
  const ref = db.collection(collection).doc(docId);
  const path = new FieldPath(field);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new Error(`문서를 찾을 수 없습니다: ${docId}`);
    }
    if (snap.get(path) !== undefined) {
      throw new Error(
        `이 문서에는 이미 '${field}' 필드가 있습니다. 기존 값은 덮어쓰지 않습니다.`
      );
    }
    tx.update(ref, path, value);
  });
}

/**
 * Creates a document, stamping `createdAt` server-side.
 *
 * Every collection the dashboard can author into orders by `createdAt`, and a
 * server timestamp is the only value that stays correct regardless of the
 * admin's clock.
 */
export async function createDocument(
  collection: string,
  values: Record<string, unknown>
): Promise<string> {
  const ref = await adminDb()
    .collection(collection)
    .add({ ...values, createdAt: FieldValue.serverTimestamp() });
  return ref.id;
}

/** Server-side timestamp sentinel, for callers outside this module. */
export function serverNow() {
  return FieldValue.serverTimestamp();
}

/** Highest `order` in a collection, plus one. Used when faqs.order is blank. */
export async function nextOrder(collection: string): Promise<number> {
  const snap = await adminDb()
    .collection(collection)
    .orderBy("order", "desc")
    .limit(1)
    .get();

  if (snap.empty) return 1;
  const top = snap.docs[0].get("order");
  return typeof top === "number" ? top + 1 : 1;
}

/**
 * Publishes an announcement by flipping `isActive` to true.
 *
 * The dashboard sends nothing itself: the app's `onAnnouncementPublished`
 * Cloud Function watches this collection, and this write is what wakes it. It
 * then claims the document, stamps `notified`, and fans out the in-app rows and
 * pushes. Sending from here as well would notify every user twice.
 */
export async function publishAnnouncement(
  id: string,
  /**
   * Publish without notifying: stamps `notified` in the same write, which the
   * trigger checks before fanning out, so the notice appears in the app but no
   * push goes out.
   */
  silent = false
): Promise<void> {
  const db = adminDb();
  const ref = db.collection("announcements").doc(id);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("공지를 찾을 수 없습니다.");
    if (snap.get("isActive") === true) {
      throw new Error("이미 게시된 공지입니다.");
    }
    tx.update(
      ref,
      silent
        ? { isActive: true, notified: true, notifiedAt: FieldValue.serverTimestamp() }
        : { isActive: true }
    );
  });
}

/**
 * True when two Firestore values are the same as far as this dashboard cares.
 *
 * Timestamps compare at millisecond precision on purpose: the browser only ever
 * sees an ISO string, so nanoseconds written by `serverTimestamp()` cannot
 * survive the round trip and comparing them exactly would report a conflict on
 * every unchanged server-written date.
 */
function sameValue(a: unknown, b: unknown): boolean {
  if (a instanceof Timestamp || b instanceof Timestamp) {
    return (
      a instanceof Timestamp &&
      b instanceof Timestamp &&
      a.toMillis() === b.toMillis()
    );
  }
  if (a === null || b === null) return a === b;
  if (typeof a !== "object" || typeof b !== "object") return a === b;
  return JSON.stringify(a, jsonReplacer) === JSON.stringify(b, jsonReplacer);
}

/** One-line rendering of a value, for "someone changed this to X" messages. */
function describe(value: unknown): string {
  if (value === null) return "null";
  if (value instanceof Timestamp) return value.toDate().toISOString();
  const text =
    typeof value === "object"
      ? JSON.stringify(value, jsonReplacer)
      : String(value);
  return text.length > 60 ? `${text.slice(0, 59)}…` : text;
}

/**
 * Replaces the value of one existing field on one document.
 *
 * `expected` is the value the admin was looking at when they hit edit. The
 * write only lands if the stored value still matches it, so an edit made
 * against a stale table cannot silently overwrite something the app wrote in
 * the meantime. The check is per-field rather than per-document: these
 * collections are written by the live app constantly, and rejecting an edit
 * because some unrelated field moved would make the feature unusable.
 */
export async function updateFieldInDocument(
  collection: string,
  docId: string,
  field: string,
  value: unknown,
  expected: unknown
): Promise<void> {
  const db = adminDb();
  const ref = db.collection(collection).doc(docId);
  const path = new FieldPath(field);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new Error(`문서를 찾을 수 없습니다: ${docId}`);
    }

    const current = snap.get(path);
    if (current === undefined) {
      throw new Error(
        `'${field}' 필드가 더 이상 존재하지 않습니다. 새로고침 후 다시 시도해주세요.`
      );
    }
    if (current instanceof GeoPoint || current instanceof DocumentReference) {
      throw new Error(
        "GeoPoint와 Reference 타입은 대시보드에서 편집할 수 없습니다."
      );
    }
    if (!sameValue(current, expected)) {
      throw new Error(
        `이 필드의 값이 그 사이에 바뀌었습니다 (현재: ${describe(current)}). ` +
          `덮어쓰지 않았습니다 — 새로고침 후 다시 확인해주세요.`
      );
    }

    tx.update(ref, path, value);
  });
}

export type BackfillResult = {
  /** Documents that gained the field. */
  updated: number;
  /** Documents that already had it and were left alone. */
  skipped: number;
  total: number;
};

/**
 * Adds `field` to every document in a collection that does not already have it.
 *
 * The read is a projection of the single field, so it costs one small read per
 * document rather than pulling the whole collection. Documents that already
 * carry the field are excluded from the write entirely, which makes this
 * additive by construction and safe to re-run after a partial failure.
 */
export async function addFieldToCollection(
  collection: string,
  field: string,
  value: unknown
): Promise<BackfillResult> {
  const db = adminDb();
  const ref = db.collection(collection);
  const path = new FieldPath(field);

  // A projection is not a filter: documents lacking the field still come back,
  // just with no data — which is exactly the set that needs writing.
  const snap = await ref.select(path).get();

  if (snap.size > MAX_BACKFILL) {
    throw new Error(
      `${snap.size.toLocaleString()}개는 대시보드에서 한 번에 처리하기에 너무 많습니다 ` +
        `(최대 ${MAX_BACKFILL.toLocaleString()}개). 스크립트로 처리해주세요.`
    );
  }

  const targets = snap.docs.filter((doc) => doc.get(path) === undefined);

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const doc of targets.slice(i, i + BATCH_SIZE)) {
      batch.update(doc.ref, path, value);
    }
    await batch.commit();
  }

  return {
    updated: targets.length,
    skipped: snap.size - targets.length,
    total: snap.size,
  };
}
