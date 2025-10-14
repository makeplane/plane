import { mergeAttributes, Node } from "@tiptap/core";
import { TableMap } from "@tiptap/pm/tables";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { findParentNodeOfType } from "@/helpers/common";
// local imports
import { TableCellSelectionOutlinePlugin } from "./plugins/selection-outline/plugin";
import { DEFAULT_COLUMN_WIDTH } from "./table";
import { isCellSelection } from "./table/utilities/helpers";

type TableCellOptions = {
  HTMLAttributes: Record<string, unknown>;
};

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
      hideContent: {
        default: false,
      },
    };
  },

  tableRole: "cell",

  isolating: true,

  addProseMirrorPlugins() {
    return [TableCellSelectionOutlinePlugin(this.editor)];
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor.view;
        const { selection } = state;

        if (isCellSelection(selection)) return false;

        // Check if we're at the start of the cell
        if (selection.from !== selection.to || selection.$head.parentOffset !== 0) return false;

        // Find table and current cell
        const tableNode = findParentNodeOfType(selection, [CORE_EXTENSIONS.TABLE])?.node;
        const currentCellInfo = findParentNodeOfType(selection, [
          CORE_EXTENSIONS.TABLE_CELL,
          CORE_EXTENSIONS.TABLE_HEADER,
        ]);
        const currentCellNode = currentCellInfo?.node;
        const cellPos = currentCellInfo?.pos;
        const cellDepth = currentCellInfo?.depth;

        if (!tableNode || !currentCellNode || cellPos === null || cellDepth === null) return false;

        // Check if this is the only cell in the TableMap (1 row, 1 column)
        const tableMap = TableMap.get(tableNode);
        const isOnlyCell = tableMap.width === 1 && tableMap.height === 1;
        if (!isOnlyCell) return false;

        // Cell has content, select the entire cell
        // Use the position that points to the cell node itself, not its content
        const cellNodePos = selection.$head.before(cellDepth);

        editor.commands.setCellSelection({
          anchorCell: cellNodePos,
          headCell: cellNodePos,
        });
        return true;
      },
    };
  },

  parseHTML() {
    return [{ tag: "td" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "td",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: node.attrs.hideContent ? "content-hidden" : "",
        style: `background-color: ${node.attrs.background}; color: ${node.attrs.textColor};`,
      }),
      0,
    ];
  },
});
