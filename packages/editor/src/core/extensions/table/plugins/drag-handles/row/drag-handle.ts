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

import { computePosition, flip, shift, autoUpdate } from "@floating-ui/dom";
import type { Editor } from "@tiptap/core";
import { TableMap } from "@tiptap/pm/tables";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// icons
import { DRAG_HANDLE_ICONS, createSvgElement } from "../icons";
// dropdown
import { createDropdownContent, handleDropdownAction } from "../dropdown-content";
import type { DropdownOption } from "../dropdown-content";
// extensions
import {
  findTable,
  getTableHeightPx,
  getTableWidthPx,
  isCellSelection,
  selectRow,
  getSelectedRows,
} from "@/extensions/table/table/utilities/helpers";
// local imports
import { moveSelectedRows, duplicateRows } from "../actions";
import {
  DROP_MARKER_THICKNESS,
  getDropMarker,
  getRowDragMarker,
  hideDragMarker,
  hideDropMarker,
  updateRowDragMarker,
  updateRowDropMarker,
} from "../marker-utils";
import { showCellContent } from "../utils";
import { calculateRowDropIndex, constructRowDragPreview, getTableRowNodesInfo } from "./utils";

export type RowDragHandleConfig = {
  editor: Editor;
  row: number;
};

/**
 * Creates a vanilla JS row drag handle element with dropdown functionality
 */
export function createRowDragHandle(config: RowDragHandleConfig): {
  element: HTMLElement;
  destroy: () => void;
} {
  const { editor, row } = config;

  // Create container
  const container = document.createElement("div");
  container.className =
    "table-row-handle-container absolute z-20 top-0 left-0 flex justify-center items-center h-full -translate-x-1/2";

  // Create button
  const button = document.createElement("button");
  button.type = "button";
  button.className = "default-state";

  // Create icon (Ellipsis lucide icon as SVG)
  const icon = createSvgElement(DRAG_HANDLE_ICONS.ellipsis, "size-4 text-primary");

  button.appendChild(icon);
  container.appendChild(button);

  // State for dropdown
  let isDropdownOpen = false;
  let dropdownElement: HTMLElement | null = null;
  let backdropElement: HTMLElement | null = null;
  let cleanupFloating: (() => void) | null = null;
  let backdropClickHandler: (() => void) | null = null;

  // Track drag event listeners for cleanup
  let dragListeners: {
    mouseup?: (e: MouseEvent) => void;
    mousemove?: (e: MouseEvent) => void;
  } = {};

  // Dropdown toggle function
  const toggleDropdown = () => {
    if (isDropdownOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const closeDropdown = () => {
    if (!isDropdownOpen) return;

    isDropdownOpen = false;

    // Reset button to default state
    button.className = "default-state";

    // Remove dropdown and backdrop
    if (dropdownElement) {
      dropdownElement.remove();
      dropdownElement = null;
    }
    if (backdropElement) {
      // Remove backdrop listener before removing element
      if (backdropClickHandler) {
        backdropElement.removeEventListener("click", backdropClickHandler);
        backdropClickHandler = null;
      }
      backdropElement.remove();
      backdropElement = null;
    }

    // Cleanup floating UI (this also removes keydown listener)
    if (cleanupFloating) {
      cleanupFloating();
      cleanupFloating = null;
    }

    // Remove active dropdown extension
    setTimeout(() => {
      editor.commands.removeActiveDropbarExtension(CORE_EXTENSIONS.TABLE);
    }, 0);
  };

  const openDropdown = () => {
    if (isDropdownOpen) return;

    isDropdownOpen = true;

    // Update button to open state
    button.className = "open-state";

    // Add active dropdown extension
    editor.commands.addActiveDropbarExtension(CORE_EXTENSIONS.TABLE);

    // Create backdrop
    backdropElement = document.createElement("div");
    backdropElement.style.position = "fixed";
    backdropElement.style.inset = "0";
    backdropElement.style.zIndex = "99";
    backdropClickHandler = closeDropdown;
    backdropElement.addEventListener("click", backdropClickHandler);
    document.body.appendChild(backdropElement);

    // Create dropdown
    dropdownElement = document.createElement("div");
    dropdownElement.className =
      "max-h-[90vh] w-[12rem] overflow-y-auto rounded-md border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 shadow-raised-200";
    dropdownElement.style.position = "fixed";
    dropdownElement.style.zIndex = "100";

    // Create and append dropdown content
    const content = createDropdownContent(getDropdownOptions());
    dropdownElement.appendChild(content);

    document.body.appendChild(dropdownElement);

    // Attach dropdown event listeners
    attachDropdownEventListeners(dropdownElement);

    // Setup floating UI positioning
    cleanupFloating = autoUpdate(button, dropdownElement, () => {
      void computePosition(button, dropdownElement!, {
        placement: "bottom-start",
        middleware: [
          flip({
            fallbackPlacements: ["top-start", "bottom-start", "top-end", "bottom-end"],
          }),
          shift({
            padding: 8,
          }),
        ],
      }).then(({ x, y }) => {
        if (dropdownElement) {
          dropdownElement.style.left = `${x}px`;
          dropdownElement.style.top = `${y}px`;
        }
        return;
      });
    });

    // Handle keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
      closeDropdown();
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener("keydown", handleKeyDown);

    // Store cleanup for this specific dropdown instance
    const originalCleanup = cleanupFloating;
    cleanupFloating = () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (originalCleanup) originalCleanup();
    };
  };

  const getDropdownOptions = (): DropdownOption[] => [
    {
      key: "toggle-header",
      label: "Header row",
      icon: DRAG_HANDLE_ICONS.toggleRight,
      showRightIcon: true,
    },
    {
      key: "insert-above",
      label: "Insert above",
      icon: DRAG_HANDLE_ICONS.arrowUp,
      showRightIcon: false,
    },
    {
      key: "insert-below",
      label: "Insert below",
      icon: DRAG_HANDLE_ICONS.arrowDown,
      showRightIcon: false,
    },
    {
      key: "duplicate",
      label: "Duplicate",
      icon: DRAG_HANDLE_ICONS.duplicate,
      showRightIcon: false,
    },
    {
      key: "clear-contents",
      label: "Clear contents",
      icon: DRAG_HANDLE_ICONS.close,
      showRightIcon: false,
    },
    {
      key: "delete",
      label: "Delete",
      icon: DRAG_HANDLE_ICONS.trash,
      showRightIcon: false,
    },
  ];

  const attachDropdownEventListeners = (dropdown: HTMLElement) => {
    const buttons = dropdown.querySelectorAll("button[data-action]");
    const colorPanel = dropdown.querySelector(".color-panel");
    const colorChevron = dropdown.querySelector(".color-chevron");

    buttons.forEach((btn) => {
      const action = btn.getAttribute("data-action");
      if (!action) return;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Handle common actions
        handleDropdownAction(action, editor, closeDropdown, colorPanel, colorChevron);

        // Handle row-specific actions
        switch (action) {
          case "toggle-header":
            editor.chain().focus().toggleHeaderRow().run();
            closeDropdown();
            break;
          case "set-bg-color": {
            const color = btn.getAttribute("data-color");
            if (color) {
              editor
                .chain()
                .focus()
                .updateAttributes(CORE_EXTENSIONS.TABLE_CELL, {
                  background: color,
                })
                .run();
            }
            closeDropdown();
            break;
          }
          case "insert-above":
            editor.chain().focus().addRowBefore().run();
            closeDropdown();
            break;
          case "insert-below":
            editor.chain().focus().addRowAfter().run();
            closeDropdown();
            break;
          case "duplicate": {
            const table = findTable(editor.state.selection);
            if (table) {
              const tableMap = TableMap.get(table.node);
              let tr = editor.state.tr;
              const selectedRows = getSelectedRows(editor.state.selection, tableMap);
              tr = duplicateRows(table, selectedRows, tr);
              editor.view.dispatch(tr);
            }
            closeDropdown();
            break;
          }
          case "clear-contents":
            editor.chain().focus().clearSelectedCells().run();
            closeDropdown();
            break;
          case "delete":
            editor.chain().focus().deleteRow().run();
            closeDropdown();
            break;
        }
      });
    });
  };

  // Handle mousedown for dragging
  const handleMouseDown = (e: MouseEvent) => {
    // Prevent dropdown from opening during drag
    if (e.button !== 0) return; // Only left click

    e.stopPropagation();
    e.preventDefault();

    // Check if this is a click (will be determined by mouseup without much movement)
    const startX = e.clientX;
    const startY = e.clientY;
    let hasMoved = false;

    // Clean up any existing drag listeners
    if (dragListeners.mouseup) {
      window.removeEventListener("mouseup", dragListeners.mouseup);
    }
    if (dragListeners.mousemove) {
      window.removeEventListener("mousemove", dragListeners.mousemove);
    }
    dragListeners = {};

    const table = findTable(editor.state.selection);
    if (!table) return;

    editor.view.dispatch(selectRow(table, row, editor.state.tr));

    // Drag row logic
    const tableHeightPx = getTableHeightPx(table, editor);
    const rows = getTableRowNodesInfo(table, editor);

    let dropIndex = row;
    const startTop = rows[row].top ?? 0;
    const startYPos = e.clientY;
    const tableElement = editor.view.nodeDOM(table.pos);

    const dropMarker = tableElement instanceof HTMLElement ? getDropMarker(tableElement) : null;
    const dragMarker = tableElement instanceof HTMLElement ? getRowDragMarker(tableElement) : null;

    const handleFinish = (): void => {
      // Clean up markers if they exist
      if (dropMarker && dragMarker) {
        hideDropMarker(dropMarker);
        hideDragMarker(dragMarker);
      }

      if (isCellSelection(editor.state.selection)) {
        showCellContent(editor);
      }

      // Perform drag operation if user moved
      if (row !== dropIndex && hasMoved) {
        let tr = editor.state.tr;
        const selection = editor.state.selection;
        if (isCellSelection(selection)) {
          const table = findTable(selection);
          if (table) {
            tr = moveSelectedRows(editor, table, selection, dropIndex, tr);
          }
        }
        editor.view.dispatch(tr);
      }

      window.removeEventListener("mouseup", handleFinish);
      window.removeEventListener("mousemove", handleMove);
      dragListeners.mouseup = undefined;
      dragListeners.mousemove = undefined;

      // If it was just a click (no movement), toggle dropdown
      if (!hasMoved) {
        toggleDropdown();
      }
    };

    let pseudoRow: HTMLElement | undefined;

    const handleMove = (moveEvent: MouseEvent): void => {
      // Mark that we've moved
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      if (deltaX > 3 || deltaY > 3) {
        hasMoved = true;
      }

      // Calculate drop index
      const cursorTop = startTop + moveEvent.clientY - startYPos;
      dropIndex = calculateRowDropIndex(row, rows, cursorTop);

      // Update visual markers if they exist
      if (dropMarker && dragMarker) {
        if (!pseudoRow) {
          pseudoRow = constructRowDragPreview(editor, editor.state.selection, table);
          const tableWidthPx = getTableWidthPx(table, editor);
          if (pseudoRow) {
            pseudoRow.style.width = `${tableWidthPx}px`;
          }
        }

        const dragMarkerHeightPx = rows[row].height;
        const dragMarkerTopPx = Math.max(0, Math.min(cursorTop, tableHeightPx - dragMarkerHeightPx));
        const dropMarkerTopPx = dropIndex <= row ? rows[dropIndex].top : rows[dropIndex].top + rows[dropIndex].height;

        updateRowDropMarker({
          element: dropMarker,
          top: dropMarkerTopPx - DROP_MARKER_THICKNESS / 2,
          height: DROP_MARKER_THICKNESS,
        });
        updateRowDragMarker({
          element: dragMarker,
          top: dragMarkerTopPx,
          height: dragMarkerHeightPx,
          pseudoRow,
        });
      }
    };

    try {
      dragListeners.mouseup = handleFinish;
      dragListeners.mousemove = handleMove;
      window.addEventListener("mouseup", handleFinish);
      window.addEventListener("mousemove", handleMove);
    } catch (error) {
      console.error("Error in RowDragHandle:", error);
      handleFinish();
    }
  };

  // Attach mousedown listener
  button.addEventListener("mousedown", handleMouseDown);

  // Cleanup function
  const destroy = () => {
    // Close dropdown if open
    if (isDropdownOpen) {
      closeDropdown();
    }

    // Remove drag listeners
    if (dragListeners.mouseup) {
      window.removeEventListener("mouseup", dragListeners.mouseup);
    }
    if (dragListeners.mousemove) {
      window.removeEventListener("mousemove", dragListeners.mousemove);
    }

    // Remove mousedown listener
    button.removeEventListener("mousedown", handleMouseDown);

    // Remove DOM elements
    container.remove();
  };

  return {
    element: container,
    destroy,
  };
}
