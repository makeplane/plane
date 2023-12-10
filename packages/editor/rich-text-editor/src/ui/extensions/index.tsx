import { SlashCommand } from "@plane/editor-extensions";
import Placeholder from "@tiptap/extension-placeholder";
import { DragAndDrop } from "@plane/editor-extensions";
import { UploadImage } from "@plane/editor-types";

export const RichTextEditorExtensions = (
  uploadFile: UploadImage,
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void,
  dragDropEnabled?: boolean
) => [
  SlashCommand(uploadFile, setIsSubmitting),
  dragDropEnabled === true && DragAndDrop,
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
