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

export const insertBlockMath = ({ editor, range, latex }: { editor: Editor; range?: Range; latex: string }) => {
  if (range) editor.chain().focus().deleteRange(range).setBlockMath({ latex, pos: range.from }).run();
  else editor.chain().focus().setBlockMath({ latex }).run();
};

export const insertInlineMath = ({ editor, range, latex }: { editor: Editor; range?: Range; latex: string }) => {
  if (range) editor.chain().focus().deleteRange(range).setInlineMath({ latex, pos: range.from }).run();
  else editor.chain().focus().setInlineMath({ latex }).run();
};
