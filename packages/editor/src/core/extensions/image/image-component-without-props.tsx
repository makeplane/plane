import { mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Image } from "@tiptap/extension-image";
// extensions
import { CustomImageNode, UploadImageExtensionStorage } from "@/extensions";

export const CustomImageComponentWithoutProps = () =>
  Image.extend<Record<string, unknown>, UploadImageExtensionStorage>({
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
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return ["image-component", mergeAttributes(HTMLAttributes)];
    },

    addStorage() {
      return {
        fileMap: new Map(),
        deletedImageSet: new Map<string, boolean>(),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(CustomImageNode);
    },
  });

export default CustomImageComponentWithoutProps;
