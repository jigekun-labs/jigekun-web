import type { MetadataRoute } from "next";

/**
 * The marketing site stays crawlable; the admin dashboard does not. The pages
 * themselves also carry `robots: noindex` metadata — this is the belt to that
 * pair of braces, and it keeps /admin out of crawl logs entirely.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
  };
}
