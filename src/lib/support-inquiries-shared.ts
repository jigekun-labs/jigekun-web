/**
 * The parts of support-inquiries.ts that browser components need too. Kept
 * free of firebase-admin so a client component can import it.
 */

export const STATUSES = ["open", "answered", "closed"] as const;
export type InquiryStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<InquiryStatus, string> = {
  open: "답변 전",
  answered: "답변함",
  closed: "종료",
};

/** "…으로/로 바꾸기" with the right particle for each status. */
export const MOVE_TO_LABEL: Record<InquiryStatus, string> = {
  open: "답변 전으로",
  answered: "답변함으로",
  closed: "종료로",
};

export const ROLE_LABEL: Record<string, string> = {
  employer: "요청자",
  employee: "작업자",
};
