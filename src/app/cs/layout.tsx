import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

/**
 * Root layout for the customer-service desk. Like /admin it sits outside
 * [locale]: not localized, not indexed, no marketing analytics.
 *
 * Auth is NOT enforced here — the login form is a child of this layout. The
 * gate lives in `(desk)/layout.tsx`, which wraps everything else.
 */
export const metadata: Metadata = {
  title: "지게꾼 고객센터",
  // Icons come from the `src/app/icon.png` / `apple-icon.png` file conventions.
  // See the note in [locale]/layout.tsx before adding `icons`.
  robots: { index: false, follow: false, nocache: true },
};

export default function CsRootLayout({
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
