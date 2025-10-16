import { mergeAttributes, Node } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { DEFAULT_COLUMN_WIDTH } from "./table";

type TableHeaderOptions = {
  HTMLAttributes: Record<string, unknown>;
};

export const TableHeader = Node.create<TableHeaderOptions>({
  name: CORE_EXTENSIONS.TABLE_HEADER,

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
        default: "none",
      },
      hideContent: {
        default: false,
      },
    };
  },

  tableRole: "header_cell",

  isolating: true,

  parseHTML() {
    return [{ tag: "th" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "th",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: node.attrs.hideContent ? "content-hidden" : "",
        style: `background-color: ${node.attrs.background};`,
      }),
      0,
    ];
  },
});
