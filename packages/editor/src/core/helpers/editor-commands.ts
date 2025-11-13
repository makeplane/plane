import type { Editor, Range } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// extensions
import { replaceCodeWithText } from "@/extensions/code/utils/replace-code-block-with-text";
import type { InsertImageComponentProps } from "@/extensions/custom-image/types";
// helpers
import type { ExtendedEmojiStorage } from "@/extensions/emoji/emoji";
import { findTableAncestor } from "@/helpers/common";

export const setText = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).setNode(CORE_EXTENSIONS.PARAGRAPH).run();
  else editor.chain().focus().setNode(CORE_EXTENSIONS.PARAGRAPH).run();
};

export const toggleHeading = (editor: Editor, level: 1 | 2 | 3 | 4 | 5 | 6, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).setNode(CORE_EXTENSIONS.HEADING, { level }).run();
  else editor.chain().focus().toggleHeading({ level }).run();
};

export const toggleBold = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).toggleBold().run();
  else editor.chain().focus().toggleBold().run();
};

export const toggleItalic = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).toggleItalic().run();
  else editor.chain().focus().toggleItalic().run();
};

export const toggleUnderline = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).toggleUnderline().run();
  else editor.chain().focus().toggleUnderline().run();
};

export const toggleCodeBlock = (editor: Editor, range?: Range) => {
  try {
    // if it's a code block, replace it with the code with paragraphs
    if (editor.isActive(CORE_EXTENSIONS.CODE_BLOCK)) {
      replaceCodeWithText(editor);
      return;
    }

    const { from, to } = range || editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, "\n");
    const isMultiline = text.includes("\n");

    // if the selection is not a range i.e. empty, then simply convert it into a codeBlock
    if (editor.state.selection.empty) {
      editor.chain().focus().toggleCodeBlock().run();
    } else if (isMultiline) {
      // if the selection is multiline, then also replace the text content with
      // a codeBlock
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, `\`\`\`\n${text}\n\`\`\``).run();
    } else {
      // if the selection is single line, then simply convert it into inline
      // code
      editor.chain().focus().toggleCode().run();
    }
  } catch (error) {
    console.error("An error occurred while toggling code block:", error);
  }
};

export const toggleOrderedList = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).toggleOrderedList().run();
  else editor.chain().focus().toggleOrderedList().run();
};

export const toggleBulletList = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).toggleBulletList().run();
  else editor.chain().focus().toggleBulletList().run();
};

export const toggleTaskList = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).toggleTaskList().run();
  else editor.chain().focus().toggleTaskList().run();
};

export const toggleStrike = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).toggleStrike().run();
  else editor.chain().focus().toggleStrike().run();
};

export const toggleBlockquote = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).toggleBlockquote().run();
  else editor.chain().focus().toggleBlockquote().run();
};

export const insertTableCommand = (editor: Editor, range?: Range) => {
  if (typeof window !== "undefined") {
    const selection = window.getSelection();
    if (selection) {
      if (selection.rangeCount !== 0) {
        const range = selection.getRangeAt(0);
        if (findTableAncestor(range.startContainer)) {
          return;
        }
      }
    }
  }
  if (range) editor.chain().focus().deleteRange(range).clearNodes().insertTable({ rows: 3, cols: 3 }).run();
  else editor.chain().focus().clearNodes().insertTable({ rows: 3, cols: 3 }).run();
};

export const insertImage = ({
  editor,
  event,
  pos,
  file,
  range,
}: {
  editor: Editor;
  event: "insert" | "drop";
  pos?: number | null;
  file?: File;
  range?: Range;
}) => {
  if (range) editor.chain().focus().deleteRange(range).run();

  const imageOptions: InsertImageComponentProps = { event };
  if (pos) imageOptions.pos = pos;
  if (file) imageOptions.file = file;
  return editor?.chain().focus().insertImageComponent(imageOptions).run();
};

export const unsetLinkEditor = (editor: Editor) => {
  editor.chain().focus().unsetLink().run();
};

export const setLinkEditor = (editor: Editor, url: string, text?: string) => {
  const { selection } = editor.state;
  const previousSelection = { from: selection.from, to: selection.to };
  if (text) {
    editor
      .chain()
      .focus()
      .deleteRange({ from: selection.from, to: selection.to })
      .insertContentAt(previousSelection.from, text)
      .run();
    // Extracting the new selection start point.
    const previousFrom = previousSelection.from;

    editor.commands.setTextSelection({ from: previousFrom, to: previousFrom + text.length });
  }
  editor.chain().focus().setLink({ href: url }).run();
};

export const toggleTextColor = (color: string | undefined, editor: Editor, range?: Range) => {
  if (color) {
    if (range) editor.chain().focus().deleteRange(range).setTextColor(color).run();
    else editor.chain().focus().setTextColor(color).run();
  } else {
    if (range) editor.chain().focus().deleteRange(range).unsetTextColor().run();
    else editor.chain().focus().unsetTextColor().run();
  }
};

export const toggleBackgroundColor = (color: string | undefined, editor: Editor, range?: Range) => {
  if (color) {
    if (range) {
      editor.chain().focus().deleteRange(range).setBackgroundColor(color).run();
    } else {
      editor.chain().focus().setBackgroundColor(color).run();
    }
  } else {
    if (range) {
      editor.chain().focus().deleteRange(range).unsetBackgroundColor().run();
    } else {
      editor.chain().focus().unsetBackgroundColor().run();
    }
  }
};

export const setTextAlign = (alignment: string, editor: Editor) => {
  editor.chain().focus().setTextAlign(alignment).run();
};

export const insertHorizontalRule = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).setHorizontalRule().run();
  else editor.chain().focus().setHorizontalRule().run();
};

export const insertCallout = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).insertCallout().run();
  else editor.chain().focus().insertCallout().run();
};

export const openEmojiPicker = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).run();
  const emojiStorage = editor.storage.emoji as ExtendedEmojiStorage;
  emojiStorage.forceOpen = true;
  editor.chain().focus().insertContent(":").run();
};
