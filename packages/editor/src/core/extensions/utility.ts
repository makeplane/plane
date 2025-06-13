import { Extension } from "@tiptap/core";
import codemark from "prosemirror-codemark";
// helpers
import { restorePublicImages } from "@/helpers/image-helpers";
// plugins
import { DropHandlerPlugin } from "@/plugins/drop";
import { FilePlugins } from "@/plugins/file/root";
import { MarkdownClipboardPlugin } from "@/plugins/markdown-clipboard";
// types
import { TEditorAsset, TExtensions, TFileHandler, TReadOnlyFileHandler } from "@/types";

declare module "@tiptap/core" {
  interface Commands {
    utility: {
      updateAssetsUploadStatus: (updatedStatus: TFileHandler["assetsUploadStatus"]) => () => void;
      updateAssetsList: (
        args:
          | {
              asset: TEditorAsset;
            }
          | {
              idToRemove: string;
            }
      ) => () => void;
    };
  }
}

export interface UtilityExtensionStorage {
  assetsList: TEditorAsset[];
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
        assetsList: [],
        assetsUploadStatus: isEditable && "assetsUploadStatus" in fileHandler ? fileHandler.assetsUploadStatus : {},
        uploadInProgress: false,
      };
    },

    addCommands() {
      return {
        updateAssetsUploadStatus: (updatedStatus) => () => {
          this.storage.assetsUploadStatus = updatedStatus;
        },
        updateAssetsList: (args) => () => {
          const uniqueAssets = new Set(this.storage.assetsList);
          if ("asset" in args) {
            const alreadyExists = this.storage.assetsList.find((asset) => asset.id === args.asset.id);
            if (!alreadyExists) {
              uniqueAssets.add(args.asset);
            }
          } else if ("idToRemove" in args) {
            const asset = this.storage.assetsList.find((asset) => asset.id === args.idToRemove);
            if (asset) {
              uniqueAssets.delete(asset);
            }
          }
          this.storage.assetsList = Array.from(uniqueAssets);
        },
      };
    },
  });
};
