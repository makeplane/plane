import { findParentNodeClosestToPos, KeyboardShortcutCommand } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// extensions
import { isCellSelection } from "@/extensions/table/table/utilities/is-cell-selection";

export const deleteTableWhenAllCellsSelected: KeyboardShortcutCommand = ({ editor }) => {
  const { selection } = editor.state;

  if (!isCellSelection(selection)) {
    return false;
  }

  let cellCount = 0;
  const table = findParentNodeClosestToPos(
    selection.ranges[0].$from,
    (node) => node.type.name === CORE_EXTENSIONS.TABLE
  );

  table?.node.descendants((node) => {
    if (node.type.name === CORE_EXTENSIONS.TABLE) {
      return false;
    }

    if ([CORE_EXTENSIONS.TABLE_CELL, CORE_EXTENSIONS.TABLE_HEADER].includes(node.type.name as CORE_EXTENSIONS)) {
      cellCount += 1;
    }
  });

  const allCellsSelected = cellCount === selection.ranges.length;

  if (!allCellsSelected) {
    return false;
  }

  editor.commands.deleteTable();

  return true;
};
