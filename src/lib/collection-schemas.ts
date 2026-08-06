import type { FieldType } from "./field-types";
import type { CellValue } from "./firestore-view";

/**
 * Shapes for the collections a document can be authored into from the
 * dashboard.
 *
 * Firestore is schemaless and the rest of this dashboard treats it that way —
 * this file is the deliberate exception. `announcements` and `faqs` are
 * authored by an admin rather than written by the app, and `firestore.rules`
 * grants clients read-only access to both, so the Admin SDK behind this
 * dashboard is the only working way to create them.
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
