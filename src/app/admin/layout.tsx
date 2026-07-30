import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

/**
 * Root layout for the admin branch. The public site's root layout lives under
 * `[locale]`, which this tree deliberately sits outside of: the dashboard is
 * not localized, not indexed, and not part of the marketing site.
 *
 * Auth is NOT enforced here — the login form is a child of this layout. The
 * gate lives in `(dashboard)/layout.tsx`, which wraps everything else.
 */
export const metadata: Metadata = {
  title: "지게꾼 Admin",
  // Same logo as the public site. Without this, /admin falls back to the
  // default src/app/favicon.ico (the Next.js/Vercel mark), since this tree has
  // its own root layout separate from [locale].
  icons: { icon: "/favicon.png", apple: "/icon.png" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${geist.variable} antialiased bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
