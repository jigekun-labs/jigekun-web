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
  // The site used to ship an English locale. Keep its old links working by
  // sending them to the Korean page at the same path.
  async redirects() {
    return [
      { source: "/en", destination: "/ko", permanent: true },
      { source: "/en/:path*", destination: "/ko/:path*", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
