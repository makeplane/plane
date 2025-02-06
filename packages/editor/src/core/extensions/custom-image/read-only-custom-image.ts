import { mergeAttributes } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
// components
import { CustomImageExtensionStorage, CustomImageNode } from "@/extensions/custom-image";
// types
import { TFileHandler } from "@/types";

export const CustomReadOnlyImageExtension = (props: Pick<TFileHandler, "getAssetSrc">) => {
  const { getAssetSrc } = props;

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
      };
    },

    addCommands() {
      return {
        getImageSource: (path: string) => async () => await getAssetSrc(path),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(CustomImageNode);
    },
  });
};
