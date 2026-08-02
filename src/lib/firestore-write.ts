import "server-only";

import { FieldPath, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
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
