import Image from "@tiptap/extension-image";

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
});
