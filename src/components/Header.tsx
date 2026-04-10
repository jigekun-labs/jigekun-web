"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("Header");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const navLinks = [
    { label: t("features"), href: "#features" },
    { label: t("howItWorks"), href: "#how-it-works" },
    { label: t("forEmployers"), href: "#employers" },
    { label: t("forWorkers"), href: "#workers" },
  ];

  function switchLocale(newLocale: string) {
    const pathWithoutLocale = pathname.replace(/^\/(ko|en)/, "") || "/";
    router.push(`/${newLocale}${pathWithoutLocale}`);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <Image src="/icon.png" alt="GGUN" width={32} height={32} className="rounded-lg" />
          <span className="text-xl font-bold text-[var(--gray-900)]">지게꾼</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--gray-600)] hover:text-[var(--primary)] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center rounded-full border border-[var(--gray-200)] overflow-hidden text-sm">
            <button
              onClick={() => switchLocale("ko")}
              className={`px-3 py-1.5 font-medium transition-colors ${
                locale === "ko"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--gray-500)] hover:text-[var(--gray-900)]"
              }`}
            >
              KO
            </button>
            <button
              onClick={() => switchLocale("en")}
              className={`px-3 py-1.5 font-medium transition-colors ${
                locale === "en"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--gray-500)] hover:text-[var(--gray-900)]"
              }`}
            >
              EN
            </button>
          </div>

          <a
            href="#download"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--primary)] rounded-full hover:bg-[var(--primary-dark)] transition-colors"
          >
            {t("downloadApp")}
          </a>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-[var(--gray-600)] hover:text-[var(--primary)]"
            >
              {link.label}
            </a>
          ))}

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => { switchLocale("ko"); setMenuOpen(false); }}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                locale === "ko"
                  ? "bg-[var(--primary)] text-white"
                  : "border border-[var(--gray-200)] text-[var(--gray-500)]"
              }`}
            >
              한국어
            </button>
            <button
              onClick={() => { switchLocale("en"); setMenuOpen(false); }}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                locale === "en"
                  ? "bg-[var(--primary)] text-white"
                  : "border border-[var(--gray-200)] text-[var(--gray-500)]"
              }`}
            >
              English
            </button>
          </div>

          <a
            href="#download"
            onClick={() => setMenuOpen(false)}
            className="block w-full text-center px-5 py-2.5 text-sm font-semibold text-white bg-[var(--primary)] rounded-full hover:bg-[var(--primary-dark)] transition-colors"
          >
            {t("downloadApp")}
          </a>
        </div>
      )}
    </header>
  );
}
