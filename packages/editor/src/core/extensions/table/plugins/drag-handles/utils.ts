import type { Editor } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
import { CORE_EDITOR_META } from "@/constants/meta";

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
 * @description This function updates the `hideContent` attribute of the table cells and headers.
 * @param {Editor} editor - The editor instance.
 * @param {boolean} hideContent - Whether to hide the content.
 * @returns {boolean} Whether the content visibility was updated.
 */
export const updateCellContentVisibility = (editor: Editor, hideContent: boolean): boolean =>
  editor
    .chain()
    .focus()
    .setMeta(CORE_EDITOR_META.ADD_TO_HISTORY, false)
    .updateAttributes(CORE_EXTENSIONS.TABLE_CELL, {
      hideContent,
    })
    .updateAttributes(CORE_EXTENSIONS.TABLE_HEADER, {
      hideContent,
    })
    .run();
