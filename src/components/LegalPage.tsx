import { readFileSync } from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type LegalSlug = "terms" | "privacy" | "delete-account" | "refund-policy";

export default async function LegalPage({ slug }: { slug: LegalSlug }) {
  const markdown = readFileSync(
    path.join(process.cwd(), "src/content", `${slug}.md`),
    "utf-8"
  );

  return (
    <>
      <Header />
      <main className="pt-[68px]">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <article
            className="
              text-[var(--ink)] leading-relaxed
              [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:text-[var(--navy)] [&_h1]:tracking-tight [&_h1]:mb-4
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[var(--ink)] [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:tracking-tight
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--ink)] [&_h3]:mt-8 [&_h3]:mb-3
              [&_p]:my-4 [&_p]:text-[15px] [&_p]:leading-7
              [&_strong]:font-semibold [&_strong]:text-[var(--ink)]
              [&_ul]:my-4 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1.5
              [&_ol]:my-4 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1.5
              [&_li]:text-[15px] [&_li]:leading-7
              [&_li>ul]:mt-2 [&_li>ul]:mb-2
              [&_a]:text-[var(--req)] [&_a]:underline [&_a]:underline-offset-2
              [&_a:hover]:text-[var(--req-strong)]
              [&_table]:block [&_table]:overflow-x-auto [&_table]:my-6 [&_table]:text-sm [&_table]:w-full
              [&_thead]:bg-[var(--canvas)]
              [&_th]:px-3 [&_th]:py-2.5 [&_th]:font-semibold [&_th]:text-[var(--ink)] [&_th]:text-left [&_th]:border [&_th]:border-[var(--line)] [&_th]:align-top
              [&_td]:px-3 [&_td]:py-2.5 [&_td]:border [&_td]:border-[var(--line)] [&_td]:align-top
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
