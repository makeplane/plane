import type { Selection } from "@tiptap/pm/state";
import { CellSelection } from "@tiptap/pm/tables";

/**
 * @description Check if the selection is a cell selection
 * @param {Selection} selection - The selection to check
 * @returns {boolean} True if the selection is a cell selection, false otherwise
 */
export const isCellSelection = (selection: Selection): selection is CellSelection => selection instanceof CellSelection;
