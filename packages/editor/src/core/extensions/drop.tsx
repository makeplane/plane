import { Extension, Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";

export const DropHandlerExtension = () =>
  Extension.create({
    name: "dropHandler",
    priority: 1000,

    addProseMirrorPlugins() {
      const editor = this.editor;
      return [
        new Plugin({
          key: new PluginKey("drop-handler-plugin"),
          props: {
            handlePaste: (view: EditorView, event: ClipboardEvent) => {
              if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length > 0) {
                event.preventDefault();
                const files = Array.from(event.clipboardData.files);
                const imageFiles = files.filter((file) => file.type.startsWith("image"));

                if (imageFiles.length > 0) {
                  const pos = view.state.selection.from;
                  insertImagesSafely({ editor, files: imageFiles, initialPos: pos, event: "drop" });
                }
                return true;
              }
              return false;
            },
            handleDrop: (view: EditorView, event: DragEvent, _slice: any, moved: boolean) => {
              if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                event.preventDefault();
                const files = Array.from(event.dataTransfer.files);
                const imageFiles = files.filter((file) => file.type.startsWith("image"));

                if (imageFiles.length > 0) {
                  const coordinates = view.posAtCoords({
                    left: event.clientX,
                    top: event.clientY,
                  });

                  if (coordinates) {
                    const pos = coordinates.pos;
                    insertImagesSafely({ editor, files: imageFiles, initialPos: pos, event: "drop" });
                  }
                  return true;
                }
              }
              return false;
            },
          },
        }),
      ];
    },
  });

export const insertImagesSafely = async ({
  editor,
  files,
  initialPos,
  event,
}: {
  editor: Editor;
  files: File[];
  initialPos: number;
  event: "insert" | "drop";
}) => {
  let pos = initialPos;

  for (const file of files) {
    // safe insertion
    const docSize = editor.state.doc.content.size;
    pos = Math.min(pos, docSize);

    try {
      // Insert the image at the current position
      editor.commands.insertImageComponent({ file, pos, event });
    } catch (error) {
      console.error(`Error while ${event}ing image:`, error);
    }

    // Move to the next position
    pos += 1;
  }
};
