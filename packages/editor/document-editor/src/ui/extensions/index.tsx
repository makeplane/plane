import Placeholder from "@tiptap/extension-placeholder";
import { IssueWidgetPlaceholder } from "src/ui/extensions/widgets/issue-embed-widget";

import { SlashCommand, DragAndDrop } from "@plane/editor-extensions";
import { UploadImage } from "@plane/editor-core";

export const DocumentEditorExtensions = (
  uploadFile: UploadImage,
  setHideDragHandle?: (hideDragHandlerFromDragDrop: () => void) => void
) => [
  SlashCommand(uploadFile),
  DragAndDrop(setHideDragHandle),
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
  IssueWidgetPlaceholder(),
];
