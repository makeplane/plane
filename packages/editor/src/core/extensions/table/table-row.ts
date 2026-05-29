import { mergeAttributes, Node } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";

type TableRowOptions = {
  HTMLAttributes: Record<string, unknown>;
};

export const TableRow = Node.create<TableRowOptions>({
  name: CORE_EXTENSIONS.TABLE_ROW,

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
