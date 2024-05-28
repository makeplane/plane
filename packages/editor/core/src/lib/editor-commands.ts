import { Editor, Range } from "@tiptap/core";
import { startImageUpload } from "src/ui/plugins/upload-image";
import { findTableAncestor } from "src/lib/utils";
import { Selection } from "@tiptap/pm/state";
import { UploadImage } from "src/types/upload-image";

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

const replaceCodeBlockWithContent = (editor: Editor) => {
  try {
    const { schema } = editor.state;
    const { paragraph } = schema.nodes;
    let replaced = false;

    const replaceCodeBlock = (from: number, to: number, textContent: string) => {
      const docSize = editor.state.doc.content.size;

      if (from < 0 || to > docSize || from > to) {
        console.error("Invalid range for replacement: ", from, to, "in a document of size", docSize);
        return;
      }

      // split the textContent by new lines to handle each line as a separate paragraph
      const lines = textContent.split(/\r?\n/);

      const tr = editor.state.tr;

      // Calculate the position for inserting the first paragraph
      let insertPos = from;

      // Remove the code block first
      tr.delete(from, to);

      // For each line, create a paragraph node and insert it
      lines.forEach((line) => {
        const paragraphNode = paragraph.create({}, schema.text(line));
        tr.insert(insertPos, paragraphNode);
        // Update insertPos for the next insertion
        insertPos += paragraphNode.nodeSize;
      });

      // Dispatch the transaction
      editor.view.dispatch(tr);
      replaced = true;
    };

    editor.state.doc.nodesBetween(editor.state.selection.from, editor.state.selection.to, (node, pos) => {
      if (node.type === schema.nodes.codeBlock) {
        const startPos = pos;
        const endPos = pos + node.nodeSize;
        const textContent = node.textContent;
        if (textContent.length === 0) {
          editor.chain().focus().toggleCodeBlock().run();
        }
        replaceCodeBlock(startPos, endPos, textContent);
        return false;
      }
    });

    if (!replaced) {
      console.log("No code block to replace.");
    }
  } catch (error) {
    console.error("An error occurred while replacing code block content:", error);
  }
};

export const toggleCodeBlock = (editor: Editor, range?: Range) => {
  try {
    if (editor.isActive("codeBlock")) {
      replaceCodeBlockWithContent(editor);
      return;
    }

    const { from, to } = range || editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, "\n");
    const isMultiline = text.includes("\n");

    if (editor.state.selection.empty) {
      editor.chain().focus().toggleCodeBlock().run();
    } else if (isMultiline) {
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, `\`\`\`\n${text}\n\`\`\``).run();
    } else {
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
  input.accept = "image/*";
  input.onchange = async () => {
    if (input.files?.length) {
      const file = input.files[0];
      const pos = savedSelection?.anchor ?? editor.view.state.selection.from;
      startImageUpload(editor, file, editor.view, pos, uploadFile);
    }
  };
  input.click();
};
