import { findParentNode, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { CellSelection, TableMap } from "@tiptap/pm/tables";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { CSSProperties } from "react";

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

const createBorderDiv = (side: "top" | "bottom" | "left" | "right"): HTMLElement => {
  const div = document.createElement("div");

  Object.assign(div.style, {
    position: "absolute",
    backgroundColor: "rgb(var(--color-primary-100))",
    pointerEvents: "none",
  } satisfies CSSProperties);

  switch (side) {
    case "top":
      Object.assign(div.style, {
        top: "-1px",
        left: "-1px",
        height: "2px",
        width: "calc(100% + 2px)",
      } satisfies CSSProperties);
      break;
    case "bottom":
      Object.assign(div.style, {
        bottom: "-1px",
        left: "-1px",
        height: "2px",
        width: "calc(100% + 2px)",
      } satisfies CSSProperties);
      break;
    case "left":
      Object.assign(div.style, {
        top: "-1px",
        left: "-1px",
        width: "2px",
        height: "calc(100% + 2px)",
      } satisfies CSSProperties);
      break;
    case "right":
      Object.assign(div.style, {
        top: "-1px",
        right: "-1px",
        width: "2px",
        height: "calc(100% + 2px)",
      } satisfies CSSProperties);
      break;
  }

  return div;
};

type TableCellSelectionOutlinePluginState = {
  decorations?: DecorationSet;
};

const SELECTION_OUTLINE_PLUGIN_KEY = new PluginKey("selection");

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

          // Add container div to make cell position relative
          const containerDiv = document.createElement("div");
          containerDiv.style.position = "absolute";
          containerDiv.style.height = "100%";
          containerDiv.style.width = "100%";
          containerDiv.style.top = "0";
          containerDiv.style.left = "0";

          // Add border divs for each side that needs a border
          if (borders.top) containerDiv.appendChild(createBorderDiv("top"));
          if (borders.bottom) containerDiv.appendChild(createBorderDiv("bottom"));
          if (borders.left) containerDiv.appendChild(createBorderDiv("left"));
          if (borders.right) containerDiv.appendChild(createBorderDiv("right"));

          // Use widget decoration to insert the container div
          decorations.push(
            Decoration.widget(pos + 1, containerDiv, {
              side: -1,
              ignoreSelection: true,
            })
          );
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
