import { findParentNode } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { TableMap } from "@tiptap/pm/tables";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
// local imports
import { isCellSelection } from "../../table/utilities/helpers";
import { getCellBorderClasses } from "./utils";

type TableCellSelectionOutlinePluginState = {
  decorations?: DecorationSet;
};

const TABLE_SELECTION_OUTLINE_PLUGIN_KEY = new PluginKey("table-cell-selection-outline");

export const TableCellSelectionOutlinePlugin = (editor: Editor): Plugin<TableCellSelectionOutlinePluginState> =>
  new Plugin<TableCellSelectionOutlinePluginState>({
    key: TABLE_SELECTION_OUTLINE_PLUGIN_KEY,
    state: {
      init: () => ({}),
      apply(tr, prev, oldState, newState) {
        if (!editor.isEditable) return {};
        const table = findParentNode((node) => node.type.spec.tableRole === "table")(newState.selection);
        const hasDocChanged = tr.docChanged || !newState.selection.eq(oldState.selection);
        if (!table || !hasDocChanged) {
          return table === undefined ? {} : prev;
        }

        const { selection } = newState;
        if (!isCellSelection(selection)) return {};

        const decorations: Decoration[] = [];
        const tableMap = TableMap.get(table.node);
        const selectedCells: number[] = [];

        // First, collect all selected cell positions
        selection.forEachCell((_node, pos) => {
          const start = pos - table.pos - 1;
          selectedCells.push(start);
        });

        // Then, add decorations with appropriate border classes
        selection.forEachCell((node, pos) => {
          const start = pos - table.pos - 1;
          const classes = getCellBorderClasses(start, selectedCells, tableMap);

          decorations.push(Decoration.node(pos, pos + node.nodeSize, { class: classes.join(" ") }));
        });

        return {
          decorations: DecorationSet.create(newState.doc, decorations),
        };
      },
    },
    props: {
      decorations(state) {
        return TABLE_SELECTION_OUTLINE_PLUGIN_KEY.getState(state).decorations;
      },
    },
  });
