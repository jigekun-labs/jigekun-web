import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import "../globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "지게꾼",
  description:
    "GGUN connects employers who need temporary workers with reliable people ready to work. Post jobs, get matched, and get paid — all in one app.",
  // Icons come from the `src/app/icon.png` and `src/app/apple-icon.png` file
  // conventions, which apply across both root layouts. Do not add an `icons`
  // field here: config-based icons replace the generated block wholesale, so
  // declaring even one key silently drops the rest.
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="scroll-smooth">
      <body className={`${geist.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        {/* Public site only — the /admin tree has its own root layout and is
            deliberately left out, so private tooling never mixes into the
            marketing numbers. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
