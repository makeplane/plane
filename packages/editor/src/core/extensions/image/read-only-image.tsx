import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
// extensions
import { CustomImageNode } from "@/extensions";

export const ReadOnlyImageExtension = Image.extend({
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
