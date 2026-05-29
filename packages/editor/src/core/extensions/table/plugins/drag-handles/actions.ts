import type { Editor } from "@tiptap/core";
import { Fragment } from "@tiptap/pm/model";
import type { Node, Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import { TableMap } from "@tiptap/pm/tables";
import type { CellSelection } from "@tiptap/pm/tables";
// extensions
import type { TableNodeLocation } from "@/extensions/table/table/utilities/helpers";

type TableRow = (ProseMirrorNode | null)[];
type TableRows = TableRow[];

/**
 * Move the selected columns to the specified index.
 * @param {Editor} editor - The editor instance.
 * @param {TableNodeLocation} table - The table node location.
 * @param {CellSelection} selection - The cell selection.
 * @param {number} to - The index to move the columns to.
 * @param {Transaction} tr - The transaction.
 * @returns {Transaction} The updated transaction.
 */
export const moveSelectedColumns = (
  editor: Editor,
  table: TableNodeLocation,
  selection: CellSelection,
  to: number,
  tr: Transaction
): Transaction => {
  const tableMap = TableMap.get(table.node);

  let columnStart = -1;
  let columnEnd = -1;

  selection.forEachCell((_node, pos) => {
    const cell = tableMap.findCell(pos - table.pos - 1);
    for (let i = cell.left; i < cell.right; i++) {
      columnStart = columnStart >= 0 ? Math.min(cell.left, columnStart) : cell.left;
      columnEnd = columnEnd >= 0 ? Math.max(cell.right, columnEnd) : cell.right;
    }
  });

  if (columnStart === -1 || columnEnd === -1) {
    console.warn("Invalid column selection");
    return tr;
  }

  if (to < 0 || to > tableMap.width || (to >= columnStart && to < columnEnd)) return tr;

  const rows = tableToCells(table);
  for (const row of rows) {
    const range = row.splice(columnStart, columnEnd - columnStart);
    const offset = to > columnStart ? to - (columnEnd - columnStart - 1) : to;
    row.splice(offset, 0, ...range);
  }

  tableFromCells(editor, table, rows, tr);
  return tr;
};

/**
 * Move the selected rows to the specified index.
 * @param {Editor} editor - The editor instance.
 * @param {TableNodeLocation} table - The table node location.
 * @param {CellSelection} selection - The cell selection.
 * @param {number} to - The index to move the rows to.
 * @param {Transaction} tr - The transaction.
 * @returns {Transaction} The updated transaction.
 */
export const moveSelectedRows = (
  editor: Editor,
  table: TableNodeLocation,
  selection: CellSelection,
  to: number,
  tr: Transaction
): Transaction => {
  const tableMap = TableMap.get(table.node);

  let rowStart = -1;
  let rowEnd = -1;

  selection.forEachCell((_node, pos) => {
    const cell = tableMap.findCell(pos - table.pos - 1);
    for (let i = cell.top; i < cell.bottom; i++) {
      rowStart = rowStart >= 0 ? Math.min(cell.top, rowStart) : cell.top;
      rowEnd = rowEnd >= 0 ? Math.max(cell.bottom, rowEnd) : cell.bottom;
    }
  });

  if (rowStart === -1 || rowEnd === -1) {
    console.warn("Invalid row selection");
    return tr;
  }

  if (to < 0 || to > tableMap.height || (to >= rowStart && to < rowEnd)) return tr;

  const rows = tableToCells(table);
  const range = rows.splice(rowStart, rowEnd - rowStart);
  const offset = to > rowStart ? to - (rowEnd - rowStart - 1) : to;
  rows.splice(offset, 0, ...range);

  tableFromCells(editor, table, rows, tr);
  return tr;
};

/**
 * @description Duplicate the selected rows.
 * @param {TableNodeLocation} table - The table node location.
 * @param {number[]} rowIndices - The indices of the rows to duplicate.
 * @param {Transaction} tr - The transaction.
 * @returns {Transaction} The updated transaction.
 */
export const duplicateRows = (table: TableNodeLocation, rowIndices: number[], tr: Transaction): Transaction => {
  const rows = tableToCells(table);

  const { map, width } = TableMap.get(table.node);

  // Validate row indices
  const maxRow = rows.length - 1;
  if (rowIndices.some((idx) => idx < 0 || idx > maxRow)) {
    console.warn("Invalid row indices for duplication");
    return tr;
  }

  const mapStart = tr.mapping.maps.length;

  const lastRowPos = map[rowIndices[rowIndices.length - 1] * width + width - 1];
  const nextRowStart = lastRowPos + (table.node.nodeAt(lastRowPos)?.nodeSize ?? 0) + 1;
  const insertPos = tr.mapping.slice(mapStart).map(table.start + nextRowStart);

  for (let i = rowIndices.length - 1; i >= 0; i--) {
    tr.insert(
      insertPos,
      rows[rowIndices[i]].filter((r) => r !== null)
    );
  }

  return tr;
};

/**
 * @description Duplicate the selected columns.
 * @param {TableNodeLocation} table - The table node location.
 * @param {number[]} columnIndices - The indices of the columns to duplicate.
 * @param {Transaction} tr - The transaction.
 * @returns {Transaction} The updated transaction.
 */
export const duplicateColumns = (table: TableNodeLocation, columnIndices: number[], tr: Transaction): Transaction => {
  const rows = tableToCells(table);

  const { map, width, height } = TableMap.get(table.node);

  // Validate column indices
  if (columnIndices.some((idx) => idx < 0 || idx >= width)) {
    console.warn("Invalid column indices for duplication");
    return tr;
  }

  const mapStart = tr.mapping.maps.length;

  for (let row = 0; row < height; row++) {
    const lastColumnPos = map[row * width + columnIndices[columnIndices.length - 1]];
    const nextColumnStart = lastColumnPos + (table.node.nodeAt(lastColumnPos)?.nodeSize ?? 0);
    const insertPos = tr.mapping.slice(mapStart).map(table.start + nextColumnStart);

    for (let i = columnIndices.length - 1; i >= 0; i--) {
      const copiedNode = rows[row][columnIndices[i]];
      if (copiedNode !== null) {
        tr.insert(insertPos, copiedNode);
      }
    }
  }

  return tr;
};

/**
 * @description Convert the table to cells.
 * @param {TableNodeLocation} table - The table node location.
 * @returns {TableRows} The table rows.
 */
const tableToCells = (table: TableNodeLocation): TableRows => {
  const { map, width, height } = TableMap.get(table.node);

  const visitedCells = new Set<number>();
  const rows: TableRows = [];
  for (let row = 0; row < height; row++) {
    const cells: (ProseMirrorNode | null)[] = [];
    for (let col = 0; col < width; col++) {
      const pos = map[row * width + col];
      cells.push(!visitedCells.has(pos) ? table.node.nodeAt(pos) : null);
      visitedCells.add(pos);
    }
    rows.push(cells);
  }

  return rows;
};

/**
 * @description Convert the cells to a table.
 * @param {Editor} editor - The editor instance.
 * @param {TableNodeLocation} table - The table node location.
 * @param {TableRows} rows - The table rows.
 * @param {Transaction} tr - The transaction.
 */
const tableFromCells = (editor: Editor, table: TableNodeLocation, rows: TableRows, tr: Transaction): void => {
  const schema = editor.schema.nodes;
  const newRowNodes = rows.map((row) =>
    schema.tableRow.create(null, row.filter((cell) => cell !== null) as readonly Node[])
  );
  const newTableNode = table.node.copy(Fragment.from(newRowNodes));
  tr.replaceWith(table.pos, table.pos + table.node.nodeSize, newTableNode);
};
