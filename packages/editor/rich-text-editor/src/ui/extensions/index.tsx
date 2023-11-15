import Placeholder from "@tiptap/extension-placeholder";

import SlashCommand from "./slash-command";
import { UploadImage } from "../";

export const RichTextEditorExtensions = (
  uploadFile: UploadImage,
  setIsSubmitting?: (
    isSubmitting: "submitting" | "submitted" | "saved",
  ) => void,
) => [
  SlashCommand(uploadFile, setIsSubmitting),
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
