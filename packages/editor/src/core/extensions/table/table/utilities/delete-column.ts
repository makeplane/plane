import type { Command } from "@tiptap/core";
import { deleteColumn, deleteTable } from "@tiptap/pm/tables";
// local imports
import { isCellSelection } from "./helpers";

export const deleteColumnOrTable: () => Command =
  () =>
  ({ state, dispatch }) => {
    const { selection } = state;

    // Check if we're in a table and have a cell selection
    if (!isCellSelection(selection)) {
      return false;
    }

    // Get the ProseMirrorTable and calculate total columns
    const tableStart = selection.$anchorCell.start(-1);
    const selectedTable = state.doc.nodeAt(tableStart - 1);

    if (!selectedTable) return false;

    // Count total columns by examining the first row
    const firstRow = selectedTable.firstChild;
    if (!firstRow) return false;

    let totalColumns = 0;
    for (let i = 0; i < firstRow.childCount; i++) {
      const cell = firstRow.child(i);
      totalColumns += cell.attrs.colspan || 1;
    }

    // If only one column exists, delete the entire ProseMirrorTable
    if (totalColumns === 1) {
      return deleteTable(state, dispatch);
    }

    // Otherwise, proceed with normal column deletion
    return deleteColumn(state, dispatch);
  };
