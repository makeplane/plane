import { UploadImage } from "@plane/editor-core";
import { DragAndDrop, SlashCommandDocumentEditor } from "@plane/editor-extensions";
import Placeholder from "@tiptap/extension-placeholder";

export const RichTextEditorExtensions = (
  uploadFile: UploadImage,
  dragDropEnabled?: boolean,
  setHideDragHandle?: (hideDragHandlerFromDragDrop: () => void) => void
) => [
  SlashCommandDocumentEditor(uploadFile),
  dragDropEnabled === true && DragAndDrop(setHideDragHandle),
  Placeholder.configure({
    placeholder: ({ editor, node }) => {
      if (node.type.name === "heading") {
        return `Heading ${node.attrs.level}`;
      }

      if (editor.isActive("table") || editor.isActive("codeBlock") || editor.isActive("image")) {
        return "";
      }

      return "Press '/' for commands...";
    },
    includeChildren: true,
  }),
];
