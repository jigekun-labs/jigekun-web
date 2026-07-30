import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Keep firebase-admin out of the server bundle. It pulls in jwks-rsa, which
  // require()s jose — and jose is ESM-only, so once Turbopack bundles it the
  // require() throws ERR_REQUIRE_ESM at runtime on Vercel. Listing it here
  // leaves it as a native Node dependency, resolved the way firebase-admin
  // expects, instead of being transformed by the bundler.
  serverExternalPackages: ["firebase-admin"],
};

export default withNextIntl(nextConfig);
