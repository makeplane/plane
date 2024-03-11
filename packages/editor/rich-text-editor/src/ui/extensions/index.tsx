import { UploadImage } from "@plane/editor-core";
import { DragAndDrop, SlashCommand } from "@plane/editor-extensions";
import Placeholder from "@tiptap/extension-placeholder";

export const RichTextEditorExtensions = (
  uploadFile: UploadImage,
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void,
  dragDropEnabled?: boolean,
  setHideDragHandle?: (hideDragHandlerFromDragDrop: () => void) => void
) => [
  SlashCommand(uploadFile, setIsSubmitting),
  dragDropEnabled === true && DragAndDrop(setHideDragHandle),
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") {
        return `Heading ${node.attrs.level}`;
      }
      if (node.type.name === "image" || node.type.name === "table") {
        return "";
      }
      if (node.type.name === "codeBlock") {
        return "Type in your code here...";
      }
      return "Press '/' for commands...";
    },
    includeChildren: true,
  }),
];
