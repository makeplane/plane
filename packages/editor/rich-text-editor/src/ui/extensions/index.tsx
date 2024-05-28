import { UploadImage } from "@plane/editor-core";
import { DragAndDrop, SlashCommand } from "@plane/editor-extensions";
import { EnterKeyExtension } from "./enter-key-extension";

type TArguments = {
  uploadFile: UploadImage;
  dragDropEnabled?: boolean;
  setHideDragHandle?: (hideDragHandlerFromDragDrop: () => void) => void;
  onEnterKeyPress?: () => void;
};

export const RichTextEditorExtensions = ({
  uploadFile,
  dragDropEnabled,
  setHideDragHandle,
  onEnterKeyPress,
}: TArguments) => [
  SlashCommand(uploadFile),
  dragDropEnabled === true && DragAndDrop(setHideDragHandle),
  EnterKeyExtension(onEnterKeyPress),
];
