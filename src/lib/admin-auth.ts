import "server-only";

import { adminEmail, portalAuth } from "./portal-auth";

export const SESSION_COOKIE = "jigekun_admin_session";

/**
 * The /admin dashboard: the single ADMIN_EMAIL account, nobody else. The
 * customer-service accounts have their own desk at /cs (see cs-auth.ts) and
 * cannot sign in here.
 */
const admin = portalAuth({
  cookie: SESSION_COOKIE,
  path: "/admin",
  loginPath: "/admin/login",
  isAllowed: (email) => email === adminEmail(),
});

export const signIn = admin.signIn;
export const signOut = admin.signOut;
export const currentAdmin = admin.current;
export const requireAdmin = admin.require;
