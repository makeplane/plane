import { mergeAttributes } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { UploadImageExtensionStorage } from "@/extensions/custom-image";

export const CustomImageComponentWithoutProps = () =>
  Image.extend<{}, UploadImageExtensionStorage>({
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
      };
    },

    parseHTML() {
      return [
        {
          tag: "image-component",
        },
        {
          tag: "img",
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return ["image-component", mergeAttributes(HTMLAttributes)];
    },

    addStorage() {
      return {
        fileMap: new Map(),
      };
    },
  });

export default CustomImageComponentWithoutProps;
