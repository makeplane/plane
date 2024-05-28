import { IssueWidgetPlaceholder } from "src/ui/extensions/widgets/issue-embed-widget";

import { SlashCommand, DragAndDrop } from "@plane/editor-extensions";
import { UploadImage } from "@plane/editor-core";
import { CollaborationProvider } from "src/providers/collaboration-provider";
import Collaboration from "@tiptap/extension-collaboration";

type TArguments = {
  uploadFile: UploadImage;
  setHideDragHandle?: (hideDragHandlerFromDragDrop: () => void) => void;
  provider: CollaborationProvider;
};

export const DocumentEditorExtensions = ({ uploadFile, setHideDragHandle, provider }: TArguments) => [
  SlashCommand(uploadFile),
  DragAndDrop(setHideDragHandle),
  IssueWidgetPlaceholder(),
  Collaboration.configure({
    document: provider.document,
  }),
];
