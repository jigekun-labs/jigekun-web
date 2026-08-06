/**
 * The block vocabulary an announcement body is built from.
 *
 * An announcement is an ordered list of blocks; the app renders it by walking
 * that list and mapping each `type` to a widget. Layout variation comes
 * entirely from the order and mix of blocks, so no announcement needs a screen
 * of its own.
 *
 * Adding a type here is only half the job — the Flutter renderer has to learn
 * it too, or it renders as nothing on phones that have not updated. See
 * `blocksToPlainText` for the fallback that keeps those phones readable.
 */

export type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; url: string; caption?: string }
  | { type: "video"; url: string }
  | { type: "button"; label: string; link: string };

export type BlockType = Block["type"];

export type BlockFieldSpec = {
  key: string;
  label: string;
  placeholder?: string;
  mono?: boolean;
  multiline?: boolean;
  required?: boolean;
};

export type BlockSpec = {
  type: BlockType;
  label: string;
  fields: BlockFieldSpec[];
  make: () => Block;
};

export const BLOCK_SPECS: BlockSpec[] = [
  {
    type: "heading",
    label: "제목",
    fields: [{ key: "text", label: "제목", required: true }],
    make: () => ({ type: "heading", text: "" }),
  },
  {
    type: "paragraph",
    label: "문단",
    fields: [
      { key: "text", label: "내용", multiline: true, required: true },
    ],
    make: () => ({ type: "paragraph", text: "" }),
  },
  {
    type: "image",
    label: "이미지",
    fields: [
      {
        key: "url",
        label: "이미지 주소",
        placeholder: "https://…/hero.png",
        mono: true,
        required: true,
      },
      { key: "caption", label: "설명 (선택)" },
    ],
    make: () => ({ type: "image", url: "", caption: "" }),
  },
  {
    type: "video",
    label: "동영상",
    fields: [
      {
        key: "url",
        label: "동영상 주소",
        placeholder: "https://…/intro.mp4",
        mono: true,
        required: true,
      },
    ],
    make: () => ({ type: "video", url: "" }),
  },
  {
    type: "button",
    label: "버튼",
    fields: [
      { key: "label", label: "버튼 글자", required: true },
      {
        key: "link",
        label: "이동할 곳",
        placeholder: "jigekun://jobs",
        mono: true,
        required: true,
      },
    ],
    make: () => ({ type: "button", label: "", link: "" }),
  },
];

export function specFor(type: string): BlockSpec | undefined {
  return BLOCK_SPECS.find((s) => s.type === type);
}

/** Blocks whose text should carry over into the plain-text fallback. */
const TEXT_BLOCKS = new Set<BlockType>(["heading", "paragraph"]);

/**
 * A readable plain-text rendition of the body.
 *
 * Written to `content` alongside `blocks` on every save, for three readers that
 * cannot understand blocks:
 *
 *  - app versions shipped before the block renderer, which still read `content`
 *  - the push notification body, which falls back to `content` when a notice
 *    has no `summary`
 *  - this dashboard's own table and its substring filter
 *
 * Images and buttons drop out, which is the intended degradation: an old phone
 * shows the words rather than nothing.
 */
export function blocksToPlainText(blocks: Block[]): string {
  return blocks
    .filter((b) => TEXT_BLOCKS.has(b.type))
    .map((b) => ("text" in b ? b.text.trim() : ""))
    .filter(Boolean)
    .join("\n\n");
}

export type BlockValidation =
  | { ok: true; blocks: Block[] }
  | { ok: false; error: string };

/**
 * Checks a parsed value really is a list of well-formed blocks.
 *
 * Runs on the server against whatever the form posted — the editor is a
 * convenience, not a guarantee.
 */
export function validateBlocks(value: unknown): BlockValidation {
  if (!Array.isArray(value)) {
    return { ok: false, error: "내용이 블록 목록이 아닙니다." };
  }
  if (value.length === 0) {
    return { ok: false, error: "블록을 하나 이상 추가해주세요." };
  }

  const blocks: Block[] = [];

  for (let i = 0; i < value.length; i++) {
    const raw = value[i];
    const at = `${i + 1}번째 블록`;

    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { ok: false, error: `${at}의 형식이 올바르지 않습니다.` };
    }

    const type = (raw as { type?: unknown }).type;
    if (typeof type !== "string") {
      return { ok: false, error: `${at}에 종류가 없습니다.` };
    }

    const spec = specFor(type);
    if (!spec) {
      return { ok: false, error: `${at}: 알 수 없는 종류입니다 (${type}).` };
    }

    // Only declared keys survive, so nothing extra reaches Firestore.
    const clean: Record<string, unknown> = { type };

    for (const field of spec.fields) {
      const v = (raw as Record<string, unknown>)[field.key];
      const text = typeof v === "string" ? v.trim() : "";

      if (field.required && !text) {
        return { ok: false, error: `${at}(${spec.label})의 ${field.label}을(를) 입력해주세요.` };
      }
      if (text) clean[field.key] = text;
    }

    blocks.push(clean as Block);
  }

  return { ok: true, blocks };
}
