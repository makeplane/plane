import Placeholder from "@tiptap/extension-placeholder";
import { SlashCommand } from "@plane/editor-extensions";

import { UploadImage } from "@plane/editor-types";
import { DragAndDrop } from "@plane/editor-extensions";

export const DocumentEditorExtensions = (
  uploadFile: UploadImage,
  setIsSubmitting?: (
    isSubmitting: "submitting" | "submitted" | "saved",
  ) => void,
) => [
  SlashCommand(uploadFile, setIsSubmitting),
  DragAndDrop,
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") {
        return `Heading ${node.attrs.level}`;
      }
      if (node.type.name === "image" || node.type.name === "table") {
        return "";
      }

      return "Press '/' for commands...";
    },
    includeChildren: true,
  }),
];
