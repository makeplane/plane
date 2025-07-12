import { mergeAttributes, Node } from "@tiptap/core";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { TableCellSelectionOutlinePlugin } from "./plugins/selection-outline/plugin";
import { DEFAULT_COLUMN_WIDTH } from "./table";
import { isCellSelection } from "./table/utilities/helpers";

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

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor.view;
        const { selection } = state;

        // Check if we're at the start of the cell
        if (selection.from !== selection.to || selection.$head.parentOffset !== 0) {
          return false;
        }

        // Find table and current cell
        let tableNode: ProseMirrorNode | null = null;
        let currentCellNode: ProseMirrorNode | null = null;
        let cellPos: number | null = null;
        let cellDepth: number | null = null;

        for (let depth = selection.$head.depth; depth > 0; depth--) {
          const node = selection.$head.node(depth);
          if (node.type.name === CORE_EXTENSIONS.TABLE) {
            tableNode = node;
          }
          if (node.type.name === CORE_EXTENSIONS.TABLE_CELL || node.type.name === CORE_EXTENSIONS.TABLE_HEADER) {
            currentCellNode = node;
            cellPos = selection.$head.start(depth);
            cellDepth = depth;
          }
        }

        if (!tableNode || !currentCellNode || cellPos === null || cellDepth === null) return false;

        // Check if this is the only cell in the TableMap (1 row, 1 column)
        const isOnlyCell = tableNode.childCount === 1 && tableNode.firstChild?.childCount === 1;
        if (!isOnlyCell) return false;
        // Check if cell is selected (CellSelection)
        const isCellSelected = isCellSelection(selection);

        if (isCellSelected) {
          // Cell is already selected, delete the TableNode
          editor.chain().focus().deleteTable().run();
          return true;
        } else {
          // Cell has content, select the entire cell
          // Use the position that points to the cell node itself, not its content
          const cellNodePos = selection.$head.before(cellDepth);

          editor.commands.setCellSelection({
            anchorCell: cellNodePos,
            headCell: cellNodePos,
          });
          return true;
        }
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
        style: `background-color: ${node.attrs.background}; color: ${node.attrs.textColor}`,
      }),
      0,
    ];
  },
});
