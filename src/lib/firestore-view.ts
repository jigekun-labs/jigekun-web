import "server-only";

import { Timestamp, GeoPoint, DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";

export const PAGE_SIZE = 50;

/**
 * Field each collection is sorted by, newest first. Anything not listed falls
 * back to document id.
 *
 * Firestore drops documents that lack the sort field, so `fetchPage` verifies
 * the ordered query actually returned something and retries by id if it did
 * not — a collection where only some documents have `createdAt` still lists in
 * full rather than silently showing a subset.
 */
const ORDER_FIELD: Record<string, string> = {
  users: "createdAt",
  jobListings: "createdAt",
  jobOffers: "offeredAt",
  notifications: "createdAt",
  announcements: "createdAt",
  payouts: "createdAt",
  supportChats: "createdAt",
  reviews: "createdAt",
};

/**
 * Columns pinned to the front, per collection. Everything else follows
 * alphabetically. Keeps the identifying fields visible without horizontal
 * scrolling on the collections that matter most.
 */
const PRIORITY_COLUMNS: Record<string, string[]> = {
  users: ["id", "email", "activeRole", "roles", "isPro", "createdAt"],
  jobListings: ["id", "title", "status", "companyId", "date", "createdAt"],
  jobOffers: ["id", "status", "jobListingId", "workerId", "offeredAt"],
  notifications: ["id", "type", "title", "userId", "isRead", "createdAt"],
  announcements: ["id", "title", "isActive", "isImportant", "notified", "createdAt"],
  payouts: ["id", "status", "type", "amount", "workerId", "createdAt"],
};

/**
 * Below this many documents, a collection is loaded in full and filtered in the
 * browser — which is how the table gets true substring search across every
 * field, something Firestore itself cannot do at any price.
 *
 * The whole database is currently 996 documents / 0.39 MB, so every collection
 * qualifies with room to spare. `notifications` and `jobOffers` are the two that
 * grow without bound (per user, per job); when one crosses this line the table
 * pages instead, and says so rather than quietly filtering a subset.
 */
export const FULL_LOAD_LIMIT = 2000;

/**
 * Where a pasted identifier might turn up, collection by collection. Used by
 * the global search to answer "what does this id touch?" — the question you
 * have when a worker calls and gives you nothing but their phone number.
 *
 * Every entry is an equality match on an indexed field, so this stays a fixed
 * number of cheap lookups no matter how the data grows.
 */
const GLOBAL_LOOKUP: Record<string, string[]> = {
  users: ["email", "profile.phone"],
  jobListings: ["companyId"],
  jobOffers: ["workerId", "companyId", "jobListingId"],
  notifications: ["userId"],
  penaltyEvents: ["userId", "jobListingId"],
  reviews: ["reviewerId", "targetId", "jobListingId", "jobOfferId"],
  groupChats: ["employerId", "createdBy", "jobListingId"],
  agentUsage: ["uid", "sessionId"],
};

/** Array fields need array-contains rather than equality. */
const ARRAY_FIELDS = new Set(["groupChats.memberIds", "users.roles"]);

export type CellValue =
  | { kind: "null" }
  | { kind: "string"; value: string }
  | { kind: "number"; value: number }
  | { kind: "bool"; value: boolean }
  | { kind: "date"; value: string }
  | { kind: "json"; value: string; preview: string };

/** `json` is the whole document, pretty-printed, for the row detail panel. */
export type Row = {
  id: string;
  cells: Record<string, CellValue>;
  json: string;
};

export type CollectionInfo = { name: string; count: number };

export type Page = {
  rows: Row[];
  columns: string[];
  nextCursor: string | null;
  total: number;
  /** Field actually sorted on — null means document id. Shown in the header. */
  sortedBy: string | null;
};

/** Every top-level collection, with document counts for the sidebar. */
export async function listCollections(): Promise<CollectionInfo[]> {
  const db = adminDb();
  const refs = await db.listCollections();

  const infos = await Promise.all(
    refs.map(async (ref) => {
      try {
        const snap = await ref.count().get();
        return { name: ref.id, count: snap.data().count };
      } catch {
        // A count that fails should not take the whole sidebar down.
        return { name: ref.id, count: -1 };
      }
    })
  );

  return infos.sort((a, b) => a.name.localeCompare(b.name));
}

function toCell(value: unknown): CellValue {
  if (value === null || value === undefined) return { kind: "null" };

  if (value instanceof Timestamp) {
    return { kind: "date", value: value.toDate().toISOString() };
  }
  if (value instanceof GeoPoint) {
    return {
      kind: "string",
      value: `${value.latitude}, ${value.longitude}`,
    };
  }
  if (value instanceof DocumentReference) {
    return { kind: "string", value: value.path };
  }

  switch (typeof value) {
    case "string":
      return { kind: "string", value };
    case "number":
      return { kind: "number", value };
    case "boolean":
      return { kind: "bool", value };
  }

  // Map or array: keep the full JSON for the row detail, plus a one-line
  // preview for the cell.
  const json = JSON.stringify(value, jsonReplacer, 2);
  const flat = JSON.stringify(value, jsonReplacer);
  return {
    kind: "json",
    value: json,
    preview: flat.length > 60 ? `${flat.slice(0, 59)}…` : flat,
  };
}

/** Makes Firestore's own types survive JSON.stringify inside nested values. */
function jsonReplacer(_key: string, value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof GeoPoint) return `${value.latitude}, ${value.longitude}`;
  if (value instanceof DocumentReference) return value.path;
  return value;
}

function orderColumns(collection: string, keys: Set<string>): string[] {
  const priority = PRIORITY_COLUMNS[collection] ?? ["id"];
  const front = priority.filter((k) => keys.has(k));
  const rest = [...keys].filter((k) => !front.includes(k)).sort();
  return [...front, ...rest];
}

/** Shapes a query snapshot into rows + columns, shared by browse and search. */
function toPage(
  collection: string,
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
  opts: { nextCursor: string | null; total: number; sortedBy: string | null }
): Page {
  const keys = new Set<string>(["id"]);
  const rows: Row[] = docs.map((doc) => {
    const data = doc.data();
    const cells: Record<string, CellValue> = {
      id: { kind: "string", value: doc.id },
    };
    for (const [key, value] of Object.entries(data)) {
      keys.add(key);
      cells[key] = toCell(value);
    }
    return { id: doc.id, cells, json: JSON.stringify(data, jsonReplacer, 2) };
  });

  return {
    rows,
    columns: orderColumns(collection, keys),
    nextCursor: opts.nextCursor,
    total: opts.total,
    sortedBy: opts.sortedBy,
  };
}

/**
 * Every document in a collection, for collections small enough to hand to the
 * browser whole (see [FULL_LOAD_LIMIT]). The table then filters them locally,
 * which is the only way to get substring matching — Firestore does exact and
 * prefix, and nothing else, at any collection size.
 *
 * Ordering reuses the same completeness rule as `fetchPage`: sort by the
 * collection's time field only when every document has it, otherwise by id, so
 * nothing is silently dropped.
 */
export async function fetchAll(collection: string): Promise<Page> {
  const db = adminDb();
  const ref = db.collection(collection);

  const total = await ref
    .count()
    .get()
    .then((s) => s.data().count)
    .catch(() => -1);

  const configured = ORDER_FIELD[collection];
  let orderField: string | null = configured ?? null;

  if (configured && total > 0) {
    const sortable = await ref
      .orderBy(configured)
      .count()
      .get()
      .then((s) => s.data().count)
      .catch(() => -1);
    if (sortable !== total) orderField = null;
  }

  let snap;
  try {
    snap = await (
      orderField
        ? ref.orderBy(orderField, "desc")
        : ref.orderBy("__name__", "asc")
    ).get();
  } catch {
    orderField = null;
    snap = await ref.orderBy("__name__", "asc").get();
  }

  return toPage(collection, snap.docs, {
    nextCursor: null,
    total,
    sortedBy: orderField,
  });
}

export type GlobalHit = {
  collection: string;
  field: string;
  count: number;
};

/**
 * "Where does this identifier appear?" — a document-id lookup in every
 * collection, plus an equality match on each known foreign-key field.
 *
 * All of it runs in parallel and every query is an indexed count, so this is a
 * fixed handful of cheap reads rather than anything that scans.
 */
export async function globalSearch(rawQuery: string): Promise<GlobalHit[]> {
  const query = rawQuery.trim();
  if (!query) return [];

  const db = adminDb();
  const refs = await db.listCollections();
  const hits: GlobalHit[] = [];

  await Promise.all([
    // The id itself, in every collection.
    ...refs.map(async (ref) => {
      const snap = await ref.doc(query).get().catch(() => null);
      if (snap?.exists) {
        hits.push({ collection: ref.id, field: "id", count: 1 });
      }
    }),

    // Anywhere that id is referenced.
    ...refs.flatMap((ref) =>
      (GLOBAL_LOOKUP[ref.id] ?? []).map(async (field) => {
        const isArray = ARRAY_FIELDS.has(`${ref.id}.${field}`);
        const count = await ref
          .where(field, isArray ? "array-contains" : "==", query)
          .count()
          .get()
          .then((s) => s.data().count)
          .catch(() => 0);
        if (count > 0) hits.push({ collection: ref.id, field, count });
      })
    ),
  ]);

  // Document-id hits first, then biggest groups.
  return hits.sort((a, b) => {
    if (a.field === "id" && b.field !== "id") return -1;
    if (b.field === "id" && a.field !== "id") return 1;
    return b.count - a.count;
  });
}

/**
 * One page of a collection. `cursor` is the id of the last document on the
 * previous page — resolved back to a snapshot here so `startAfter` works with
 * whatever ordering the collection uses.
 */
export async function fetchPage(
  collection: string,
  cursor?: string
): Promise<Page> {
  const db = adminDb();
  const ref = db.collection(collection);

  const total = await ref
    .count()
    .get()
    .then((s) => s.data().count)
    .catch(() => -1);

  // Firestore excludes documents that lack the orderBy field, so sorting by
  // `createdAt` would quietly drop every document written before that field
  // existed — `users` has two such documents today, and they would never appear
  // on any page. Compare the sortable count against the total and fall back to
  // document id when they disagree: complete beats newest-first.
  const configured = ORDER_FIELD[collection];
  let orderField: string | null = configured ?? null;

  if (configured && total > 0) {
    const sortable = await ref
      .orderBy(configured)
      .count()
      .get()
      .then((s) => s.data().count)
      .catch(() => -1);
    if (sortable !== total) orderField = null;
  }

  async function run(field: string | null) {
    let q = field
      ? ref.orderBy(field, "desc")
      : ref.orderBy("__name__", "asc");

    if (cursor) {
      const cursorSnap = await ref.doc(cursor).get();
      if (cursorSnap.exists) q = q.startAfter(cursorSnap);
    }

    return q.limit(PAGE_SIZE + 1).get();
  }

  let snap;
  try {
    snap = await run(orderField);
  } catch {
    orderField = null;
    snap = await run(null);
  }

  const docs = snap.docs.slice(0, PAGE_SIZE);

  return toPage(collection, docs, {
    nextCursor: snap.docs.length > PAGE_SIZE ? docs[docs.length - 1].id : null,
    total,
    sortedBy: orderField,
  });
}

/** Full document, as formatted JSON, for the row detail panel. */
export async function fetchDocument(
  collection: string,
  id: string
): Promise<string | null> {
  const snap = await adminDb().collection(collection).doc(id).get();
  if (!snap.exists) return null;
  return JSON.stringify(snap.data(), jsonReplacer, 2);
}
