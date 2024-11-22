import { Extension } from "@tiptap/core";
import { smoothCursorPlugin } from "./plugin";

export const SmoothCursorExtension = Extension.create({
  name: "smoothCursorExtension",
  addProseMirrorPlugins() {
    return [smoothCursorPlugin()];
  },
});
