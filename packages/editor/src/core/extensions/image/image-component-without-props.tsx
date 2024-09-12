import { mergeAttributes } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { UploadImageExtensionStorage } from "../image-upload";

export const CustomImageComponentWithoutProps = () =>
  Image.extend<{}, UploadImageExtensionStorage>({
    name: "imageComponent",
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
      };
    },
  }).configure({
    inline: true,
  });

export default CustomImageComponentWithoutProps;
