import ImageExt from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
// extensions
import { CustomImageNode } from "@/extensions";

export const ImageExtensionWithoutProps = () =>
  ImageExt.extend({
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

    addNodeView() {
      return ReactNodeViewRenderer(CustomImageNode);
    },
  });
