import "server-only";

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Firebase Admin SDK, server-side only.
 *
 * The admin dashboard never gives the browser Firestore access. Every read
 * goes through this credential inside a server component or server action, so
 * `firestore.rules` stays closed (the app's rules can only check
 * `request.auth != null` — they cannot tell an admin from any other user, which
 * is exactly why authoring and inspection live on the server).
 *
 * Credentials come from one of two places, in order:
 *
 *  1. An explicit service-account key in the environment
 *     (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY).
 *  2. Application Default Credentials.
 *
 * The second exists because `zigeggun` sits under an organization that
 * enforces `iam.disableServiceAccountKeyCreation`, so a downloadable JSON key
 * may not be available at all. ADC covers every keyless setup:
 *
 *  - local dev after `gcloud auth application-default login` (no key needed —
 *    user credentials are not service-account keys, so the policy is moot),
 *  - Workload Identity Federation via GOOGLE_APPLICATION_CREDENTIALS pointing
 *    at an `external_account` config (the keyless production path on Vercel),
 *  - anything running on Google infrastructure, via the metadata server.
 *
 * Whichever route the project ends up taking, this file does not change.
 */

/** Project id, needed explicitly because ADC user credentials do not carry one. */
function projectId(): string | undefined {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT
  );
}

/**
 * True only for something that could actually be a key. `.env.example` ships a
 * `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----` placeholder,
 * and a half-filled .env should fall through to ADC rather than fail deep
 * inside the crypto layer with an unreadable parse error.
 */
function looksLikePrivateKey(key: string | undefined): key is string {
  if (!key) return false;
  const body = key
    .replace(/-----[A-Z ]+-----/g, "")
    .replace(/\s/g, "")
    .replace(/\\n/g, "");
  return key.includes("BEGIN") && !body.includes("...") && body.length > 100;
}

function buildCredential() {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Vercel stores the key with literal \n escapes; restore real newlines.
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = looksLikePrivateKey(rawKey)
    ? rawKey.replace(/\\n/g, "\n")
    : undefined;

  if (rawKey && !privateKey) {
    console.warn(
      "[admin] FIREBASE_PRIVATE_KEY is set but does not look like a key " +
        "(placeholder?) — falling back to Application Default Credentials."
    );
  }

  const id = projectId();

  if (clientEmail && privateKey) {
    if (!id) {
      throw new Error(
        "FIREBASE_PROJECT_ID is required alongside FIREBASE_CLIENT_EMAIL / " +
          "FIREBASE_PRIVATE_KEY (see .env.example)."
      );
    }
    return cert({ projectId: id, clientEmail, privateKey });
  }

  return applicationDefault();
}

let app: App | undefined;

function adminApp(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length) {
    app = existing[0];
    return app;
  }

  try {
    app = initializeApp({
      credential: buildCredential(),
      projectId: projectId(),
    });
  } catch (e) {
    throw new Error(
      "Could not initialise Firebase Admin. Either set FIREBASE_CLIENT_EMAIL " +
        "and FIREBASE_PRIVATE_KEY, or provide Application Default Credentials " +
        "(`gcloud auth application-default login` locally). " +
        `Underlying error: ${e instanceof Error ? e.message : String(e)}`
    );
  }
  return app;
}

export function adminAuth() {
  return getAuth(adminApp());
}

export function adminDb() {
  return getFirestore(adminApp());
}
