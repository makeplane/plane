import { Extension, Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
// constants
import { ACCEPTED_ATTACHMENT_MIME_TYPES, ACCEPTED_IMAGE_MIME_TYPES } from "@/constants/config";
// types
import { TEditorCommands } from "@/types";

export const DropHandlerExtension = Extension.create({
  name: "dropHandler",
  priority: 1000,

  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey("drop-handler-plugin"),
        props: {
          handlePaste: (view, event) => {
            if (
              editor.isEditable &&
              event.clipboardData &&
              event.clipboardData.files &&
              event.clipboardData.files.length > 0
            ) {
              event.preventDefault();
              const files = Array.from(event.clipboardData.files);
              const acceptedFiles = files.filter(
                (f) => ACCEPTED_IMAGE_MIME_TYPES.includes(f.type) || ACCEPTED_ATTACHMENT_MIME_TYPES.includes(f.type)
              );

              if (acceptedFiles.length) {
                const pos = view.state.selection.from;
                insertFilesSafely({
                  editor,
                  files: acceptedFiles,
                  initialPos: pos,
                  event: "drop",
                });
              }
              return true;
            }
            return false;
          },
          handleDrop: (view, event, _slice, moved) => {
            if (
              editor.isEditable &&
              !moved &&
              event.dataTransfer &&
              event.dataTransfer.files &&
              event.dataTransfer.files.length > 0
            ) {
              event.preventDefault();
              const files = Array.from(event.dataTransfer.files);
              const acceptedFiles = files.filter(
                (f) => ACCEPTED_IMAGE_MIME_TYPES.includes(f.type) || ACCEPTED_ATTACHMENT_MIME_TYPES.includes(f.type)
              );

              if (acceptedFiles.length) {
                const coordinates = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });

                if (coordinates) {
                  const pos = coordinates.pos;
                  insertFilesSafely({
                    editor,
                    files: acceptedFiles,
                    initialPos: pos,
                    event: "drop",
                  });
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

type InsertFilesSafelyArgs = {
  editor: Editor;
  event: "insert" | "drop";
  files: File[];
  initialPos: number;
  type?: Extract<TEditorCommands, "attachment" | "image">;
};

export const insertFilesSafely = async (args: InsertFilesSafelyArgs) => {
  const { editor, event, files, initialPos, type } = args;
  let pos = initialPos;

  for (const file of files) {
    // safe insertion
    const docSize = editor.state.doc.content.size;
    pos = Math.min(pos, docSize);

    let fileType: "image" | "attachment" | null = null;

    try {
      if (type) {
        if (["image", "attachment"].includes(type)) fileType = type;
        else throw new Error("Wrong file type passed");
      } else {
        if (ACCEPTED_IMAGE_MIME_TYPES.includes(file.type)) fileType = "image";
        else if (ACCEPTED_ATTACHMENT_MIME_TYPES.includes(file.type)) fileType = "attachment";
      }
      // insert file depending on the type at the current position
      if (fileType === "image") {
        editor.commands.insertImageComponent({
          file,
          pos,
          event,
        });
      } else if (fileType === "attachment") {
      }
    } catch (error) {
      console.error(`Error while ${event}ing file:`, error);
    }

    // Move to the next position
    pos += 1;
  }
};
