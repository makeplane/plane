import { callOrReturn, getExtensionField, mergeAttributes, Node, ParentConfig } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  CellSelection,
  columnResizing,
  deleteColumn,
  deleteRow,
  deleteTable,
  fixTables,
  goToNextCell,
  mergeCells,
  setCellAttr,
  splitCell,
  tableEditing,
  toggleHeader,
  toggleHeaderCell,
} from "@tiptap/pm/tables";
import { Decoration } from "@tiptap/pm/view";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { tableControls } from "./table-controls";
import { TableView } from "./table-view";
import { createTable } from "./utilities/create-table";
import { deleteTableWhenAllCellsSelected } from "./utilities/delete-table-when-all-cells-selected";
import { insertLineAboveTableAction } from "./utilities/insert-line-above-table-action";
import { insertLineBelowTableAction } from "./utilities/insert-line-below-table-action";

export interface TableOptions {
  HTMLAttributes: Record<string, any>;
  resizable: boolean;
  handleWidth: number;
  cellMinWidth: number;
  lastColumnResizable: boolean;
  allowTableNodeSelection: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.TABLE]: {
      insertTable: (options?: {
        rows?: number;
        cols?: number;
        withHeaderRow?: boolean;
        columnWidth?: number;
      }) => ReturnType;
      addColumnBefore: () => ReturnType;
      addColumnAfter: () => ReturnType;
      deleteColumn: () => ReturnType;
      addRowBefore: () => ReturnType;
      addRowAfter: () => ReturnType;
      deleteRow: () => ReturnType;
      deleteTable: () => ReturnType;
      mergeCells: () => ReturnType;
      splitCell: () => ReturnType;
      toggleHeaderColumn: () => ReturnType;
      toggleHeaderRow: () => ReturnType;
      toggleHeaderCell: () => ReturnType;
      mergeOrSplit: () => ReturnType;
      setCellAttribute: (name: string, value: any) => ReturnType;
      goToNextCell: () => ReturnType;
      goToPreviousCell: () => ReturnType;
      fixTables: () => ReturnType;
      setCellSelection: (position: { anchorCell: number; headCell?: number }) => ReturnType;
    };
  }

  interface NodeConfig<Options, Storage> {
    tableRole?:
      | string
      | ((this: {
          name: string;
          options: Options;
          storage: Storage;
          parent: ParentConfig<NodeConfig<Options>>["tableRole"];
        }) => string);
  }
}

export const Table = Node.create({
  name: CORE_EXTENSIONS.TABLE,

  addOptions() {
    return {
      HTMLAttributes: {},
      resizable: true,
      handleWidth: 5,
      cellMinWidth: 100,
      lastColumnResizable: true,
      allowTableNodeSelection: true,
    };
  },

  content: "tableRow+",

  tableRole: "table",

  isolating: true,

  group: "block",

  allowGapCursor: false,

  parseHTML() {
    return [{ tag: "table" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["table", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), ["tbody", 0]];
  },

  //@ts-expect-error todo
  addCommands() {
    return {
      insertTable:
        ({ rows = 3, cols = 3, withHeaderRow = false, columnWidth = 150 } = {}) =>
        ({ tr, dispatch, editor }) => {
          const node = createTable(editor.schema, rows, cols, withHeaderRow, undefined, columnWidth);
          if (dispatch) {
            const { selection } = tr;
            const position = selection.$from.before(selection.$from.depth);

            // Delete any existing content at the current position if it's an empty paragraph
            const nodeAfter = tr.doc.nodeAt(position);
            if (nodeAfter && nodeAfter.type.name === "paragraph" && nodeAfter.content.size === 0) {
              tr.delete(position, position + nodeAfter.nodeSize);
            }

            // Insert the table
            tr.insert(position, node);

            // Find the position of the first cell's content
            const resolvedPos = tr.doc.resolve(position + 1);
            const firstCell = resolvedPos.nodeAfter;
            if (firstCell) {
              const cellPos = position + 1;
              tr.setSelection(TextSelection.create(tr.doc, cellPos + 1)).scrollIntoView();
            }

            return true;
          }
        },
      addColumnBefore:
        () =>
        ({ state, dispatch }) =>
          addColumnBefore(state, dispatch),
      addColumnAfter:
        () =>
        ({ state, dispatch }) =>
          addColumnAfter(state, dispatch),
      deleteColumn:
        () =>
        ({ state, dispatch }) =>
          deleteColumn(state, dispatch),
      addRowBefore:
        () =>
        ({ state, dispatch }) =>
          addRowBefore(state, dispatch),
      addRowAfter:
        () =>
        ({ state, dispatch }) =>
          addRowAfter(state, dispatch),
      deleteRow:
        () =>
        ({ state, dispatch }) =>
          deleteRow(state, dispatch),
      deleteTable:
        () =>
        ({ state, dispatch }) =>
          deleteTable(state, dispatch),
      mergeCells:
        () =>
        ({ state, dispatch }) =>
          mergeCells(state, dispatch),
      splitCell:
        () =>
        ({ state, dispatch }) =>
          splitCell(state, dispatch),
      toggleHeaderColumn:
        () =>
        ({ state, dispatch }) =>
          toggleHeader("column")(state, dispatch),
      toggleHeaderRow:
        () =>
        ({ state, dispatch }) =>
          toggleHeader("row")(state, dispatch),
      toggleHeaderCell:
        () =>
        ({ state, dispatch }) =>
          toggleHeaderCell(state, dispatch),
      mergeOrSplit:
        () =>
        ({ state, dispatch }) => {
          if (mergeCells(state, dispatch)) {
            return true;
          }

          return splitCell(state, dispatch);
        },
      setCellAttribute:
        (name, value) =>
        ({ state, dispatch }) =>
          setCellAttr(name, value)(state, dispatch),
      goToNextCell:
        () =>
        ({ state, dispatch }) =>
          goToNextCell(1)(state, dispatch),
      goToPreviousCell:
        () =>
        ({ state, dispatch }) =>
          goToNextCell(-1)(state, dispatch),
      fixTables:
        () =>
        ({ state, dispatch }) => {
          if (dispatch) {
            fixTables(state);
          }

          return true;
        },
      setCellSelection:
        (position) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            const selection = CellSelection.create(tr.doc, position.anchorCell, position.headCell);
            tr.setSelection(selection);
          }
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.isActive(CORE_EXTENSIONS.TABLE)) {
          if (this.editor.isActive(CORE_EXTENSIONS.LIST_ITEM) || this.editor.isActive(CORE_EXTENSIONS.TASK_ITEM)) {
            return false;
          }
          if (this.editor.commands.goToNextCell()) {
            return true;
          }

          if (!this.editor.can().addRowAfter()) {
            return false;
          }

          return this.editor.chain().addRowAfter().goToNextCell().run();
        }
        return false;
      },
      "Shift-Tab": () => {
        if (this.editor.isActive("table")) {
          if (this.editor.isActive("list")) {
            return false;
          }
        }
        if (this.editor.commands.goToPreviousCell()) {
          return true;
        }
        return false;
      },
      Backspace: deleteTableWhenAllCellsSelected,
      "Mod-Backspace": deleteTableWhenAllCellsSelected,
      Delete: deleteTableWhenAllCellsSelected,
      "Mod-Delete": deleteTableWhenAllCellsSelected,
      ArrowDown: insertLineBelowTableAction,
      ArrowUp: insertLineAboveTableAction,
    };
  },

  addNodeView() {
    return ({ editor, getPos, node, decorations }) => {
      const { cellMinWidth } = this.options;

      return new TableView(node, cellMinWidth, decorations as Decoration[], editor, getPos as () => number);
    };
  },

  addProseMirrorPlugins() {
    const isResizable = this.options.resizable && this.editor.isEditable;

    const plugins = [
      tableEditing({
        allowTableNodeSelection: this.options.allowTableNodeSelection,
      }),
      tableControls(),
    ];

    if (isResizable) {
      plugins.unshift(
        columnResizing({
          handleWidth: this.options.handleWidth,
          cellMinWidth: this.options.cellMinWidth,
          // View: TableView,
          lastColumnResizable: this.options.lastColumnResizable,
        })
      );
    }

    return plugins;
  },

  extendNodeSchema(extension) {
    const context = {
      name: extension.name,
      options: extension.options,
      storage: extension.storage,
    };

    return {
      tableRole: callOrReturn(getExtensionField(extension, "tableRole", context)),
    };
  },
});
