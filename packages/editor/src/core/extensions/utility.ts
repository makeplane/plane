import { Extension } from "@tiptap/core";
import codemark from "prosemirror-codemark";
// plugins
import { TrackFileDeletionPlugin } from "@/plugins/file/delete";
import { TrackFileRestorationPlugin } from "@/plugins/file/restore";
// types
import { TFileHandler } from "@/types";

declare module "@tiptap/core" {
  interface Commands {
    utility: {
      updateAssetsUploadStatus: (updatedStatus: TFileHandler["assetsUploadStatus"]) => () => void;
    };
  }
}

export interface UtilityExtensionStorage {
  assetsUploadStatus: TFileHandler["assetsUploadStatus"];
  uploadInProgress: boolean;
}

export const UtilityExtension = (props: TFileHandler) => {
  const { assetsUploadStatus, delete: deleteFileHandler, restore: restoreFileHandler } = props;

  return Extension.create<Record<string, unknown>, UtilityExtensionStorage>({
    name: "utility",

    addProseMirrorPlugins() {
      return [
        TrackFileDeletionPlugin(this.editor, deleteFileHandler),
        TrackFileRestorationPlugin(this.editor, restoreFileHandler),
        ...codemark({ markType: this.editor.schema.marks.code }),
      ];
    },

    addStorage() {
      return {
        assetsUploadStatus,
        uploadInProgress: false,
      };
    },

    addCommands() {
      return {
        updateAssetsUploadStatus: (updatedStatus) => () => {
          this.storage.assetsUploadStatus = updatedStatus;
        },
      };
    },
  });
};
