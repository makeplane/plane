import { Editor } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
// types
import { TFileHandler, TReadOnlyFileHandler } from "@/types";
// local imports
import { TrackFileDeletionPlugin } from "./delete";
import { TrackFileRestorationPlugin } from "./restore";

type TArgs = {
  editor: Editor;
  fileHandler: TFileHandler | TReadOnlyFileHandler;
  isEditable: boolean;
};

export const FilePlugins = (args: TArgs): Plugin[] => {
  const { editor, fileHandler, isEditable } = args;

  return [
    ...(isEditable && "delete" in fileHandler ? [TrackFileDeletionPlugin(editor, fileHandler.delete)] : []),
    TrackFileRestorationPlugin(editor, fileHandler.restore),
  ];
};
