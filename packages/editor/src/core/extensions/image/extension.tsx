import ImageExt from "@tiptap/extension-image";
// plugins
import {
  IMAGE_NODE_TYPE,
  ImageExtensionStorage,
  TrackImageDeletionPlugin,
  TrackImageRestorationPlugin,
  UploadImagesPlugin,
} from "@/plugins/image";
// types
import { DeleteImage, RestoreImage } from "@/types";
// helpers
import { insertLineAboveImageAction } from "./utilities/insert-line-above-image";
import { insertLineBelowImageAction } from "./utilities/insert-line-below-image";

export const ImageExtension = (deleteImage: DeleteImage, restoreImage: RestoreImage, cancelUploadImage?: () => void) =>
  ImageExt.extend<any, ImageExtensionStorage>({
    addKeyboardShortcuts() {
      return {
        ArrowDown: insertLineBelowImageAction,
        ArrowUp: insertLineAboveImageAction,
      };
    },
    addProseMirrorPlugins() {
      return [
        UploadImagesPlugin(this.editor, cancelUploadImage),
        TrackImageDeletionPlugin(this.editor, deleteImage),
        TrackImageRestorationPlugin(this.editor, restoreImage),
      ];
    },

    onCreate(this) {
      const imageSources = new Set<string>();
      this.editor.state.doc.descendants((node) => {
        if (node.type.name === IMAGE_NODE_TYPE) {
          imageSources.add(node.attrs.src);
        }
      });
      imageSources.forEach(async (src) => {
        try {
          const assetUrlWithWorkspaceId = new URL(src).pathname.substring(1);
          await restoreImage(assetUrlWithWorkspaceId);
        } catch (error) {
          console.error("Error restoring image: ", error);
        }
      });
    },

    // storage to keep track of image states Map<src, isDeleted>
    addStorage() {
      return {
        deletedImageSet: new Map<string, boolean>(),
        uploadInProgress: false,
      };
    },

    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: "35%",
        },
        height: {
          default: null,
        },
      };
    },
  });
