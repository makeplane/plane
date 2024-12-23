import { Node, mergeAttributes } from "@tiptap/core";
import { Node as NodeType } from "@tiptap/pm/model";
import { MarkdownSerializerState } from "@tiptap/pm/markdown";
// types
import { EAttributeNames, TCalloutBlockAttributes } from "./types";
// utils
import { DEFAULT_CALLOUT_BLOCK_ATTRIBUTES } from "./utils";

// Extend Tiptap's Commands interface
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    calloutComponent: {
      insertCallout: () => ReturnType;
    };
  }
}

export const CustomCalloutExtensionConfig = Node.create({
  name: "calloutComponent",
  group: "block",
  content: "block+",

  addAttributes() {
    const attributes = {
      // Reduce instead of map to accumulate the attributes directly into an object
      ...Object.values(EAttributeNames).reduce((acc, value) => {
        acc[value] = {
          default: DEFAULT_CALLOUT_BLOCK_ATTRIBUTES[value],
        };
        return acc;
      }, {}),
    };
    return attributes;
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: NodeType) {
          const attrs = node.attrs as TCalloutBlockAttributes;
          const logoInUse = attrs["data-logo-in-use"];
          // add callout logo
          if (logoInUse === "emoji") {
            state.write(
              `> <img src="${attrs["data-emoji-url"]}" alt="${attrs["data-emoji-unicode"]}" width="30px" />\n`
            );
          } else {
            state.write(`> <icon>${attrs["data-icon-name"]} icon</icon>\n`);
          }
          // add an empty line after the logo
          state.write("> \n");
          // add '> ' before each line of the callout content
          state.wrapBlock("> ", null, node, () => state.renderContent(node));
          state.closeBlock(node);
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `div[${EAttributeNames.BLOCK_TYPE}="${DEFAULT_CALLOUT_BLOCK_ATTRIBUTES[EAttributeNames.BLOCK_TYPE]}"]`,
      },
    ];
  },

  // Render HTML for the callout node
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes), 0];
  },
});
