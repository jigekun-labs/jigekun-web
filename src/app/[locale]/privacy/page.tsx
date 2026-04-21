import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "지게꾼 개인정보처리방침",
};

export default function Page() {
  return <LegalPage slug="privacy" />;
}
