import { mergeAttributes, Node } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { TableCellSelectionOutlinePlugin } from "./plugins/selection-outline/plugin";
import { DEFAULT_COLUMN_WIDTH } from "./table";

export interface TableCellOptions {
  HTMLAttributes: Record<string, any>;
}

export const TableCell = Node.create<TableCellOptions>({
  name: CORE_EXTENSIONS.TABLE_CELL,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  content: "block+",

  addAttributes() {
    return {
      colspan: {
        default: 1,
      },
      rowspan: {
        default: 1,
      },
      colwidth: {
        default: [DEFAULT_COLUMN_WIDTH],
        parseHTML: (element) => {
          const colwidth = element.getAttribute("colwidth");
          const value = colwidth ? [parseInt(colwidth, 10)] : null;

          return value;
        },
      },
      background: {
        default: null,
      },
      textColor: {
        default: null,
      },
    };
  },

  tableRole: "cell",

  isolating: true,

  addProseMirrorPlugins() {
    return [TableCellSelectionOutlinePlugin(this.editor)];
  },

  parseHTML() {
    return [{ tag: "td" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "td",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: `background-color: ${node.attrs.background}; color: ${node.attrs.textColor}`,
      }),
      0,
    ];
  },
});
