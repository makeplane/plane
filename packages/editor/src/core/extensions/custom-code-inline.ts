import { Extension } from "@tiptap/core";
import { codemark } from "@/extensions/code-mark";

export const CustomCodeMarkPlugin = Extension.create({
  name: "codemarkPlugin",
  addProseMirrorPlugins() {
    return codemark({ markType: this.editor.schema.marks.code });
  },
});
