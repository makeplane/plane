import { IssueWidgetPlaceholder } from "src/ui/extensions/widgets/issue-embed-widget";

import { SlashCommand, DragAndDrop } from "@plane/editor-extensions";
import { UploadImage } from "@plane/editor-core";

type TArguments = {
  uploadFile: UploadImage;
  setHideDragHandle?: (hideDragHandlerFromDragDrop: () => void) => void;
};

export const DocumentEditorExtensions = ({ uploadFile, setHideDragHandle }: TArguments) => [
  SlashCommand(uploadFile),
  DragAndDrop(setHideDragHandle),
  IssueWidgetPlaceholder(),
];
