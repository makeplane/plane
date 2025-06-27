import { findParentNode, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { CellSelection, TableMap } from "@tiptap/pm/tables";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const getAdjacentCellPositions = (
  cellStart: number,
  tableMap: TableMap
): { top?: number; bottom?: number; left?: number; right?: number } => {
  const { width, height } = tableMap;
  const cellIndex = tableMap.map.indexOf(cellStart);

  if (cellIndex === -1) return {};

  const row = Math.floor(cellIndex / width);
  const col = cellIndex % width;

  return {
    top: row > 0 ? tableMap.map[(row - 1) * width + col] : undefined,
    bottom: row < height - 1 ? tableMap.map[(row + 1) * width + col] : undefined,
    left: col > 0 ? tableMap.map[row * width + (col - 1)] : undefined,
    right: col < width - 1 ? tableMap.map[row * width + (col + 1)] : undefined,
  };
};

const getCellBorderClasses = (cellStart: number, selectedCells: number[], tableMap: TableMap): string[] => {
  const adjacent = getAdjacentCellPositions(cellStart, tableMap);
  const classes: string[] = [];

  // Add border-right if right cell is not selected or doesn't exist
  if (adjacent.right === undefined || !selectedCells.includes(adjacent.right)) {
    classes.push("selectedCell-border-right");
  }

  // Add border-left if left cell is not selected or doesn't exist
  if (adjacent.left === undefined || !selectedCells.includes(adjacent.left)) {
    classes.push("selectedCell-border-left");
  }

  // Add border-top if top cell is not selected or doesn't exist
  if (adjacent.top === undefined || !selectedCells.includes(adjacent.top)) {
    classes.push("selectedCell-border-top");
  }

  // Add border-bottom if bottom cell is not selected or doesn't exist
  if (adjacent.bottom === undefined || !selectedCells.includes(adjacent.bottom)) {
    classes.push("selectedCell-border-bottom");
  }

  return classes;
};

type TableCellSelectionOutlinePluginState = {
  decorations?: DecorationSet;
};

const SELECTION_OUTLINE_PLUGIN_KEY = new PluginKey("table-cell-selection-outline");

export const TableCellSelectionOutlinePlugin = (editor: Editor): Plugin<TableCellSelectionOutlinePluginState> =>
  new Plugin<TableCellSelectionOutlinePluginState>({
    key: SELECTION_OUTLINE_PLUGIN_KEY,
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
        if (!(selection instanceof CellSelection)) return {};

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
        return SELECTION_OUTLINE_PLUGIN_KEY.getState(state).decorations;
      },
    },
  });
