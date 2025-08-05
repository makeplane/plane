import { Editor, Range } from "@tiptap/core";
// plane editor extensions
import { type InsertAttachmentComponentProps } from "@/plane-editor/extensions/attachments/types";

export const insertAttachment = ({
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

  const attachmentOptions: InsertAttachmentComponentProps = { event };
  if (pos) attachmentOptions.pos = pos;
  if (file) attachmentOptions.file = file;
  return editor?.chain().focus().insertAttachmentComponent(attachmentOptions).run();
};

export const insertBlockMath = ({ editor, range }: { editor: Editor; range: Range }) =>
  editor.chain().focus().deleteRange(range).setBlockMath({ latex: "", pos: range.from }).run();

export const insertInlineMath = ({ editor, range }: { editor: Editor; range: Range }) =>
  editor.chain().focus().deleteRange(range).setInlineMath({ latex: "", pos: range.from }).run();
