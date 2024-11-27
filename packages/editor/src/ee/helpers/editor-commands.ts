import { Editor, Range } from "@tiptap/core";

export const insertCallout = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).insertCallout().run();
  else editor.chain().focus().insertCallout().run();
};
