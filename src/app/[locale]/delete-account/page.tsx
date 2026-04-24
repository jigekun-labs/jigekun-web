import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "지게꾼 계정 삭제 안내",
};

export default function Page() {
  return <LegalPage slug="delete-account" />;
}
