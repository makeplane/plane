import { UploadImage } from "@plane/editor-core";
import { DragAndDrop, SlashCommand } from "@plane/editor-extensions";

type TArguments = {
  uploadFile: UploadImage;
  dragDropEnabled?: boolean;
  setHideDragHandle?: (hideDragHandlerFromDragDrop: () => void) => void;
};

export const RichTextEditorExtensions = ({ uploadFile, dragDropEnabled, setHideDragHandle }: TArguments) => [
  SlashCommand(uploadFile),
  dragDropEnabled === true && DragAndDrop(setHideDragHandle),
];
