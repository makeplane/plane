import { UploadImage } from "@plane/editor-core";
import { DragAndDrop, SlashCommand } from "@plane/editor-extensions";
import { CollaborationProvider } from "src/providers/collaboration-provider";
import Collaboration from "@tiptap/extension-collaboration";

type TArguments = {
  uploadFile: UploadImage;
  dragDropEnabled?: boolean;
  setHideDragHandle?: (hideDragHandlerFromDragDrop: () => void) => void;
  onEnterKeyPress?: () => void;
  provider: CollaborationProvider;
};

export const RichTextEditorExtensions = ({ uploadFile, dragDropEnabled, setHideDragHandle, provider }: TArguments) => [
  SlashCommand(uploadFile),
  dragDropEnabled === true && DragAndDrop(setHideDragHandle),
  // TODO; add the extension conditionally for forms that don't require it
  // EnterKeyExtension(onEnterKeyPress),
  Collaboration.configure({
    document: provider.document,
  }),
];
