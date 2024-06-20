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
      background: {
        default: null,
      },
      textColor: {
        default: null,
      },
    };
  },

  content: "(tableCell | tableHeader)*",

  tableRole: "row",

  parseHTML() {
    return [{ tag: "tr" }];
  },

  renderHTML({ HTMLAttributes }) {
    const style = HTMLAttributes.background
      ? `background-color: ${HTMLAttributes.background}; color: ${HTMLAttributes.textColor}`
      : "";

    const attributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { style });

    return ["tr", attributes, 0];
  },
});
