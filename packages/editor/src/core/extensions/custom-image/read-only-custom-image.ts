import { mergeAttributes } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { MarkdownSerializerState } from "@tiptap/pm/markdown";
import { Node } from "@tiptap/pm/model";
import { ReactNodeViewRenderer } from "@tiptap/react";
// components
import { CustomImageNode, ImageAttributes, UploadImageExtensionStorage } from "@/extensions/custom-image";
// types
import { TFileHandler } from "@/types";

export const CustomReadOnlyImageExtension = (props: Pick<TFileHandler, "getAssetSrc">) => {
  const { getAssetSrc } = props;

  return Image.extend<Record<string, unknown>, UploadImageExtensionStorage>({
    name: "imageComponent",
    selectable: false,
    group: "block",
    atom: true,
    draggable: false,

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
        markdown: {
          serialize(state: MarkdownSerializerState, node: Node) {
            const attrs = node.attrs as ImageAttributes;
            const imageSource = state.esc(this?.editor?.commands?.getImageSource?.(attrs.src) || attrs.src);
            const imageWidth = state.esc(attrs.width?.toString());
            state.write(`<img src="${state.esc(imageSource)}" width="${imageWidth}" />`);
            state.closeBlock(node);
          },
        },
      };
    },

    addCommands() {
      return {
        getImageSource: (path: string) => () => getAssetSrc(path),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(CustomImageNode);
    },
  });
};
