import { Node, mergeAttributes } from "@tiptap/core";
import { Node as NodeType } from "@tiptap/pm/model";
import { MarkdownSerializerState } from "@tiptap/pm/markdown";
// types
import { EEmbedAttributeNames } from "./types";
// utils
import { DEFAULT_EMBED_BLOCK_ATTRIBUTES } from "./utils";

// Extend Tiptap's Commands interface
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    embedComponent: {
      insertEmbed: () => ReturnType;
    };
  }
}

export const CustomEmbedExtensionConfig = Node.create({
  name: "embedComponent",
  group: "block",
  atom: true,
  inline: false,

  addAttributes() {
    const attributes = {
      // Reduce instead of map to accumulate the attributes directly into an object
      ...Object.values(EEmbedAttributeNames).reduce((acc, value) => {
        acc[value] = {
          default: DEFAULT_EMBED_BLOCK_ATTRIBUTES[value],
        };
        return acc;
      }, {}),
    };
    return attributes;
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: NodeType) {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `div[${EEmbedAttributeNames.BLOCK_TYPE}="${DEFAULT_EMBED_BLOCK_ATTRIBUTES[EEmbedAttributeNames.BLOCK_TYPE]}"]`,
      },
    ];
  },

  // Render HTML for the embed node
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes), 0];
  },
});
