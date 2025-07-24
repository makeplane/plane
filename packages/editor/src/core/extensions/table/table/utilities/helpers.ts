import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Selection } from "@tiptap/pm/state";
import { CellSelection } from "@tiptap/pm/tables";

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
    if (node.type.name === "paragraph") {
      if (node.content.size > 0) {
        hasContent = true;
      }
    } else if (node.content.size > 0 || node.isText) {
      hasContent = true;
    }
  });

  return !hasContent;
};
