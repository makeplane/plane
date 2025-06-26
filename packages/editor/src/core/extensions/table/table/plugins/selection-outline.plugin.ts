import { findParentNode, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { CellSelection, TableMap } from "@tiptap/pm/tables";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const getTableCellBorderSelectionStatus = (
  cell: number,
  selection: number[],
  tableMap: TableMap
): { top: boolean; bottom: boolean; left: boolean; right: boolean } => {
  const { width, height } = tableMap;
  const cellIndex = tableMap.map.indexOf(cell);

  const rect = tableMap.findCell(cell);
  const cellW = rect.right - rect.left;
  const cellH = rect.bottom - rect.top;

  const testRight = cellW;
  const testBottom = width * cellH;

  const topCell = cellIndex >= width ? tableMap.map[cellIndex - width] : undefined;
  const bottomCell = cellIndex < width * height - testBottom ? tableMap.map[cellIndex + testBottom] : undefined;
  const leftCell = cellIndex % width > 0 ? tableMap.map[cellIndex - 1] : undefined;
  const rightCell = cellIndex % width < width - testRight ? tableMap.map[cellIndex + testRight] : undefined;

  return {
    top: topCell === undefined || !selection.includes(topCell),
    bottom: bottomCell === undefined || !selection.includes(bottomCell),
    left: leftCell === undefined || !selection.includes(leftCell),
    right: rightCell === undefined || !selection.includes(rightCell),
  };
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
        const selected: number[] = [];

        selection.forEachCell((_node, pos) => {
          const start = pos - table.pos - 1;
          selected.push(start);
        });

        selection.forEachCell((node, pos) => {
          const start = pos - table.pos - 1;
          const borders = getTableCellBorderSelectionStatus(start, selected, tableMap);

          const classes: string[] = [];

          if (borders.top) classes.push("selectedCell-border-top");
          if (borders.bottom) classes.push("selectedCell-border-bottom");
          if (borders.left) classes.push("selectedCell-border-left");
          if (borders.right) classes.push("selectedCell-border-right");

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
