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

  content: "(tableCell | tableHeader)*",

  tableRole: "row",

  parseHTML() {
    return [{ tag: "tr" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["tr", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});
