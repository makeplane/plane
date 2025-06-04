import { Extension } from "@tiptap/core";
// helpers
import { restorePublicImages } from "@/helpers/image-helpers";
// plugins
import { DropHandlerPlugin } from "@/plugins/drop";
import { FilePlugins } from "@/plugins/file/root";
import { MarkdownClipboardPlugin } from "@/plugins/markdown-clipboard";
// types
import { TExtensions, TFileHandler, TReadOnlyFileHandler } from "@/types";
// prosemirror plugins
import { codemark } from "./code-mark";

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

type Props = {
  disabledExtensions: TExtensions[];
  fileHandler: TFileHandler | TReadOnlyFileHandler;
  isEditable: boolean;
};

export const UtilityExtension = (props: Props) => {
  const { disabledExtensions, fileHandler, isEditable } = props;
  const { restore } = fileHandler;

  return Extension.create<Record<string, unknown>, UtilityExtensionStorage>({
    name: "utility",
    priority: 1000,

    addProseMirrorPlugins() {
      return [
        ...FilePlugins({
          editor: this.editor,
          isEditable,
          fileHandler,
        }),
        ...codemark({ markType: this.editor.schema.marks.code }),
        MarkdownClipboardPlugin(this.editor),
        DropHandlerPlugin({
          disabledExtensions,
          editor: this.editor,
        }),
      ];
    },

    onCreate() {
      restorePublicImages(this.editor, restore);
    },

    addStorage() {
      return {
        assetsUploadStatus: isEditable && "assetsUploadStatus" in fileHandler ? fileHandler.assetsUploadStatus : {},
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
