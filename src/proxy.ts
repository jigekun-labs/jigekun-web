import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Locale negotiation for the public site — Next.js 16 renamed this file
 * convention from `middleware` to `proxy`.
 *
 * The `next-intl/middleware` import is not part of that rename: it is the
 * library's own entry point, which next-intl still ships under that name. Only
 * the file name and Next's expected export changed.
 *
 * The proxy convention takes either a function named `proxy` or a default
 * export; this is the latter, since `createMiddleware` returns the handler
 * ready-made rather than being written out as a function here.
 */
export default createMiddleware(routing);

/**
 * Unchanged by the rename. Note that `/admin` is deliberately not matched: the
 * dashboard is not localized, and its access control lives in `requireAdmin()`
 * inside each page and server action rather than out here — which is also what
 * Next recommends, since a matcher change can silently drop proxy coverage of a
 * server action.
 */
export const config = {
  matcher: ["/", "/(ko|en)/:path*"],
};
