import type { Editor } from "@tiptap/core";
import type { Selection } from "@tiptap/pm/state";
import { TableMap } from "@tiptap/pm/tables";
// extensions
import { getSelectedRect, isCellSelection } from "@/extensions/table/table/utilities/helpers";
import type { TableNodeLocation } from "@/extensions/table/table/utilities/helpers";
// local imports
import { cloneTableCell, constructDragPreviewTable, updateCellContentVisibility } from "../utils";

type TableRow = {
  top: number;
  height: number;
};

/**
 * @description Calculate the index where the dragged row should be dropped.
 * @param {number} row - The row index.
 * @param {TableRow[]} rows - The rows.
 * @param {number} top - The top position of the dragged row.
 * @returns {number} The index where the dragged row should be dropped.
 */
export const calculateRowDropIndex = (row: number, rows: TableRow[], top: number): number => {
  const currentRowTop = rows[row].top;
  const currentRowBottom = currentRowTop + rows[row].height;

  const draggedRowTop = top;
  const draggedRowBottom = draggedRowTop + rows[row].height;

  const isDraggingUp = draggedRowTop < currentRowTop;
  const isDraggingDown = draggedRowBottom > currentRowBottom;

  const isFirstRow = row === 0;
  const isLastRow = row === rows.length - 1;

  if ((isFirstRow && isDraggingUp) || (isLastRow && isDraggingDown)) {
    return row;
  }

  const firstRow = rows[0];
  if (isDraggingUp && draggedRowTop <= firstRow.top) {
    return 0;
  }

  const lastRow = rows[rows.length - 1];
  if (isDraggingDown && draggedRowBottom >= lastRow.top + lastRow.height) {
    return rows.length - 1;
  }

  let dropRowIndex = row;
  if (isDraggingDown) {
    const findHoveredRow = rows.find((p, index) => {
      if (index === row) return false;
      const currentRowCenter = p.top + p.height / 2;
      const currentRowEdge = p.top + p.height;
      const nextRow = rows[index + 1] as TableRow | undefined;
      const nextRowCenter = nextRow ? nextRow.height / 2 : 0;

      return draggedRowBottom >= currentRowCenter && draggedRowBottom < currentRowEdge + nextRowCenter;
    });
    if (findHoveredRow) {
      dropRowIndex = rows.indexOf(findHoveredRow);
    }
  }

  if (isDraggingUp) {
    const findHoveredRow = rows.find((p, index) => {
      if (index === row) return false;
      const currentRowCenter = p.top + p.height / 2;
      const prevRow = rows[index - 1] as TableRow | undefined;
      const prevRowTop = prevRow ? prevRow.top : 0;
      const prevRowCenter = prevRow ? prevRow.height / 2 : 0;

      return draggedRowTop <= currentRowCenter && draggedRowTop > prevRowTop + prevRowCenter;
    });
    if (findHoveredRow) {
      dropRowIndex = rows.indexOf(findHoveredRow);
    }
  }

  return dropRowIndex;
};

/**
 * @description Get the node information of the rows in the table- their offset top and height.
 * @param {TableNodeLocation} table - The table node location.
 * @param {Editor} editor - The editor instance.
 * @returns {TableRow[]} The information of the rows in the table.
 */
export const getTableRowNodesInfo = (table: TableNodeLocation, editor: Editor): TableRow[] => {
  const result: TableRow[] = [];
  let topPx = 0;

  const tableMap = TableMap.get(table.node);
  if (!tableMap || tableMap.height === 0 || tableMap.width === 0) {
    return result;
  }

  for (let row = 0; row < tableMap.height; row++) {
    const cellPos = tableMap.map[row * tableMap.width];
    if (cellPos === undefined) continue;
    const dom = editor.view.domAtPos(table.start + cellPos);
    if (dom.node instanceof HTMLElement) {
      const heightPx = dom.node.offsetHeight;
      result.push({
        top: topPx,
        height: heightPx,
      });
      topPx += heightPx;
    }
  }
  return result;
};

/**
 * @description Construct a pseudo column from the selected cells for drag preview.
 * @param {Editor} editor - The editor instance.
 * @param {Selection} selection - The selection.
 * @param {TableNodeLocation} table - The table node location.
 * @returns {HTMLElement | undefined} The pseudo column.
 */
export const constructRowDragPreview = (
  editor: Editor,
  selection: Selection,
  table: TableNodeLocation
): HTMLElement | undefined => {
  if (!isCellSelection(selection)) return;

  const tableMap = TableMap.get(table.node);
  const selectedRowRect = getSelectedRect(selection, tableMap);
  const activeRowCells = tableMap.cellsInRect(selectedRowRect);

  const { tableElement, tableBodyElement } = constructDragPreviewTable();

  const tableRowElement = document.createElement("tr");
  tableBodyElement.appendChild(tableRowElement);

  activeRowCells.forEach((cellPos) => {
    const resolvedCellPos = table.start + cellPos + 1;
    const cellElement = editor.view.domAtPos(resolvedCellPos).node;
    if (cellElement instanceof HTMLElement) {
      const { clonedCellElement } = cloneTableCell(cellElement);
      clonedCellElement.style.width = cellElement.getBoundingClientRect().width + "px";
      tableRowElement.appendChild(clonedCellElement);
    }
  });

  updateCellContentVisibility(editor, true);

  return tableElement;
};
