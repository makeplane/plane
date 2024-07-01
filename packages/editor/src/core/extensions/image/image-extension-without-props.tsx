import ImageExt from "@tiptap/extension-image";

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
  });
