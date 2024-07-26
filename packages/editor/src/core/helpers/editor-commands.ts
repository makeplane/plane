import { Editor, Range } from "@tiptap/core";
import { Selection } from "@tiptap/pm/state";
// extensions
import { replaceCodeWithText } from "@/extensions/code/utils/replace-code-block-with-text";
// helpers
import { findTableAncestor } from "@/helpers/common";
// plugins
import { startImageUpload } from "@/plugins/image";
// types
import { UploadImage } from "@/types";

export const setText = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).clearNodes().run();
  else editor.chain().focus().clearNodes().run();
};

export const toggleHeadingOne = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
  else editor.chain().focus().toggleHeading({ level: 1 }).run();
};

export const toggleHeadingTwo = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
  else editor.chain().focus().toggleHeading({ level: 2 }).run();
};

export const toggleHeadingThree = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
  else editor.chain().focus().toggleHeading({ level: 3 }).run();
};

export const toggleHeadingFour = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).setNode("heading", { level: 4 }).run();
  else editor.chain().focus().toggleHeading({ level: 4 }).run();
};

export const toggleHeadingFive = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).setNode("heading", { level: 5 }).run();
  else editor.chain().focus().toggleHeading({ level: 5 }).run();
};

export const toggleHeadingSix = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).setNode("heading", { level: 6 }).run();
  else editor.chain().focus().toggleHeading({ level: 6 }).run();
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
    if (editor.isActive("codeBlock")) {
      replaceCodeWithText(editor);
      return;
    }

    const { from, to } = range || editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, "\n");
    const isMultiline = text.includes("\n");

    // if the selection is not a range i.e. empty, then simply convert it into a code block
    if (editor.state.selection.empty) {
      editor.chain().focus().toggleCodeBlock().run();
    } else if (isMultiline) {
      // if the selection is multiline, then also replace the text content with
      // a code block
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

export const unsetLinkEditor = (editor: Editor) => {
  editor.chain().focus().unsetLink().run();
};

export const setLinkEditor = (editor: Editor, url: string) => {
  editor.chain().focus().setLink({ href: url }).run();
};

export const insertImageCommand = (
  editor: Editor,
  uploadFile: UploadImage,
  savedSelection?: Selection | null,
  range?: Range
) => {
  if (range) editor.chain().focus().deleteRange(range).run();
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".jpeg, .jpg, .png, .webp, .svg";
  input.onchange = async () => {
    if (input.files?.length) {
      const file = input.files[0];
      const pos = savedSelection?.anchor ?? editor.view.state.selection.from;
      startImageUpload(editor, file, editor.view, pos, uploadFile);
    }
  };
  input.click();
};
