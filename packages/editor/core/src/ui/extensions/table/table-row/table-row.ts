import { mergeAttributes, Node } from "@tiptap/core";

export interface TableRowOptions {
  HTMLAttributes: Record<string, any>;
}

export const TableRow = Node.create<TableRowOptions>({
  name: "tableRow",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      backgroundColor: {
        default: null,
      },
    };
  },

  content: "(tableCell | tableHeader)*",

  tableRole: "row",

  parseHTML() {
    return [{ tag: "tr" }];
  },

  // renderHTML({ HTMLAttributes }) {
  //   return ["tr", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  // },

  renderHTML({ HTMLAttributes }) {
    // Check if backgroundColor attribute is set and create a style string accordingly
    const style = HTMLAttributes.backgroundColor ? `background-color: ${HTMLAttributes.backgroundColor};` : "";

    // Merge any existing HTMLAttributes with the style for backgroundColor
    const attributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { style });

    return ["tr", attributes, 0];
  },
});
