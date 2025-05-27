import { Image as BaseImageExtension } from "@tiptap/extension-image";

export const ImageExtensionWithoutProps = BaseImageExtension.extend({
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
});
