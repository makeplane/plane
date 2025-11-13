import { findParentNode } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorState, Selection, Transaction } from "@tiptap/pm/state";
import { CellSelection, TableMap } from "@tiptap/pm/tables";
import type { Rect } from "@tiptap/pm/tables";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";

/**
 * @description Check if the selection is a cell selection
 * @param {Selection} selection - The selection to check
 * @returns {boolean} True if the selection is a cell selection, false otherwise
 */
export const isCellSelection = (selection: Selection): selection is CellSelection => selection instanceof CellSelection;

/**
 * @description Check if a cell is empty
 * @param {ProseMirrorNode | null} cell - The cell to check
 * @returns {boolean} True if the cell is empty, false otherwise
 */
export const isCellEmpty = (cell: ProseMirrorNode | null): boolean => {
  if (!cell || cell.content.size === 0) {
    return true;
  }

  // Check if cell has any non-empty content
  let hasContent = false;
  cell.content.forEach((node) => {
    if (node.type.name === CORE_EXTENSIONS.PARAGRAPH) {
      if (node.content.size > 0) {
        hasContent = true;
      }
    } else if (node.content.size > 0 || node.isText) {
      hasContent = true;
    }
  });

  return !hasContent;
};

export type TableNodeLocation = {
  pos: number;
  start: number;
  node: ProseMirrorNode;
};

/**
 * @description Find the table node location from the selection.
 * @param {Selection} selection - The selection.
 * @returns {TableNodeLocation | undefined} The table node location.
 */
export const findTable = (selection: Selection): TableNodeLocation | undefined =>
  findParentNode((node) => node.type.spec.tableRole === "table")(selection);

/**
 * @description Check if the selection has table related changes.
 * @param {Editor} editor - The editor instance.
 * @param {TableNodeLocation | undefined} table - The table node location.
 * @param {EditorState} oldState - The old editor state.
 * @param {EditorState} newState - The new editor state.
 * @param {Transaction} tr - The transaction.
 * @returns {boolean} True if the selection has table related changes, false otherwise.
 */
export const haveTableRelatedChanges = (
  editor: Editor,
  table: TableNodeLocation | undefined,
  oldState: EditorState,
  newState: EditorState,
  tr: Transaction
): table is TableNodeLocation =>
  editor.isEditable && table !== undefined && (tr.docChanged || !newState.selection.eq(oldState.selection));

/**
 * @description Get the selected rect from the cell selection.
 * @param {CellSelection} selection - The cell selection.
 * @param {TableMap} map - The table map.
 * @returns {Rect} The selected rect.
 */
export const getSelectedRect = (selection: CellSelection, map: TableMap): Rect => {
  const start = selection.$anchorCell.start(-1);
  return map.rectBetween(selection.$anchorCell.pos - start, selection.$headCell.pos - start);
};

/**
 * @description Get the selected columns from the cell selection.
 * @param {Selection} selection - The selection.
 * @param {TableMap} map - The table map.
 * @returns {number[]} The selected columns.
 */
export const getSelectedColumns = (selection: Selection, map: TableMap): number[] => {
  if (isCellSelection(selection) && selection.isColSelection()) {
    const selectedRect = getSelectedRect(selection, map);
    return [...Array(selectedRect.right - selectedRect.left).keys()].map((idx) => idx + selectedRect.left);
  }

  return [];
};

/**
 * @description Get the selected rows from the cell selection.
 * @param {Selection} selection - The selection.
 * @param {TableMap} map - The table map.
 * @returns {number[]} The selected rows.
 */
export const getSelectedRows = (selection: Selection, map: TableMap): number[] => {
  if (isCellSelection(selection) && selection.isRowSelection()) {
    const selectedRect = getSelectedRect(selection, map);
    return [...Array(selectedRect.bottom - selectedRect.top).keys()].map((idx) => idx + selectedRect.top);
  }

  return [];
};

/**
 * @description Check if the rect is selected.
 * @param {Rect} rect - The rect.
 * @param {CellSelection} selection - The cell selection.
 * @returns {boolean} True if the rect is selected, false otherwise.
 */
export const isRectSelected = (rect: Rect, selection: CellSelection): boolean => {
  const map = TableMap.get(selection.$anchorCell.node(-1));
  const cells = map.cellsInRect(rect);
  const selectedCells = map.cellsInRect(getSelectedRect(selection, map));

  return cells.every((cell) => selectedCells.includes(cell));
};

/**
 * @description Check if the column is selected.
 * @param {number} columnIndex - The column index.
 * @param {Selection} selection - The selection.
 * @returns {boolean} True if the column is selected, false otherwise.
 */
export const isColumnSelected = (columnIndex: number, selection: Selection): boolean => {
  if (!isCellSelection(selection)) return false;

  const { height } = TableMap.get(selection.$anchorCell.node(-1));
  const rect = { left: columnIndex, right: columnIndex + 1, top: 0, bottom: height };
  return isRectSelected(rect, selection);
};

/**
 * @description Check if the row is selected.
 * @param {number} rowIndex - The row index.
 * @param {Selection} selection - The selection.
 * @returns {boolean} True if the row is selected, false otherwise.
 */
export const isRowSelected = (rowIndex: number, selection: Selection): boolean => {
  if (isCellSelection(selection)) {
    const { width } = TableMap.get(selection.$anchorCell.node(-1));
    const rect = { left: 0, right: width, top: rowIndex, bottom: rowIndex + 1 };
    return isRectSelected(rect, selection);
  }

  return false;
};

/**
 * @description Select the column.
 * @param {TableNodeLocation} table - The table node location.
 * @param {number} index - The column index.
 * @param {Transaction} tr - The transaction.
 * @returns {Transaction} The updated transaction.
 */
export const selectColumn = (table: TableNodeLocation, index: number, tr: Transaction): Transaction => {
  const { map } = TableMap.get(table.node);

  const anchorCell = table.start + map[index];
  const $anchor = tr.doc.resolve(anchorCell);

  return tr.setSelection(CellSelection.colSelection($anchor));
};

/**
 * @description Select the row.
 * @param {TableNodeLocation} table - The table node location.
 * @param {number} index - The row index.
 * @param {Transaction} tr - The transaction.
 * @returns {Transaction} The updated transaction.
 */
export const selectRow = (table: TableNodeLocation, index: number, tr: Transaction): Transaction => {
  const { map, width } = TableMap.get(table.node);

  const anchorCell = table.start + map[index * width];
  const $anchor = tr.doc.resolve(anchorCell);

  return tr.setSelection(CellSelection.rowSelection($anchor));
};

/**
 * @description Get the position of the cell widget decoration.
 * @param {TableNodeLocation} table - The table node location.
 * @param {TableMap} map - The table map.
 * @param {number} index - The index.
 * @returns {number} The position of the cell widget decoration.
 */
export const getTableCellWidgetDecorationPos = (table: TableNodeLocation, map: TableMap, index: number): number =>
  table.start + map.map[index] + 1;

/**
 * @description Get the height of the table in pixels.
 * @param {TableNodeLocation} table - The table node location.
 * @param {Editor} editor - The editor instance.
 * @returns {number} The height of the table in pixels.
 */
export const getTableHeightPx = (table: TableNodeLocation, editor: Editor): number => {
  const dom = editor.view.domAtPos(table.start);
  return dom.node.parentElement?.offsetHeight ?? 0;
};

/**
 * @description Get the width of the table in pixels.
 * @param {TableNodeLocation} table - The table node location.
 * @param {Editor} editor - The editor instance.
 * @returns {number} The width of the table in pixels.
 */
export const getTableWidthPx = (table: TableNodeLocation, editor: Editor): number => {
  const dom = editor.view.domAtPos(table.start);
  return dom.node.parentElement?.offsetWidth ?? 0;
};
