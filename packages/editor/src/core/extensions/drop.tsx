import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
// plugins
import { startImageUpload } from "@/plugins/image";
// types
import { UploadImage } from "@/types";

export const DropHandlerExtension = (uploadFile: UploadImage) =>
  Extension.create({
    name: "dropHandler",
    priority: 1000,

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey("drop-handler-plugin"),
          props: {
            handlePaste: (view, event) => {
              if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
                event.preventDefault();
                const file = event.clipboardData.files[0];
                const pos = view.state.selection.from;
                startImageUpload(this.editor, file, view, pos, uploadFile);
                return true;
              }
              return false;
            },
            handleDrop: (view, event, _slice, moved) => {
              if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                const coordinates = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });
                if (coordinates) {
                  startImageUpload(this.editor, file, view, coordinates.pos - 1, uploadFile);
                }
                return true;
              }
              return false;
            },
          },
        }),
      ];
    },
  });
