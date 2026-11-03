import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import "../globals.css";
import "./site.css";

// Korean glyphs are split into many unicode-range files; preloading them all
// would defeat the split, so only the CSS is emitted up front.
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
  preload: false,
});

const description =
  "지게꾼은 짧은 시간 일손이 필요한 업체와, 가까운 곳에서 일하고 싶은 작업자를 연결해요. 장소·일정·인원만 말하면 요청서가 만들어져요.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.jigekun.com"),
  title: "지게꾼 — 필요한 일손, 한마디면 충분해요",
  description,
  openGraph: {
    title: "지게꾼 — 필요한 일손, 한마디면 충분해요",
    description: "업체는 대화로 인력을 요청하고, 작업자는 가까운 일을 골라요.",
    images: ["/assets/event.webp"],
    locale: "ko_KR",
  },
  // Icons come from the `src/app/icon.png` and `src/app/apple-icon.png` file
  // conventions, which apply across both root layouts. Do not add an `icons`
  // field here: config-based icons replace the generated block wholesale, so
  // declaring even one key silently drops the rest.
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
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

  return (
    // `js` is added before paint so scroll-reveal content (.rv) is only hidden
    // when the script that reveals it can actually run.
    <html
      lang={locale}
      className="scroll-smooth"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className={notoSansKr.variable}>
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
        {/* Supplies the locale to next-intl's client-side <Link>. */}
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        {/* Public site only — the /admin tree has its own root layout and is
            deliberately left out, so private tooling never mixes into the
            marketing numbers. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
