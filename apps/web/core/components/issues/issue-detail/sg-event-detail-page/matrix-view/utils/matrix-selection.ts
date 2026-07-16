import type { MatrixCell, MatrixCellSelection, MatrixData } from "../types/matrix.types";

const unique = (values: readonly string[]) => Array.from(new Set(values.filter(Boolean)));

export const isMatrixCellSelected = (selection: MatrixCellSelection, cellId: string) => selection.includes(cellId);

export const toggleMatrixCellSelection = (selection: MatrixCellSelection, cell: MatrixCell): MatrixCellSelection => {
  const current = unique(selection);
  if (current.includes(cell.id)) return current.filter((cellId) => cellId !== cell.id);
  if (cell.count <= 0 || cell.sourceRowIds.length === 0) return current;
  return [...current, cell.id];
};

export const replaceMatrixCellSelection = (cell: MatrixCell): MatrixCellSelection =>
  cell.count > 0 && cell.sourceRowIds.length > 0 ? [cell.id] : [];

export const rangeMatrixCellSelection = (
  selection: MatrixCellSelection,
  matrix: MatrixData,
  targetCell: MatrixCell
): MatrixCellSelection => {
  const current = pruneMatrixCellSelection(selection, matrix);
  const anchorCellId = current[current.length - 1];
  const anchorCell = anchorCellId ? matrix.cells[anchorCellId] : null;
  if (!anchorCell) return replaceMatrixCellSelection(targetCell);

  const rowIndexById = new Map(matrix.rows.map((row, index) => [row.id, index]));
  const columnIndexById = new Map(
    matrix.columns.filter((column) => column.visible).map((column, index) => [column.id, index])
  );
  const getDisplayCoordinates = (cell: MatrixCell) => {
    const rowId = matrix.orientation === "entities-by-actions" ? cell.rowId : cell.columnId;
    const columnId = matrix.orientation === "entities-by-actions" ? cell.columnId : cell.rowId;
    return {
      columnIndex: columnIndexById.get(columnId) ?? -1,
      rowIndex: rowIndexById.get(rowId) ?? -1,
    };
  };
  const anchor = getDisplayCoordinates(anchorCell);
  const target = getDisplayCoordinates(targetCell);
  if (anchor.rowIndex < 0 || anchor.columnIndex < 0 || target.rowIndex < 0 || target.columnIndex < 0) {
    return replaceMatrixCellSelection(targetCell);
  }

  const minRow = Math.min(anchor.rowIndex, target.rowIndex);
  const maxRow = Math.max(anchor.rowIndex, target.rowIndex);
  const minColumn = Math.min(anchor.columnIndex, target.columnIndex);
  const maxColumn = Math.max(anchor.columnIndex, target.columnIndex);
  const selected = new Set(current);

  matrix.rows.slice(minRow, maxRow + 1).forEach((row) => {
    matrix.columns
      .filter((column) => column.visible)
      .slice(minColumn, maxColumn + 1)
      .forEach((column) => {
        const cell = row.cells[column.id];
        if (cell?.count > 0 && cell.sourceRowIds.length > 0) selected.add(cell.id);
      });
  });

  return Array.from(selected);
};

export const clearMatrixCellSelection = (): MatrixCellSelection => [];

export const pruneMatrixCellSelection = (selection: MatrixCellSelection, matrix: MatrixData): MatrixCellSelection =>
  unique(selection).filter((cellId) => {
    const cell = matrix.cells[cellId];
    return Boolean(cell && cell.count > 0 && cell.sourceRowIds.length > 0);
  });

export const getSelectedMatrixCells = (selection: MatrixCellSelection, matrix: MatrixData): MatrixCell[] =>
  pruneMatrixCellSelection(selection, matrix)
    .map((cellId) => matrix.cells[cellId])
    .filter((cell): cell is MatrixCell => Boolean(cell));

export const getSelectedMatrixSourceRowIds = (selection: MatrixCellSelection, matrix: MatrixData): string[] =>
  unique(getSelectedMatrixCells(selection, matrix).flatMap((cell) => cell.sourceRowIds));

export const getSelectedMatrixTagIds = (selection: MatrixCellSelection, matrix: MatrixData): string[] =>
  unique(getSelectedMatrixCells(selection, matrix).flatMap((cell) => cell.tagIds));

export const getSelectedMatrixClipIds = (selection: MatrixCellSelection, matrix: MatrixData): string[] =>
  unique(getSelectedMatrixCells(selection, matrix).flatMap((cell) => cell.clipIds ?? []));
