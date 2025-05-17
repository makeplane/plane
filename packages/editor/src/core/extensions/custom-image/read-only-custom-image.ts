import { mergeAttributes } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
// components
import { CustomImageNode, CustomImageExtensionStorage } from "@/extensions/custom-image";
// types
import { TReadOnlyFileHandler } from "@/types";

export const CustomReadOnlyImageExtension = (props: TReadOnlyFileHandler) => {
  const { getAssetSrc, restore: restoreImageFn } = props;

  return Image.extend<Record<string, unknown>, CustomImageExtensionStorage>({
    name: "imageComponent",
    selectable: false,
    group: "block",
    atom: true,
    draggable: false,

    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: "35%",
        },
        src: {
          default: null,
        },
        height: {
          default: "auto",
        },
        ["id"]: {
          default: null,
        },
        aspectRatio: {
          default: null,
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: "image-component",
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return ["image-component", mergeAttributes(HTMLAttributes)];
    },

    addStorage() {
      return {
        fileMap: new Map(),
        deletedImageSet: new Map<string, boolean>(),
        uploadInProgress: false,
        maxFileSize: 0,
        // escape markdown for images
        markdown: {
          serialize() {},
        },
        assetsUploadStatus: {},
      };
    },

    addCommands() {
      return {
        getImageSource: (path: string) => async () => await getAssetSrc(path),
        restoreImage: (src) => async () => {
          await restoreImageFn(src);
        },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(CustomImageNode);
    },
  });
};
