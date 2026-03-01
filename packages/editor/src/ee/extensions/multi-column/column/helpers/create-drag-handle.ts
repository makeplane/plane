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
import {
  calculateColumnDropIndex,
  findColumnAtPos,
  findColumnList,
  getColumnListColumns,
  moveColumn,
} from "../../utils";
import { setSelectedColumn } from "../plugins/selection-outline";
import { constructColumnDragPreview } from "../utils/drag-utils";

const DROP_MARKER_THICKNESS = 4;

export type DragHandleInstance = {
  element: HTMLElement;
  destroy: () => void;
  updateGetColumnPos: (fn: () => number) => void;
};

type DropdownItem = {
  key: string;
  label: string;
  iconPath: string;
};

const ICONS = {
  ellipsis: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  duplicate:
    '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  trash:
    '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
};

const DROPDOWN_ITEMS: DropdownItem[] = [
  { key: "insert-left", label: "Insert left", iconPath: ICONS.arrowLeft },
  { key: "insert-right", label: "Insert right", iconPath: ICONS.arrowRight },
  { key: "duplicate", label: "Duplicate", iconPath: ICONS.duplicate },
  { key: "clear-contents", label: "Clear contents", iconPath: ICONS.close },
  { key: "delete", label: "Delete", iconPath: ICONS.trash },
];

function createSvgElement(iconPath: string, className = "size-3"): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", className);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.innerHTML = iconPath;
  return svg;
}

function createDropIndicator(rect: DOMRect): HTMLElement {
  const indicator = document.createElement("div");
  indicator.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    height: ${rect.height}px;
    width: ${DROP_MARKER_THICKNESS}px;
    background-color: var(--border-color-accent-strong);
    z-index: 10000;
    pointer-events: none;
    border-radius: 2px;
  `;
  document.body.appendChild(indicator);
  return indicator;
}

function copyComputedStyles(sourceElement: Element, targetElement: Element): void {
  if (!(sourceElement instanceof HTMLElement) || !(targetElement instanceof HTMLElement)) return;

  const computedStyle = window.getComputedStyle(sourceElement);
  const skipProperties = new Set(["position", "top", "left", "right", "bottom", "transform"]);

  for (let i = 0; i < computedStyle.length; i++) {
    const property = computedStyle[i];
    if (skipProperties.has(property)) continue;

    try {
      const value = computedStyle.getPropertyValue(property);
      targetElement.style.setProperty(property, value);
    } catch {
      // Skip read-only properties
    }
  }

  const sourceChildren = sourceElement.children;
  const targetChildren = targetElement.children;
  const minLength = Math.min(sourceChildren.length, targetChildren.length);

  for (let i = 0; i < minLength; i++) {
    copyComputedStyles(sourceChildren[i], targetChildren[i]);
  }
}

function createDragPreview(columnElement: HTMLElement | null, clientX: number, clientY: number): HTMLElement {
  const preview = constructColumnDragPreview(columnElement);
  preview.style.left = `${clientX + 10}px`;
  preview.style.top = `${clientY + 10}px`;
  return preview;
}

export function createColumnDragHandle(
  editor: Editor,
  initialGetColumnPos: () => number,
  _columnIndex: number
): DragHandleInstance {
  let getColumnPos = initialGetColumnPos;

  // Container
  const container = document.createElement("div");
  container.className =
    "column-drag-handle-container absolute z-20 top-0 left-0 flex justify-center items-center w-full -translate-y-1/2";

  // Button
  const button = document.createElement("button");
  button.type = "button";
  button.className = "px-1 bg-layer-1 border border-strong-1 rounded-sm outline-none transition-all duration-200";
  button.setAttribute("aria-label", "Column options and drag handle");
  button.appendChild(createSvgElement(ICONS.ellipsis, "size-4 text-primary"));
  container.appendChild(button);

  // State
  let isDropdownOpen = false;
  let dropdownElement: HTMLElement | null = null;
  let backdropElement: HTMLElement | null = null;
  let cleanupFloating: (() => void) | null = null;
  let backdropClickHandler: (() => void) | null = null;
  let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  // Separate drag listeners tracking (cleaned on each drag finish)
  let dragListeners: {
    mouseup?: (e: MouseEvent) => void;
    mousemove?: (e: MouseEvent) => void;
  } = {};

  const closeDropdown = () => {
    if (!isDropdownOpen) return;
    isDropdownOpen = false;

    button.classList.remove("!opacity-100", "bg-accent-primary", "border-accent-strong");
    button.classList.add("hover:bg-layer-1-hover");

    if (dropdownElement) {
      dropdownElement.remove();
      dropdownElement = null;
    }

    if (backdropElement) {
      if (backdropClickHandler) {
        backdropElement.removeEventListener("click", backdropClickHandler);
        backdropClickHandler = null;
      }
      backdropElement.remove();
      backdropElement = null;
    }

    if (keydownHandler) {
      document.removeEventListener("keydown", keydownHandler);
      keydownHandler = null;
    }

    if (cleanupFloating) {
      cleanupFloating();
      cleanupFloating = null;
    }

    setSelectedColumn(editor, null);
  };

  const openDropdown = () => {
    if (isDropdownOpen) return;
    isDropdownOpen = true;

    setSelectedColumn(editor, getColumnPos());
    button.classList.add("!opacity-100", "bg-accent-primary", "border-accent-strong");
    button.classList.remove("hover:bg-layer-1-hover");

    // Create backdrop
    backdropElement = document.createElement("div");
    backdropElement.style.cssText = "position: fixed; inset: 0; z-index: 99;";
    backdropClickHandler = closeDropdown;
    backdropElement.addEventListener("click", backdropClickHandler);
    document.body.appendChild(backdropElement);

    // Create dropdown
    dropdownElement = document.createElement("div");
    dropdownElement.className =
      "max-h-[90vh] w-[12rem] overflow-y-auto rounded-md border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 shadow-custom-shadow-rg";
    dropdownElement.style.cssText = "position: fixed; z-index: 100;";

    // Create dropdown items
    DROPDOWN_ITEMS.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "flex items-center gap-2 w-full rounded-sm px-1 py-1.5 text-11 text-left truncate text-secondary hover:bg-layer-1";
      btn.setAttribute("data-action", item.key);

      btn.appendChild(createSvgElement(item.iconPath, "shrink-0 size-3"));

      const label = document.createElement("span");
      label.className = "flex-grow truncate";
      label.textContent = item.label;
      btn.appendChild(label);

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Resolve the current column position from the latest editor state.
        const columnInfo = findColumnAtPos(editor.state, getColumnPos());
        if (!columnInfo) {
          // Column no longer exists or cannot be resolved; just close the dropdown.
          closeDropdown();
          return;
        }
        const currentColumnPos = columnInfo.pos;

        switch (item.key) {
          case "insert-left":
            editor.commands.insertColumnLeft({ columnPos: currentColumnPos });
            break;
          case "insert-right":
            editor.commands.insertColumnRight({ columnPos: currentColumnPos });
            break;
          case "duplicate":
            editor.commands.duplicateColumn({ columnPos: currentColumnPos });
            break;
          case "clear-contents":
            editor.commands.clearColumnContents({ columnPos: currentColumnPos });
            break;
          case "delete":
            editor.commands.deleteMultiColumn({ columnPos: currentColumnPos });
            break;
        }
        closeDropdown();
      });

      dropdownElement!.appendChild(btn);
    });

    document.body.appendChild(dropdownElement);

    // Setup floating UI positioning
    cleanupFloating = autoUpdate(button, dropdownElement, () => {
      void computePosition(button, dropdownElement!, {
        placement: "bottom-start",
        middleware: [
          flip({ fallbackPlacements: ["top-start", "bottom-start", "top-end", "bottom-end"] }),
          shift({ padding: 8 }),
        ],
      }).then(({ x, y }) => {
        if (dropdownElement) {
          dropdownElement.style.left = `${x}px`;
          dropdownElement.style.top = `${y}px`;
        }
      });
    });

    keydownHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDropdown();
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("keydown", keydownHandler);
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const columnPos = getColumnPos();
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

    const columnInfo = findColumnAtPos(editor.state, columnPos);
    const columnListInfo = findColumnList(editor.state, columnPos);
    if (!columnInfo || !columnListInfo) return;

    const columns = getColumnListColumns(columnListInfo, editor);
    const currentIndex = columns.findIndex((column) => column.pos === columnPos);
    if (currentIndex === -1 || !columns[currentIndex]) return;

    const columnListElement = editor.view.nodeDOM(columnListInfo.pos) as HTMLElement | null;
    const currentColumnElement = editor.view.nodeDOM(columnPos) as HTMLElement | null;
    if (!columnListElement) return;

    const columnListRect = columnListElement.getBoundingClientRect();
    const startLeft = columns[currentIndex].left ?? 0;
    const startXPos = e.clientX;
    let dropIndex = currentIndex;

    let dropIndicator: HTMLElement | null = null;
    let floatingPreview: HTMLElement | null = null;

    const handleFinish = () => {
      dropIndicator?.remove();
      floatingPreview?.remove();
      editor.view.dom.classList.remove("column-dragging");

      if (currentIndex !== dropIndex && hasMoved) {
        const tr = moveColumn(editor.state.tr, columnListInfo.pos, currentIndex, dropIndex, editor.state);
        editor.view.dispatch(tr);
      }

      window.removeEventListener("mouseup", handleFinish);
      window.removeEventListener("mousemove", handleMove);
      dragListeners.mouseup = undefined;
      dragListeners.mousemove = undefined;

      // If it was just a click (no movement), toggle dropdown
      if (!hasMoved) {
        openDropdown();
      }
    };

    const handleMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      if (deltaX > 3 || deltaY > 3) {
        hasMoved = true;
      }

      const currentLeft = startLeft + moveEvent.clientX - startXPos;
      dropIndex = calculateColumnDropIndex(currentIndex, columns, currentLeft);

      if (!dropIndicator || !floatingPreview) {
        dropIndicator = createDropIndicator(columnListRect);
        floatingPreview = createDragPreview(currentColumnElement, moveEvent.clientX, moveEvent.clientY);
        editor.view.dom.classList.add("column-dragging");
      }

      const updatedRect = columnListElement.getBoundingClientRect();
      const targetColumn = columns[dropIndex];
      if (!targetColumn || targetColumn.left == null || targetColumn.width == null) return;

      const gap = parseFloat(getComputedStyle(columnListElement).gap || "0");
      const dropMarkerLeftPx = dropIndex === 0 ? 0 : targetColumn.left - gap / 2;

      dropIndicator.style.left = `${updatedRect.left + dropMarkerLeftPx - Math.floor(DROP_MARKER_THICKNESS / 2)}px`;
      dropIndicator.style.top = `${updatedRect.top}px`;
      dropIndicator.style.height = `${updatedRect.height}px`;

      floatingPreview.style.left = `${moveEvent.clientX + 10}px`;
      floatingPreview.style.top = `${moveEvent.clientY + 10}px`;
    };

    dragListeners.mouseup = handleFinish;
    dragListeners.mousemove = handleMove;
    window.addEventListener("mouseup", handleFinish);
    window.addEventListener("mousemove", handleMove);
  };

  // Attach mousedown listener
  button.addEventListener("mousedown", handleMouseDown);

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

    // Remove DOM element
    container.remove();
  };

  const updateGetColumnPos = (fn: () => number) => {
    getColumnPos = fn;
  };

  return { element: container, destroy, updateGetColumnPos };
}
