import { Extension } from "@tiptap/core";
import { DragHandlePlugin } from "./drag-handle-plugin";

export const DragAndDrop = Extension.create({
  name: "DragAndDrop",
  addProseMirrorPlugins() {
    return [DragHandlePlugin()];
  },
});
