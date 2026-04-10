import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="bg-[var(--gray-900)] text-[var(--gray-400)]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/icon.png" alt="GGUN" width={32} height={32} className="rounded-lg" />
              <span className="text-xl font-bold text-white">GGUN</span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm">
              {t("tagline")}
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t("product")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">{t("features")}</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">{t("howItWorks")}</a></li>
              <li><a href="#download" className="hover:text-white transition-colors">{t("download")}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t("company")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">{t("terms")}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t("privacy")}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t("contact")}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--gray-700)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs">{t("rights", { year: new Date().getFullYear() })}</p>
          <p className="text-xs">{t("koreanTagline")}</p>
        </div>
      </div>
    </footer>
  );
}
