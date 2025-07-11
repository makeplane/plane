import type { Command } from "@tiptap/core";
import { deleteRow, deleteTable, CellSelection } from "@tiptap/pm/tables";

export const deleteRowOrTable: () => Command =
  () =>
  ({ state, dispatch }) => {
    const { selection } = state;

    // Check if we're in a ProseMirrorTable and have a cell selection
    if (!(selection instanceof CellSelection)) {
      return false;
    }

    // Get the ProseMirrorTable and calculate total rows
    const tableStart = selection.$anchorCell.start(-1);
    const selectedTable = state.doc.nodeAt(tableStart - 1);

    if (!selectedTable) return false;

    // Count total rows by examining the table's children
    let totalRows = 0;
    for (let i = 0; i < selectedTable.childCount; i++) {
      const row = selectedTable.child(i);
      // Count each table row (accounting for potential rowspan)
      totalRows += row.attrs.rowspan || 1;
    }

    // If only one row exists, delete the entire ProseMirrorTable
    if (totalRows === 1) {
      return deleteTable(state, dispatch);
    }

    // Otherwise, proceed with normal row deletion
    return deleteRow(state, dispatch);
  };
