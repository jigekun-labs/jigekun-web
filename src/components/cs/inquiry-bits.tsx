import { STATUS_LABEL, type InquiryStatus } from "@/lib/support-inquiries-shared";

/** An ISO instant in Korean time — the desk is read in Korea. */
export function kst(iso: string | null): string {
  return iso
    ? new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
    : "-";
}

const BADGE: Record<InquiryStatus, string> = {
  open: "bg-orange-50 text-orange-700",
  answered: "bg-blue-50 text-blue-700",
  closed: "bg-gray-100 text-gray-600",
};

export function StatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs ${BADGE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
