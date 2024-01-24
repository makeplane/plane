import { Editor, Range } from "@tiptap/core";
import { startImageUpload } from "src/ui/plugins/upload-image";
import { findTableAncestor } from "src/lib/utils";
import { UploadImage } from "src/types/upload-image";

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
  // Check if code block is active then toggle code block
  if (editor.isActive("codeBlock")) {
    if (range) {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      return;
    }
    editor.chain().focus().toggleCodeBlock().run();
    return;
  }

  // Check if user hasn't selected any text
  const isSelectionEmpty = editor.state.selection.empty;

  if (isSelectionEmpty) {
    if (range) {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      return;
    }
    editor.chain().focus().toggleCodeBlock().run();
  } else {
    if (range) {
      editor.chain().focus().deleteRange(range).toggleCode().run();
      return;
    }
    editor.chain().focus().toggleCode().run();
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
    const selection: any = window?.getSelection();
    if (selection.rangeCount !== 0) {
      const range = selection.getRangeAt(0);
      if (findTableAncestor(range.startContainer)) {
        return;
      }
    }
  }
  if (range) editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  else editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
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
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void,
  range?: Range
) => {
  if (range) editor.chain().focus().deleteRange(range).run();
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async () => {
    if (input.files?.length) {
      const file = input.files[0];
      const pos = editor.view.state.selection.from;
      startImageUpload(file, editor.view, pos, uploadFile, setIsSubmitting);
    }
  };
  input.click();
};
