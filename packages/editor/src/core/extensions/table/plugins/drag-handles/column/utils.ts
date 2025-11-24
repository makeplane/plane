import type { Editor } from "@tiptap/core";
import type { Selection } from "@tiptap/pm/state";
import { TableMap } from "@tiptap/pm/tables";
// extensions
import { getSelectedRect, isCellSelection } from "@/extensions/table/table/utilities/helpers";
import type { TableNodeLocation } from "@/extensions/table/table/utilities/helpers";
// local imports
import { cloneTableCell, constructDragPreviewTable, updateCellContentVisibility } from "../utils";

type TableColumn = {
  left: number;
  width: number;
};

/**
 * @description Calculate the index where the dragged column should be dropped.
 * @param {number} col - The column index.
 * @param {TableColumn[]} columns - The columns.
 * @param {number} left - The left position of the dragged column.
 * @returns {number} The index where the dragged column should be dropped.
 */
export const calculateColumnDropIndex = (col: number, columns: TableColumn[], left: number): number => {
  const currentColumnLeft = columns[col].left;
  const currentColumnRight = currentColumnLeft + columns[col].width;

  const draggedColumnLeft = left;
  const draggedColumnRight = draggedColumnLeft + columns[col].width;

  const isDraggingToLeft = draggedColumnLeft < currentColumnLeft;
  const isDraggingToRight = draggedColumnRight > currentColumnRight;

  const isFirstColumn = col === 0;
  const isLastColumn = col === columns.length - 1;

  if ((isFirstColumn && isDraggingToLeft) || (isLastColumn && isDraggingToRight)) {
    return col;
  }

  const firstColumn = columns[0];
  if (isDraggingToLeft && draggedColumnLeft <= firstColumn.left) {
    return 0;
  }

  const lastColumn = columns[columns.length - 1];
  if (isDraggingToRight && draggedColumnRight >= lastColumn.left + lastColumn.width) {
    return columns.length - 1;
  }

  let dropColumnIndex = col;
  if (isDraggingToRight) {
    const findHoveredColumn = columns.find((p, index) => {
      if (index === col) return false;
      const currentColumnCenter = p.left + p.width / 2;
      const currentColumnEdge = p.left + p.width;
      const nextColumn = columns[index + 1] as TableColumn | undefined;
      const nextColumnCenter = nextColumn ? nextColumn.width / 2 : 0;

      return draggedColumnRight >= currentColumnCenter && draggedColumnRight < currentColumnEdge + nextColumnCenter;
    });
    if (findHoveredColumn) {
      dropColumnIndex = columns.indexOf(findHoveredColumn);
    }
  }

  if (isDraggingToLeft) {
    const findHoveredColumn = columns.find((p, index) => {
      if (index === col) return false;
      const currentColumnCenter = p.left + p.width / 2;
      const prevColumn = columns[index - 1] as TableColumn | undefined;
      const prevColumnLeft = prevColumn ? prevColumn.left : 0;
      const prevColumnCenter = prevColumn ? prevColumn.width / 2 : 0;

      return draggedColumnLeft <= currentColumnCenter && draggedColumnLeft > prevColumnLeft + prevColumnCenter;
    });
    if (findHoveredColumn) {
      dropColumnIndex = columns.indexOf(findHoveredColumn);
    }
  }

  return dropColumnIndex;
};

/**
 * @description Get the node information of the columns in the table- their offset left and width.
 * @param {TableNodeLocation} table - The table node location.
 * @param {Editor} editor - The editor instance.
 * @returns {TableColumn[]} The information of the columns in the table.
 */
export const getTableColumnNodesInfo = (table: TableNodeLocation, editor: Editor): TableColumn[] => {
  const result: TableColumn[] = [];
  let leftPx = 0;

  const tableMap = TableMap.get(table.node);
  if (!tableMap || tableMap.height === 0 || tableMap.width === 0) {
    return result;
  }

  for (let col = 0; col < tableMap.width; col++) {
    const cellPos = tableMap.map[col];
    if (cellPos === undefined) continue;

    const dom = editor.view.domAtPos(table.start + cellPos + 1);
    if (dom.node instanceof HTMLElement) {
      if (col === 0) {
        leftPx = dom.node.offsetLeft;
      }
      result.push({
        left: dom.node.offsetLeft - leftPx,
        width: dom.node.offsetWidth,
      });
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
export const constructColumnDragPreview = (
  editor: Editor,
  selection: Selection,
  table: TableNodeLocation
): HTMLElement | undefined => {
  if (!isCellSelection(selection)) return;

  const tableMap = TableMap.get(table.node);
  const selectedColRect = getSelectedRect(selection, tableMap);
  const activeColCells = tableMap.cellsInRect(selectedColRect);

  const { tableElement, tableBodyElement } = constructDragPreviewTable();

  activeColCells.forEach((cellPos) => {
    const resolvedCellPos = table.start + cellPos + 1;
    const cellElement = editor.view.domAtPos(resolvedCellPos).node;
    if (cellElement instanceof HTMLElement) {
      const { clonedCellElement } = cloneTableCell(cellElement);
      clonedCellElement.style.height = cellElement.getBoundingClientRect().height + "px";
      const tableRowElement = document.createElement("tr");
      tableRowElement.appendChild(clonedCellElement);
      tableBodyElement.appendChild(tableRowElement);
    }
  });

  updateCellContentVisibility(editor, true);

  return tableElement;
};
