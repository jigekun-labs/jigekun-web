import type { FieldType } from "./field-types";
import type { CellValue } from "./firestore-view";

/**
 * Shapes for the collections a document can be authored into from the
 * dashboard.
 *
 * Firestore is schemaless and the rest of this dashboard treats it that way —
 * this file is the deliberate exception. `announcements`, `faqs` and
 * `couponCampaigns` are authored by an admin rather than written by the app,
 * and `firestore.rules` keeps clients from writing any of them, so the Admin
 * SDK behind this dashboard is the only working way to create them.
 *
 * Field lists were taken from the live documents, not guessed.
 */

export type FieldSpec = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Renders a textarea instead of a single-line input. */
  multiline?: boolean;
  /** Starting value, in the form's string representation. */
  initial?: string;
  help?: string;
  /** Leave blank and the server fills it in (faqs.order). */
  autoWhenBlank?: boolean;
  /** Shown in red — ticking this has consequences outside the dashboard. */
  danger?: string;
  /** Swaps the plain input for a purpose-built editor. */
  control?: "blocks";
  /** Restricts a string to these values, entered with a dropdown. */
  options?: { value: string; label: string }[];
  /** Left out of the document when blank, instead of stored as "" (or refused). */
  omitWhenBlank?: boolean;
  /** Number bounds, checked on the server. */
  integer?: boolean;
  min?: number;
  /** Only shown, and only written, while another field has this value. */
  showWhen?: { field: string; equals: string };
};

export type CollectionSchema = {
  label: string;
  note?: string;
  fields: FieldSpec[];
  /**
   * Lets a document go live without waking the notification trigger.
   *
   * The app's `onAnnouncementPublished` skips any announcement that already has
   * `notified === true`, so writing that flag in the same breath as `isActive`
   * publishes the notice to the in-app list while pre-empting the fan-out. That
   * is the only way to post something users can read without buzzing 48 phones.
   */
  silentPublish?: { guardField: string; label: string; help: string };
  /**
   * The document id is entered by hand instead of generated, because it means
   * something (a coupon code). Creating refuses to overwrite an existing id.
   */
  docId?: { label: string; help: string; placeholder?: string };
  /** Cross-field check, run on the server after each field has parsed. */
  validate?: (values: Record<string, unknown>) => string | null;
};

export const COLLECTION_SCHEMAS: Record<string, CollectionSchema> = {
  announcements: {
    label: "공지사항",
    silentPublish: {
      guardField: "notified",
      label: "알림 없이 게시",
      help:
        "앱의 공지 목록에는 바로 표시되지만, 푸시 알림과 앱 내 알림은 발송되지 " +
        "않습니다. 사소한 문구 수정이나 테스트용 공지에 사용하세요.",
    },
    note:
      "저장해도 알림은 발송되지 않습니다. 표에서 내용을 확인한 뒤 '게시하기'를 눌러야 " +
      "전체 사용자에게 발송됩니다.",
    fields: [
      { name: "title", label: "제목", type: "string", required: true },
      {
        name: "summary",
        label: "요약",
        type: "string",
        help:
          "푸시 알림에 표시될 한 줄입니다. 비워두면 본문 앞부분이 대신 쓰입니다. " +
          "(앱의 Cloud Function에 한 줄 수정이 필요합니다.)",
      },
      {
        name: "blocks",
        label: "내용",
        type: "json",
        control: "blocks",
        required: true,
        help:
          "블록을 쌓은 순서가 그대로 앱 화면의 순서입니다. ⠿ 를 끌거나 ↑↓ 로 " +
          "순서를 바꿀 수 있습니다.",
      },
      {
        name: "isImportant",
        label: "중요 공지",
        type: "boolean",
        initial: "false",
        help: "앱의 공지 목록에서 강조 표시됩니다.",
      },
      {
        name: "isMarketing",
        label: "광고성 정보",
        type: "boolean",
        initial: "false",
        help:
          "체크하면 마케팅 수신에 동의한 사용자에게만 발송됩니다(기본값 꺼짐). " +
          "서비스 점검·정책 변경 같은 일반 공지는 체크하지 마세요.",
      },
      {
        name: "isActive",
        label: "즉시 게시",
        type: "boolean",
        initial: "false",
        danger:
          "체크하고 저장하면 저장 즉시 전체 사용자에게 알림이 발송됩니다. " +
          "되돌릴 수 없습니다.",
      },
    ],
  },

  faqs: {
    label: "자주 묻는 질문",
    note: "FAQ는 알림을 발송하지 않습니다. 저장하면 앱에 바로 반영됩니다.",
    fields: [
      { name: "question", label: "질문", type: "string", required: true },
      {
        name: "answer",
        label: "답변",
        type: "string",
        required: true,
        multiline: true,
      },
      {
        name: "order",
        label: "순서",
        type: "number",
        autoWhenBlank: true,
        help: "비워두면 마지막 순서 다음 번호가 자동으로 들어갑니다.",
      },
      {
        name: "isActive",
        label: "게시",
        type: "boolean",
        initial: "true",
        help: "끄면 앱의 FAQ 목록에서 숨겨집니다.",
      },
    ],
  },

  // The app reads these in functions/src/payments/coupons.ts (issueCoupon,
  // couponDiscount), coupons/redeemCouponCode.ts and
  // coupons/onEmployerWelcomeCoupon.ts. Optional fields are omitted when blank,
  // like the hand-made campaigns: those functions read a missing limit as "none".
  couponCampaigns: {
    label: "쿠폰",
    note:
      "저장하는 즉시 적용됩니다. 할인 금액은 어떤 경우에도 결제의 플랫폼 " +
      "수수료를 넘지 않습니다.",
    docId: {
      label: "쿠폰 코드",
      placeholder: "예: NEWJIGEKUN",
      help:
        "문서 ID로 저장됩니다. code 쿠폰이면 사용자가 앱 쿠폰함에 입력하는 " +
        "코드이고(대소문자 구분 없이 입력 가능), signup 쿠폰이면 관리용 " +
        "이름입니다(예: WELCOME). 영문, 숫자, -, _ 만 쓸 수 있고 대문자로 " +
        "저장됩니다. 만든 뒤에는 바꿀 수 없습니다.",
    },
    validate: (v) =>
      v.discountType === "percent" && Number(v.discountValue) > 100
        ? "percent 쿠폰의 할인 값은 100 이하여야 합니다."
        : null,
    fields: [
      {
        name: "kind",
        label: "발급 방식",
        type: "string",
        required: true,
        initial: "code",
        options: [
          { value: "code", label: "code — 코드를 입력해서 받는 쿠폰" },
          { value: "signup", label: "signup — 가입하면 자동으로 받는 쿠폰" },
        ],
        help:
          "code: 사용자가 쿠폰함에서 위의 코드를 입력하면 발급됩니다. " +
          "signup: 계정에 요청자(업체) 역할이 처음 생길 때(신규 가입, 또는 " +
          "작업자가 요청자 역할을 추가할 때) 자동으로 발급됩니다. 발급 중인 " +
          "signup 쿠폰이 여러 개면 모두 함께 발급됩니다.",
      },
      {
        name: "title",
        label: "쿠폰 이름",
        type: "string",
        required: true,
        help: "앱 쿠폰함에 표시되는 이름입니다. 예: 첫 요청 할인",
      },
      {
        name: "condition",
        label: "사용 조건 안내",
        type: "string",
        omitWhenBlank: true,
        help:
          "쿠폰 이름 아래에 표시되는 안내 문구입니다. 예: 첫 인력 요청 결제 시. " +
          "화면에 보여주기만 할 뿐, 실제 사용 조건은 아래 숫자 필드로 정해집니다.",
      },
      {
        name: "discountType",
        label: "할인 방식",
        type: "string",
        required: true,
        initial: "percent",
        options: [
          { value: "percent", label: "percent — 정률 (결제 금액의 %)" },
          { value: "amount", label: "amount — 정액 (원)" },
        ],
      },
      {
        name: "discountValue",
        label: "할인 값",
        type: "number",
        required: true,
        integer: true,
        min: 1,
        help:
          "percent면 할인율입니다(10 = 10%). amount면 할인 금액(원)입니다(5000 = 5,000원).",
      },
      {
        name: "maxDiscount",
        label: "최대 할인 금액",
        type: "number",
        omitWhenBlank: true,
        integer: true,
        min: 1,
        showWhen: { field: "discountType", equals: "percent" },
        help: "정률 할인의 상한(원)입니다. 비워두면 상한이 없습니다.",
      },
      {
        name: "minAmount",
        label: "최소 결제 금액",
        type: "number",
        omitWhenBlank: true,
        integer: true,
        min: 0,
        help: "이 금액(원) 이상 결제할 때만 쓸 수 있습니다. 비워두면 제한이 없습니다.",
      },
      {
        name: "validDays",
        label: "유효 기간 (일)",
        type: "number",
        omitWhenBlank: true,
        integer: true,
        min: 1,
        help:
          "발급받은 날부터 며칠 동안 쓸 수 있는지입니다. 만료 일시와 함께 " +
          "정하면 더 이른 쪽이 적용됩니다. 둘 다 비워두면 기한 없이 쓸 수 있습니다.",
      },
      {
        name: "expiresAt",
        label: "만료 일시",
        type: "timestamp",
        omitWhenBlank: true,
        help:
          "이 시각이 지나면 더 이상 발급되지 않고, 이미 발급된 쿠폰도 이 " +
          "시각에 만료됩니다.",
      },
      {
        name: "totalLimit",
        label: "총 발급 수량",
        type: "number",
        omitWhenBlank: true,
        integer: true,
        min: 1,
        help:
          "이만큼 발급되면 더 받을 수 없습니다. 비워두면 무제한입니다. " +
          "발급된 수는 issuedCount에 자동으로 기록됩니다.",
      },
      {
        name: "active",
        label: "발급 중",
        type: "boolean",
        initial: "true",
        help:
          "끄면 새로 발급되지 않습니다. 이미 발급된 쿠폰은 계속 쓸 수 있습니다.",
      },
    ],
  },
};

export function schemaFor(collection: string): CollectionSchema | null {
  return COLLECTION_SCHEMAS[collection] ?? null;
}

/**
 * Where an announcement sits relative to the `onAnnouncementPublished` trigger
 * in the app's Cloud Functions.
 *
 * That trigger runs on *every* write to an announcement and fans out whenever
 * it finds `isActive === true && notified !== true`. So a live-but-unnotified
 * document is armed: editing so much as its title broadcasts it to every user.
 * The dashboard has to say so before an admin clicks 편집.
 */
export type AnnouncementState = "draft" | "armed" | "sent";

export function announcementState(
  cells: Record<string, CellValue>
): AnnouncementState {
  const cell = (k: string) => {
    const c = cells[k];
    return c && c.kind === "bool" ? c.value : undefined;
  };

  if (cell("notified") === true) return "sent";
  return cell("isActive") === true ? "armed" : "draft";
}

/**
 * A Korean warning if editing `field` on this document would trigger the
 * announcement fan-out, or null when the edit is inert.
 */
export function broadcastWarning(
  collection: string,
  cells: Record<string, CellValue>,
  field: string,
  nextValueText: string
): string | null {
  if (collection !== "announcements") return null;

  const state = announcementState(cells);
  if (state === "sent") return null;

  if (state === "armed") {
    return (
      "이 공지는 게시 상태(isActive=true)이지만 아직 발송되지 않았습니다. " +
      "어떤 필드든 저장하는 순간 전체 사용자에게 알림이 발송됩니다."
    );
  }

  // draft: only flipping isActive on arms it
  if (field === "isActive" && nextValueText === "true") {
    return (
      "isActive를 true로 바꾸면 전체 사용자에게 알림이 발송됩니다. " +
      "되돌릴 수 없습니다."
    );
  }

  return null;
}
