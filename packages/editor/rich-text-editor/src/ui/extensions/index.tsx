import Placeholder from "@tiptap/extension-placeholder";

import SlashCommand from "./slash-command";
import { UploadImage } from "../";
import DragAndDrop from "./drag-drop";

export const RichTextEditorExtensions = (
  uploadFile: UploadImage,
  setIsSubmitting?: (
    isSubmitting: "submitting" | "submitted" | "saved",
  ) => void,
  dragDropEnabled?: boolean,
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
