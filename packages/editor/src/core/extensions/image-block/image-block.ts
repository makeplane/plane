import { mergeAttributes, Range } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { ImageBlockView } from "./components/image-block-view";

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

export const ImageBlock = Image.extend({
  name: "imageBlock",
  group: "inline",
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "35%",
      },
      height: {
        default: "auto",
      },
    };
  },

  addCommands() {
    return {
      setImageBlock:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { src: attrs.src },
          }),
      setImageBlockAt:
        (attrs) =>
        ({ commands }) =>
          commands.insertContentAt(attrs.pos, {
            type: this.name,
            attrs: { src: attrs.src },
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
}).configure({
  inline: true,
});

export default ImageBlock;
