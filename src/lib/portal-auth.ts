import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "./firebase-admin";

/** 8 hours — long enough for a working session, short enough to expire daily. */
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

/**
 * One signed-in area of the site: /admin, or the customer-service desk at /cs.
 *
 * Each portal has its own session cookie, scoped to its own path, so a session
 * for one is never even sent to the other. Who may enter is decided by
 * `isAllowed`, checked both at sign-in and on every request — anything else
 * that manages to authenticate against the Firebase project (every app user
 * has a session, remember) is rejected.
 */
export type Portal = {
  cookie: string;
  path: string;
  loginPath: string;
  isAllowed: (email: string) => boolean;
};

/**
 * Firebase's password endpoint, or the Auth emulator's copy of it when
 * FIREBASE_AUTH_EMULATOR_HOST is set (the Admin SDK reads the same variable),
 * so sign-in can be exercised locally without a real account.
 */
function passwordEndpoint(apiKey: string): string {
  const emulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const base = emulator
    ? `http://${emulator}/identitytoolkit.googleapis.com`
    : "https://identitytoolkit.googleapis.com";
  return `${base}/v1/accounts:signInWithPassword?key=${apiKey}`;
}

export function portalAuth(portal: Portal) {
  /**
   * Exchange an email + password for a session cookie.
   *
   * The password is verified by Firebase's REST endpoint (the same one the
   * client SDK uses) and the resulting ID token is immediately traded for a
   * session cookie minted by the Admin SDK. The browser never receives the ID
   * token, so it never holds a credential that could talk to Firestore
   * directly.
   *
   * Returns an error string on failure — deliberately the same message for
   * "unknown email" and "wrong password" so the form cannot be used to
   * discover whether an account exists.
   */
  async function signIn(
    email: string,
    password: string
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "서버 설정 오류: FIREBASE_API_KEY 없음" };
    }

    const generic = "이메일 또는 비밀번호가 올바르지 않습니다.";

    // Reject anyone not allowed here before spending a network call.
    if (!portal.isAllowed(email.trim().toLowerCase())) {
      return { ok: false, error: generic };
    }

    let idToken: string;
    try {
      const res = await fetch(passwordEndpoint(apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          returnSecureToken: true,
        }),
        cache: "no-store",
      });

      if (!res.ok) return { ok: false, error: generic };

      const data = (await res.json()) as { idToken?: string; email?: string };
      if (!data.idToken) return { ok: false, error: generic };

      // Belt and braces: the token must belong to an allowed address.
      if (!portal.isAllowed((data.email ?? "").toLowerCase())) {
        return { ok: false, error: generic };
      }
      idToken = data.idToken;
    } catch {
      return { ok: false, error: "로그인 요청에 실패했습니다. 다시 시도해주세요." };
    }

    let sessionCookie: string;
    try {
      sessionCookie = await adminAuth().createSessionCookie(idToken, {
        expiresIn: SESSION_MAX_AGE_MS,
      });
    } catch (e) {
      // Almost always a missing/malformed service account rather than anything
      // the person at the keyboard did — say so instead of blaming the password.
      return {
        ok: false,
        error: `세션 생성에 실패했습니다: ${
          e instanceof Error ? e.message : "알 수 없는 오류"
        }`,
      };
    }

    const store = await cookies();
    store.set(portal.cookie, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: portal.path,
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });

    return { ok: true };
  }

  async function signOut() {
    const store = await cookies();
    store.delete({ name: portal.cookie, path: portal.path });
  }

  /**
   * The signed-in email, or null. `checkRevoked` makes a disabled or
   * password-changed account lose access on the next request rather than at
   * cookie expiry, and `isAllowed` makes removing someone from the allow list
   * take effect the same way.
   */
  async function current(): Promise<string | null> {
    const store = await cookies();
    const session = store.get(portal.cookie)?.value;
    if (!session) return null;

    try {
      const claims = await adminAuth().verifySessionCookie(session, true);
      const email = (claims.email ?? "").toLowerCase();
      return portal.isAllowed(email) ? email : null;
    } catch {
      return null;
    }
  }

  /** Gate for every page and server action. Redirects to the login form. */
  async function require(): Promise<string> {
    const email = await current();
    if (!email) redirect(portal.loginPath);
    return email;
  }

  return { signIn, signOut, current, require };
}

/** The single account allowed into /admin. */
export function adminEmail(): string {
  return (process.env.ADMIN_EMAIL || "admin@jigekun.app").toLowerCase();
}

/** Comma-separated CS_EMAILS — the customer-service accounts for /cs. */
export function csEmails(): string[] {
  return (process.env.CS_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
