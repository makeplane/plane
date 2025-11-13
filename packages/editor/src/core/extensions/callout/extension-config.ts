import { Node, mergeAttributes } from "@tiptap/core";
import type { MarkdownSerializerState } from "@tiptap/pm/markdown";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import { ECalloutAttributeNames } from "./types";
import type { CustomCalloutExtensionType, TCalloutBlockAttributes } from "./types";
// utils
import { DEFAULT_CALLOUT_BLOCK_ATTRIBUTES } from "./utils";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.CALLOUT]: {
      insertCallout: () => ReturnType;
    };
  }
}

export const CustomCalloutExtensionConfig: CustomCalloutExtensionType = Node.create({
  name: CORE_EXTENSIONS.CALLOUT,
  group: "block",
  content: "block+",

  addAttributes() {
    const attributes = {
      // Reduce instead of map to accumulate the attributes directly into an object
      ...Object.values(ECalloutAttributeNames).reduce(
        (acc, value) => {
          acc[value] = {
            default: DEFAULT_CALLOUT_BLOCK_ATTRIBUTES[value],
          };
          return acc;
        },
        {} as Record<ECalloutAttributeNames, { default: TCalloutBlockAttributes[ECalloutAttributeNames] }>
      ),
    };

    return attributes;
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
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
        tag: `div[${ECalloutAttributeNames.BLOCK_TYPE}="${DEFAULT_CALLOUT_BLOCK_ATTRIBUTES[ECalloutAttributeNames.BLOCK_TYPE]}"]`,
      },
    ];
  },

  // Render HTML for the callout node
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes), 0];
  },
});
