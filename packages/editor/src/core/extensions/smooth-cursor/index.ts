import { Extension } from "@tiptap/core";
import { smoothCursorPlugin } from "./plugin";

export const SmoothCursorExtension = Extension.create({
  name: "smoothCursorExtension",
  addProseMirrorPlugins() {
    const isEditable = this.editor ? this.editor.isEditable : true;
    return [smoothCursorPlugin({ isEditable })];
  },
});
