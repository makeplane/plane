import { mergeAttributes, Range } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { UploadImageExtensionStorage } from "../image-upload";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageBlock: {
      setImageBlock: (attributes: { src: string; width?: number; height?: number }) => ReturnType;
      setImageBlockAt: (attributes: {
        src: string;
        pos: number | Range;
        width?: number;
        height?: number;
      }) => ReturnType;
    };
  }
}

export const ImageBlockWithoutProps = () =>
  Image.extend<{}, UploadImageExtensionStorage>({
    name: "imageBlock",
    group: "inline",
    draggable: true,

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
        ["data-type"]: {
          default: this.name,
        },
        ["data-file"]: {
          default: null,
        },
        ["id"]: {
          default: null,
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: "image-block",
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return ["image-block", mergeAttributes(HTMLAttributes)];
    },

    addStorage() {
      return {
        fileMap: new Map(),
      };
    },
  }).configure({
    inline: true,
  });

export default ImageBlockWithoutProps;
