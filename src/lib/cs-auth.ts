import "server-only";

import { adminEmail, csEmails, portalAuth } from "./portal-auth";

/**
 * The customer-service desk at /cs: the CS_EMAILS accounts, plus the admin.
 *
 * Its session cookie is scoped to /cs, so signing in here grants nothing in
 * /admin. Server actions are reachable from anywhere once deployed, so every
 * /cs action calls `requireCs()` itself rather than trusting the page it sits on.
 */
const cs = portalAuth({
  cookie: "jigekun_cs_session",
  path: "/cs",
  loginPath: "/cs/login",
  isAllowed: (email) => email === adminEmail() || csEmails().includes(email),
});

export const signInCs = cs.signIn;
export const signOutCs = cs.signOut;
export const currentCs = cs.current;
export const requireCs = cs.require;
