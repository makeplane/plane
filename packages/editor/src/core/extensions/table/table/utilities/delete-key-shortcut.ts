import { findParentNodeClosestToPos } from "@tiptap/core";
import type { Editor, KeyboardShortcutCommand } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { CellSelection } from "@tiptap/pm/tables";
import { TableMap } from "@tiptap/pm/tables";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// extensions
import { isCellEmpty, isCellSelection } from "@/extensions/table/table/utilities/helpers";

type CellCoord = {
  row: number;
  col: number;
};

type TableInfo = {
  node: ProseMirrorNode;
  pos: number;
  map: TableMap;
  totalColumns: number;
  totalRows: number;
};

export const handleDeleteKeyOnTable: KeyboardShortcutCommand = (props) => {
  const { editor } = props;
  const { selection } = editor.state;

  try {
    if (!isCellSelection(selection)) return false;

    const tableInfo = getTableInfo(editor);
    if (!tableInfo) return false;

    const selectedCellCoords = getSelectedCellCoords(selection, tableInfo);
    if (selectedCellCoords.length === 0) return false;

    const hasContent = checkCellsHaveContent(selection);
    if (hasContent) return false;

    const selectionBounds = calculateSelectionBounds(selectedCellCoords);
    const { totalColumnsInSelection, totalRowsInSelection, minRow, minCol } = selectionBounds;

    // Check if entire rows are selected
    if (totalColumnsInSelection === tableInfo.totalColumns) {
      return deleteMultipleRows(editor, totalRowsInSelection, minRow, tableInfo);
    }

    // Check if entire columns are selected
    if (totalRowsInSelection === tableInfo.totalRows) {
      return deleteMultipleColumns(editor, totalColumnsInSelection, minCol, tableInfo);
    }

    return false;
  } catch (error) {
    console.error("Error in handleDeleteKeyOnTable", error);
    return false;
  }
};

const getTableInfo = (editor: Editor): TableInfo | null => {
  const table = findParentNodeClosestToPos(
    editor.state.selection.ranges[0].$from,
    (node) => node.type.name === CORE_EXTENSIONS.TABLE
  );

  if (!table) return null;

  const tableMap = TableMap.get(table.node);
  return {
    node: table.node,
    pos: table.pos,
    map: tableMap,
    totalColumns: tableMap.width,
    totalRows: tableMap.height,
  };
};

const getSelectedCellCoords = (selection: CellSelection, tableInfo: TableInfo): CellCoord[] => {
  const selectedCellCoords: CellCoord[] = [];

  selection.forEachCell((_node, pos) => {
    const cellStart = pos - tableInfo.pos - 1;
    const coord = findCellCoordinate(cellStart, tableInfo);

    if (coord) {
      selectedCellCoords.push(coord);
    }
  });

  return selectedCellCoords;
};

const findCellCoordinate = (cellStart: number, tableInfo: TableInfo): CellCoord | null => {
  // Primary method: use indexOf
  const cellIndex = tableInfo.map.map.indexOf(cellStart);

  if (cellIndex !== -1) {
    return {
      row: Math.floor(cellIndex / tableInfo.totalColumns),
      col: cellIndex % tableInfo.totalColumns,
    };
  }

  // Fallback: manual search
  for (let i = 0; i < tableInfo.map.map.length; i++) {
    if (tableInfo.map.map[i] === cellStart) {
      return {
        row: Math.floor(i / tableInfo.totalColumns),
        col: i % tableInfo.totalColumns,
      };
    }
  }

  return null;
};

const checkCellsHaveContent = (selection: CellSelection): boolean => {
  let hasContent = false;

  selection.forEachCell((node) => {
    if (node && !isCellEmpty(node)) {
      hasContent = true;
    }
  });

  return hasContent;
};

const calculateSelectionBounds = (selectedCellCoords: CellCoord[]) => {
  const minRow = Math.min(...selectedCellCoords.map((c) => c.row));
  const maxRow = Math.max(...selectedCellCoords.map((c) => c.row));
  const minCol = Math.min(...selectedCellCoords.map((c) => c.col));
  const maxCol = Math.max(...selectedCellCoords.map((c) => c.col));

  return {
    minRow,
    maxRow,
    minCol,
    maxCol,
    totalColumnsInSelection: maxCol - minCol + 1,
    totalRowsInSelection: maxRow - minRow + 1,
  };
};

const deleteMultipleRows = (
  editor: Editor,
  totalRowsInSelection: number,
  minRow: number,
  initialTableInfo: TableInfo
): boolean => {
  // Position cursor at the first selected row
  setCursorAtPosition(editor, initialTableInfo, minRow, 0);

  // Delete rows one by one
  for (let i = 0; i < totalRowsInSelection; i++) {
    editor.commands.deleteRow();

    // Reposition cursor if there are more rows to delete
    if (i < totalRowsInSelection - 1) {
      const updatedTableInfo = getTableInfo(editor);
      if (updatedTableInfo) {
        setCursorAtPosition(editor, updatedTableInfo, minRow, 0);
      }
    }
  }

  return true;
};

const deleteMultipleColumns = (
  editor: Editor,
  totalColumnsInSelection: number,
  minCol: number,
  initialTableInfo: TableInfo
): boolean => {
  // Position cursor at the first selected column
  setCursorAtPosition(editor, initialTableInfo, 0, minCol);

  // Delete columns one by one
  for (let i = 0; i < totalColumnsInSelection; i++) {
    editor.commands.deleteColumn();

    // Reposition cursor if there are more columns to delete
    if (i < totalColumnsInSelection - 1) {
      const updatedTableInfo = getTableInfo(editor);
      if (updatedTableInfo) {
        setCursorAtPosition(editor, updatedTableInfo, 0, minCol);
      }
    }
  }

  return true;
};

const setCursorAtPosition = (editor: Editor, tableInfo: TableInfo, row: number, col: number): void => {
  const cellIndex = row * tableInfo.totalColumns + col;
  const cellPos = tableInfo.pos + tableInfo.map.map[cellIndex] + 1;

  editor.commands.setCellSelection({
    anchorCell: cellPos,
    headCell: cellPos,
  });
};
