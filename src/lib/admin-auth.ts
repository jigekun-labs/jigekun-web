import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "./firebase-admin";

export const SESSION_COOKIE = "jigekun_admin_session";

/** 8 hours — long enough for a working session, short enough to expire daily. */
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

/**
 * The single account allowed into the dashboard. Anything else that manages to
 * authenticate against the Firebase project — every app user has an anonymous
 * session, remember — is rejected here.
 */
function allowedEmail(): string {
  return (process.env.ADMIN_EMAIL || "admin@jigekun.app").toLowerCase();
}

/**
 * Exchange an email + password for a session cookie.
 *
 * The password is verified by Firebase's REST endpoint (the same one the client
 * SDK uses) and the resulting ID token is immediately traded for a session
 * cookie minted by the Admin SDK. The browser never receives the ID token, so
 * it never holds a credential that could talk to Firestore directly.
 *
 * Returns an error string on failure — deliberately the same message for
 * "unknown email" and "wrong password" so the form cannot be used to discover
 * whether an account exists.
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "서버 설정 오류: FIREBASE_API_KEY 없음" };
  }

  const generic = "이메일 또는 비밀번호가 올바르지 않습니다.";

  // Reject anything but the admin address before spending a network call.
  if (email.trim().toLowerCase() !== allowedEmail()) {
    return { ok: false, error: generic };
  }

  let idToken: string;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          returnSecureToken: true,
        }),
        cache: "no-store",
      }
    );
    if (!res.ok) return { ok: false, error: generic };
    const data = (await res.json()) as { idToken?: string; email?: string };
    if (!data.idToken) return { ok: false, error: generic };
    // Belt and braces: the token must belong to the allowed address.
    if ((data.email ?? "").toLowerCase() !== allowedEmail()) {
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
    // Almost always a missing/!malformed service account rather than anything
    // the person at the keyboard did — say so instead of blaming the password.
    return {
      ok: false,
      error: `세션 생성에 실패했습니다: ${
        e instanceof Error ? e.message : "알 수 없는 오류"
      }`,
    };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });

  return { ok: true };
}

export async function signOut() {
  const store = await cookies();
  store.delete({ name: SESSION_COOKIE, path: "/admin" });
}

/**
 * Returns the signed-in admin's email, or null. `checkRevoked` makes a disabled
 * or password-changed account lose access on the next request rather than at
 * cookie expiry.
 */
export async function currentAdmin(): Promise<string | null> {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  try {
    const claims = await adminAuth().verifySessionCookie(session, true);
    const email = (claims.email ?? "").toLowerCase();
    return email === allowedEmail() ? email : null;
  } catch {
    return null;
  }
}

/** Gate for every dashboard page. Redirects to the login form when signed out. */
export async function requireAdmin(): Promise<string> {
  const email = await currentAdmin();
  if (!email) redirect("/admin/login");
  return email;
}
