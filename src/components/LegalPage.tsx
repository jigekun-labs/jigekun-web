import { readFileSync } from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getLocale, getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type LegalSlug = "terms" | "privacy" | "delete-account";

export default async function LegalPage({ slug }: { slug: LegalSlug }) {
  const locale = await getLocale();
  const t = await getTranslations("Legal");
  const markdown = readFileSync(
    path.join(process.cwd(), "src/content", `${slug}.md`),
    "utf-8"
  );

  return (
    <>
      <Header />
      <main className="pt-16 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-16">
          {locale !== "ko" && (
            <div className="mb-10 rounded-xl border border-[var(--primary-light)] bg-[var(--primary-light)]/40 px-5 py-4 text-sm text-[var(--gray-700)]">
              <p className="font-semibold text-[var(--gray-900)] mb-1">
                {t("noticeTitle")}
              </p>
              <p className="leading-relaxed">{t("noticeBody")}</p>
            </div>
          )}

          <article
            className="
              text-[var(--gray-700)] leading-relaxed
              [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:text-[var(--gray-900)] [&_h1]:tracking-tight [&_h1]:mb-4
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[var(--gray-900)] [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:tracking-tight
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--gray-900)] [&_h3]:mt-8 [&_h3]:mb-3
              [&_p]:my-4 [&_p]:text-[15px] [&_p]:leading-7
              [&_strong]:font-semibold [&_strong]:text-[var(--gray-900)]
              [&_ul]:my-4 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1.5
              [&_ol]:my-4 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1.5
              [&_li]:text-[15px] [&_li]:leading-7
              [&_li>ul]:mt-2 [&_li>ul]:mb-2
              [&_a]:text-[var(--primary)] [&_a]:underline [&_a]:underline-offset-2
              [&_a:hover]:text-[var(--primary-dark)]
              [&_table]:block [&_table]:overflow-x-auto [&_table]:my-6 [&_table]:text-sm [&_table]:w-full
              [&_thead]:bg-[var(--gray-50)]
              [&_th]:px-3 [&_th]:py-2.5 [&_th]:font-semibold [&_th]:text-[var(--gray-900)] [&_th]:text-left [&_th]:border [&_th]:border-[var(--gray-200)] [&_th]:align-top
              [&_td]:px-3 [&_td]:py-2.5 [&_td]:border [&_td]:border-[var(--gray-200)] [&_td]:align-top
            "
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown}
            </ReactMarkdown>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
