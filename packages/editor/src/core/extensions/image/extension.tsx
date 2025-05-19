import ImageExt from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
// extensions
import { CustomImageNode } from "@/extensions";
// helpers
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// plugins
import { TrackFileDeletionPlugin } from "@/plugins/file/delete";
import { TrackFileRestorationPlugin } from "@/plugins/file/restore";
// types
import { TFileHandler } from "@/types";

export type ImageExtensionStorage = {
  deletedImageSet: Map<string, boolean>;
  uploadInProgress: boolean;
};

export const ImageExtension = (fileHandler: TFileHandler) => {
  const {
    getAssetSrc,
    delete: deleteImageFn,
    restore: restoreImageFn,
    validation: { maxFileSize },
  } = fileHandler;

  return ImageExt.extend<any, ImageExtensionStorage>({
    addKeyboardShortcuts() {
      return {
        ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
        ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
      };
    },

    addProseMirrorPlugins() {
      return [
        TrackFileDeletionPlugin(this.editor, deleteImageFn, this.name, "deletedImageSet"),
        TrackFileRestorationPlugin(this.editor, restoreImageFn, this.name, "deletedImageSet"),
      ];
    },

    onCreate(this) {
      const imageSources = new Set<string>();
      this.editor.state.doc.descendants((node) => {
        if (node.type.name === this.name) {
          if (!node.attrs.src?.startsWith("http")) return;

          imageSources.add(node.attrs.src);
        }
      });
      imageSources.forEach(async (src) => {
        try {
          await restoreImageFn(src);
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
        maxFileSize,
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
        aspectRatio: {
          default: null,
        },
      };
    },

    addCommands() {
      return {
        getImageSource: (path: string) => async () => await getAssetSrc(path),
      };
    },

    // render custom image node
    addNodeView() {
      return ReactNodeViewRenderer(CustomImageNode);
    },
  });
};
