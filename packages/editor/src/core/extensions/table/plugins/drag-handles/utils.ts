/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { Editor } from "@tiptap/core";
import type { Selection } from "@tiptap/pm/state";
import { TableMap } from "@tiptap/pm/tables";
// constants
import { CORE_EDITOR_META } from "@/constants/meta";
// extensions
import { getSelectedRect, isCellSelection } from "@/extensions/table/table/utilities/helpers";
import type { TableNodeLocation } from "@/extensions/table/table/utilities/helpers";
// local imports
import { updateTransactionMeta } from "../drag-state";

/**
 * @description Construct a pseudo table element which will act as a parent for column and row drag previews.
 * @returns {HTMLTableElement} The pseudo table.
 */
export const constructDragPreviewTable = (): {
  tableElement: HTMLTableElement;
  tableBodyElement: HTMLTableSectionElement;
} => {
  const tableElement = document.createElement("table");
  tableElement.classList.add("table-drag-preview");
  tableElement.classList.add("bg-surface-1");
  tableElement.style.opacity = "0.9";
  const tableBodyElement = document.createElement("tbody");
  tableElement.appendChild(tableBodyElement);

  return { tableElement, tableBodyElement };
};

/**
 * @description Clone a table cell element.
 * @param {HTMLElement} cellElement - The cell element to clone.
 * @returns {HTMLElement} The cloned cell element.
 */
export const cloneTableCell = (
  cellElement: HTMLElement
): {
  clonedCellElement: HTMLElement;
} => {
  const clonedCellElement = cellElement.cloneNode(true) as HTMLElement;
  clonedCellElement.style.setProperty("visibility", "visible", "important");

  const widgetElement = clonedCellElement.querySelectorAll(".ProseMirror-widget");
  widgetElement.forEach((widget) => widget.remove());

  return { clonedCellElement };
};

/**
 * @description Get positions of all cells in the current selection.
 * @param {Selection} selection - The selection.
 * @param {TableNodeLocation} table - The table node location.
 * @returns {number[]} Array of cell positions.
 */
export const getSelectedCellPositions = (selection: Selection, table: TableNodeLocation): number[] => {
  if (!isCellSelection(selection)) return [];

  const tableMap = TableMap.get(table.node);
  const selectedRect = getSelectedRect(selection, tableMap);
  const cellsInSelection = tableMap.cellsInRect(selectedRect);

  // Convert relative positions to absolute document positions
  return cellsInSelection.map((cellPos) => table.start + cellPos);
};

/**
 * @description Hide cell content using decorations (local only, not persisted).
 * @param {Editor} editor - The editor instance.
 * @param {number[]} cellPositions - Array of cell positions to hide.
 */
export const hideCellContent = (editor: Editor, cellPositions: number[]): void => {
  const tr = editor.view.state.tr;
  updateTransactionMeta(tr, cellPositions);
  tr.setMeta(CORE_EDITOR_META.ADD_TO_HISTORY, false);
  editor.view.dispatch(tr);
};

/**
 * @description Show cell content by clearing decorations.
 * @param {Editor} editor - The editor instance.
 */
export const showCellContent = (editor: Editor): void => {
  const tr = editor.view.state.tr;
  updateTransactionMeta(tr, null);
  tr.setMeta(CORE_EDITOR_META.ADD_TO_HISTORY, true);
  editor.view.dispatch(tr);
};
