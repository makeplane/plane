import ImageExt from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
// helpers
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// plugins
import { ImageExtensionStorage, TrackImageDeletionPlugin, TrackImageRestorationPlugin } from "@/plugins/image";
// types
import { TFileHandler } from "@/types";
// extensions
import { CustomImageNode } from "@/extensions";

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
        TrackImageDeletionPlugin(this.editor, deleteImageFn, this.name),
        TrackImageRestorationPlugin(this.editor, restoreImageFn, this.name),
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
