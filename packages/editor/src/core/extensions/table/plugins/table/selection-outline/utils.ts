import type { TableMap } from "@tiptap/pm/tables";

/**
 * Calculates the positions of cells adjacent to a given cell in a table
 * @param cellStart - The start position of the current cell in the document
 * @param tableMap - ProseMirror's table mapping structure containing cell positions and dimensions
 * @returns Object with positions of adjacent cells (undefined if cell doesn't exist at table edge)
 */
const getAdjacentCellPositions = (
  cellStart: number,
  tableMap: TableMap
): { top?: number; bottom?: number; left?: number; right?: number } => {
  // Extract table dimensions
  // width -> number of columns in the table
  // height -> number of rows in the table
  const { width, height } = tableMap;

  // Find the index of our cell in the flat tableMap.map array
  // tableMap.map contains start positions of all cells in row-by-row order
  const cellIndex = tableMap.map.indexOf(cellStart);

  // Safety check: if cell position not found in table map, return empty object
  if (cellIndex === -1) return {};

  // Convert flat array index to 2D grid coordinates
  // row = which row the cell is in (0-based from top)
  // col = which column the cell is in (0-based from left)
  const row = Math.floor(cellIndex / width); // Integer division gives row number
  const col = cellIndex % width; // Remainder gives column number

  return {
    // Top cell: same column, one row up
    // Check if we're not in the first row (row > 0) before calculating
    top: row > 0 ? tableMap.map[(row - 1) * width + col] : undefined,

    // Bottom cell: same column, one row down
    // Check if we're not in the last row (row < height - 1) before calculating
    bottom: row < height - 1 ? tableMap.map[(row + 1) * width + col] : undefined,

    // Left cell: same row, one column left
    // Check if we're not in the first column (col > 0) before calculating
    left: col > 0 ? tableMap.map[row * width + (col - 1)] : undefined,

    // Right cell: same row, one column right
    // Check if we're not in the last column (col < width - 1) before calculating
    right: col < width - 1 ? tableMap.map[row * width + (col + 1)] : undefined,
  };
};

export const getCellBorderClasses = (cellStart: number, selectedCells: number[], tableMap: TableMap): string[] => {
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
