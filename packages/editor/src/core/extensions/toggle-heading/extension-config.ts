import { Node, mergeAttributes } from "@tiptap/core";
import { Node as NodeType } from "@tiptap/pm/model";
import { MarkdownSerializerState } from "@tiptap/pm/markdown";

// Extend Tiptap's Commands interface
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggleHeadingComponent: {
      insertToggleHeading: ({ headingLevel }: { headingLevel: number }) => ReturnType;
    };
  }
}

export const CustomToggleHeadingExtensionConfig = Node.create({
  name: "toggleHeadingComponent",
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      "data-heading-level": {
        default: 1,
      },
      "data-background-color": {
        default: null,
      },
      "data-toggle-status": {
        default: "close",
      },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: NodeType) {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "toggle-heading-component" }];
  },

  // Render HTML for the callout node
  renderHTML({ HTMLAttributes }) {
    return ["toggle-heading-component", mergeAttributes(HTMLAttributes)];
  },
});
