import { mergeAttributes } from "@tiptap/core";
import { Image as BaseImageExtension } from "@tiptap/extension-image";
// local imports
import { ImageExtensionStorage } from "./extension";

export const CustomImageComponentWithoutProps = BaseImageExtension.extend<
  Record<string, unknown>,
  ImageExtensionStorage
>({
  name: "imageComponent",
  selectable: true,
  group: "block",
  atom: true,
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
      maxFileSize: 0,
    };
  },
});
