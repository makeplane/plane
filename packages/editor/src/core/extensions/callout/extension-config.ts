import { Node, mergeAttributes } from "@tiptap/core";
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
    return {
      class: {
        default: "editor-callout",
      },
      dataLogoInUse: {
        default: "emoji",
        parseHTML: (element) => element.getAttribute("dataLogoInUse") || DEFAULT_CALLOUT_BLOCK_ATTRIBUTES.dataLogoInUse,
        renderHTML: (attributes) => ({
          dataLogoInUse: attributes["dataLogoInUse"] || DEFAULT_CALLOUT_BLOCK_ATTRIBUTES.dataLogoInUse,
        }),
      },
      dataIconColor: {},
      dataIconName: {},
      dataEmoji: {
        default: "128161",
        parseHTML: (element) => element.getAttribute("dataEmoji") || DEFAULT_CALLOUT_BLOCK_ATTRIBUTES.dataEmoji,
        renderHTML: (attributes) => ({
          dataEmoji: attributes["dataEmoji"] || DEFAULT_CALLOUT_BLOCK_ATTRIBUTES.dataEmoji,
        }),
      },
      dataBackground: {
        default: null,
      },
    };
  },

  // Parse HTML elements matching the class 'callout'
  parseHTML() {
    return [{ tag: "callout-component" }];
  },

  // Render HTML for the callout node
  renderHTML({ HTMLAttributes }) {
    return ["callout-component", mergeAttributes(HTMLAttributes)];
  },
});
