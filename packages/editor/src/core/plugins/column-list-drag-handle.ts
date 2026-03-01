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

import { NodeSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
// constants
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";
// extensions
import type { SideMenuHandleOptions, SideMenuPluginProps } from "@/extensions";
import { columnResizePluginKey } from "@/plane-editor/extensions/multi-column/column/plugins/column-resize";
// utils
import { getScrollParent } from "./drag-handle";
import { EColumnAttributeNames, EColumnListNodeType } from "src/ee/extensions/multi-column/types";

const verticalEllipsisIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>';

const maxScrollSpeed = 20;
const acceleration = 0.5;

function easeOutQuadAnimation(t: number) {
  return t * (2 - t);
}

const createColumnListDragHandleElement = (): HTMLElement => {
  const dragHandleElement = document.createElement("button");
  dragHandleElement.type = "button";
  dragHandleElement.id = "column-list-drag-handle";
  dragHandleElement.draggable = true;
  dragHandleElement.dataset.columnListDragHandle = "";
  dragHandleElement.classList.value =
    "hidden sm:flex items-center justify-center size-5 aspect-square rounded-sm cursor-grab outline-none hover:bg-custom-background-80 active:bg-custom-background-80 active:cursor-grabbing transition-[background-color,_opacity] duration-200 ease-linear pb-1";

  const iconElement1 = document.createElement("span");
  iconElement1.classList.value = "pointer-events-none text-custom-text-300";
  iconElement1.innerHTML = verticalEllipsisIcon;
  const iconElement2 = document.createElement("span");
  iconElement2.classList.value = "pointer-events-none text-custom-text-300 -ml-2.5";
  iconElement2.innerHTML = verticalEllipsisIcon;

  dragHandleElement.appendChild(iconElement1);
  dragHandleElement.appendChild(iconElement2);

  return dragHandleElement;
};

/**
 * Find the closest columnList element from the given coordinates
 */
const findColumnListAtCoords = (coords: { x: number; y: number }): Element | null => {
  const elements = document.elementsFromPoint(coords.x, coords.y);

  for (const elem of elements) {
    // Check if element is or is inside a columnList
    const columnList = elem.closest(`[${EColumnAttributeNames.NODE_TYPE}="${EColumnListNodeType.COLUMN_LIST}"]`);
    if (columnList) return columnList;
  }
  return null;
};

/**
 * Get the columnList node position from DOM element
 */
const getColumnListPosFromDOM = (
  columnListElement: Element,
  view: EditorView,
  options: SideMenuPluginProps
): number | null => {
  const boundingRect = columnListElement.getBoundingClientRect();
  const pos = view.posAtCoords({
    left: boundingRect.left + 50 + options.dragHandleWidth,
    top: boundingRect.top + 1,
  });

  if (!pos) return null;

  // Resolve to find the columnList node position
  const $pos = view.state.doc.resolve(pos.pos);

  for (let d = $pos.depth; d >= 0; d--) {
    const node = $pos.node(d);
    if (node.type.name === (ADDITIONAL_EXTENSIONS.COLUMN_LIST as string)) {
      return $pos.before(d);
    }
  }

  // If pos.inside points to columnList
  if (pos.inside >= 0) {
    const nodeAtInside = view.state.doc.nodeAt(pos.inside);
    if (nodeAtInside?.type.name === (ADDITIONAL_EXTENSIONS.COLUMN_LIST as string)) {
      return pos.inside;
    }
  }

  return null;
};

export const ColumnListDragHandlePlugin = (options: SideMenuPluginProps): SideMenuHandleOptions => {
  let isDragging = false;
  let lastClientY = 0;
  let scrollAnimationFrame: number | null = null;
  let isDraggedOutsideWindow: "top" | "bottom" | boolean = false;
  let isMouseInsideWhileDragging = false;
  let currentScrollSpeed = 0;
  let dragHandleElement: HTMLElement | null = null;
  let currentColumnListElement: Element | null = null;

  function scroll() {
    if (!isDragging) {
      currentScrollSpeed = 0;
      return;
    }

    if (!dragHandleElement) return;
    const scrollableParent = getScrollParent(dragHandleElement) as HTMLElement;
    if (!scrollableParent) return;

    const scrollRegionUp = options.scrollThreshold.up;
    const scrollRegionDown = window.innerHeight - options.scrollThreshold.down;

    let targetScrollAmount = 0;

    if (isDraggedOutsideWindow === "top") {
      targetScrollAmount = -maxScrollSpeed * 5;
    } else if (isDraggedOutsideWindow === "bottom") {
      targetScrollAmount = maxScrollSpeed * 5;
    } else if (lastClientY < scrollRegionUp) {
      targetScrollAmount =
        -maxScrollSpeed * easeOutQuadAnimation((scrollRegionUp - lastClientY) / options.scrollThreshold.up);
    } else if (lastClientY > scrollRegionDown) {
      targetScrollAmount =
        maxScrollSpeed * easeOutQuadAnimation((lastClientY - scrollRegionDown) / options.scrollThreshold.down);
    }

    currentScrollSpeed += (targetScrollAmount - currentScrollSpeed) * acceleration;

    if (Math.abs(currentScrollSpeed) > 0.1) {
      scrollableParent.scrollBy({ top: currentScrollSpeed });
    }

    scrollAnimationFrame = requestAnimationFrame(scroll);
  }

  const handleDragStart = (event: DragEvent, view: EditorView) => {
    if (!currentColumnListElement) return;

    view.focus();

    const columnListPos = getColumnListPosFromDOM(currentColumnListElement, view, options);
    if (columnListPos === null || columnListPos < 0) return;

    const docSize = view.state.doc.content.size;
    const safePos = Math.max(0, Math.min(columnListPos, docSize));

    const nodeSelection = NodeSelection.create(view.state.doc, safePos);
    view.dispatch(view.state.tr.setSelection(nodeSelection));

    isDragging = true;
    lastClientY = event.clientY;

    if (event.dataTransfer) {
      const slice = view.state.selection.content();
      const { dom, text } = view.serializeForClipboard(slice);

      event.dataTransfer.clearData();
      event.dataTransfer.setData("text/html", dom.innerHTML);
      event.dataTransfer.setData("text/plain", text);
      event.dataTransfer.effectAllowed = "copyMove";
      event.dataTransfer.setDragImage(currentColumnListElement as HTMLElement, 0, 0);

      view.dragging = { slice, move: !event.altKey };
    }

    scroll();
  };

  const handleDragEnd = <TEvent extends DragEvent | FocusEvent>(event: TEvent, view?: EditorView) => {
    event.preventDefault();
    isDragging = false;
    isMouseInsideWhileDragging = false;
    if (scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = null;
    }
    view?.dom.classList.remove("dragging");
  };

  const handleClick = (_event: MouseEvent, view: EditorView) => {
    if (!currentColumnListElement) return;

    view.focus();

    const columnListPos = getColumnListPosFromDOM(currentColumnListElement, view, options);
    if (columnListPos === null || columnListPos < 0) return;

    const docSize = view.state.doc.content.size;
    const safePos = Math.max(0, Math.min(columnListPos, docSize));

    const nodeSelection = NodeSelection.create(view.state.doc, safePos);
    view.dispatch(view.state.tr.setSelection(nodeSelection));
  };

  const showDragHandle = (view?: EditorView) => {
    if (view) {
      const columnResizeState = columnResizePluginKey.getState(view.state);
      if (columnResizeState && columnResizeState.type !== "default") {
        hideDragHandle();
        return;
      }
    }

    // Position the drag handle based on the columnList element itself
    if (currentColumnListElement && dragHandleElement) {
      const rect = currentColumnListElement.getBoundingClientRect();
      const compStyle = window.getComputedStyle(currentColumnListElement);
      const lineHeight = parseInt(compStyle.lineHeight, 10) || 20;
      const paddingTop = parseInt(compStyle.paddingTop, 10) || 0;

      // Position at the top-left of the columnList, offset to the left
      // Match the side menu positioning: rect.left - dragHandleWidth - 1px
      const top = rect.top + (lineHeight - 20) / 2 + paddingTop;
      const left = rect.left - options.dragHandleWidth - 1;

      dragHandleElement.style.position = "fixed";
      dragHandleElement.style.top = `${top}px`;
      dragHandleElement.style.left = `${left}px`;
    }

    dragHandleElement?.classList.remove("column-list-drag-handle-hidden");
  };

  const hideDragHandle = () => {
    if (!dragHandleElement?.classList.contains("column-list-drag-handle-hidden")) {
      dragHandleElement?.classList.add("column-list-drag-handle-hidden");
    }
    currentColumnListElement = null;
  };

  const view = (view: EditorView, sideMenu: HTMLDivElement | null) => {
    dragHandleElement = createColumnListDragHandleElement();
    dragHandleElement.addEventListener("dragstart", (e) => handleDragStart(e, view));
    dragHandleElement.addEventListener("dragend", (e) => handleDragEnd(e, view));
    dragHandleElement.addEventListener("click", (e) => handleClick(e, view));
    dragHandleElement.addEventListener("contextmenu", (e) => handleClick(e, view));

    const dragOverHandler = (e: DragEvent) => {
      e.preventDefault();
      if (isDragging) lastClientY = e.clientY;
    };

    const mouseMoveHandler = (e: MouseEvent) => {
      if (isMouseInsideWhileDragging) handleDragEnd(e, view);
    };

    const dragLeaveHandler = (e: DragEvent) => {
      if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        isMouseInsideWhileDragging = true;
        isDraggedOutsideWindow = lastClientY < window.innerHeight / 2 ? "top" : "bottom";
      }
    };

    const dragEnterHandler = () => {
      isDraggedOutsideWindow = false;
    };

    window.addEventListener("dragleave", dragLeaveHandler);
    window.addEventListener("dragenter", dragEnterHandler);
    document.addEventListener("dragover", dragOverHandler);
    document.addEventListener("mousemove", mouseMoveHandler);

    hideDragHandle();
    sideMenu?.appendChild(dragHandleElement);

    return {
      destroy: () => {
        dragHandleElement?.remove?.();
        dragHandleElement = null;
        isDragging = false;
        if (scrollAnimationFrame) {
          cancelAnimationFrame(scrollAnimationFrame);
          scrollAnimationFrame = null;
        }
        window.removeEventListener("dragleave", dragLeaveHandler);
        window.removeEventListener("dragenter", dragEnterHandler);
        document.removeEventListener("dragover", dragOverHandler);
        document.removeEventListener("mousemove", mouseMoveHandler);
      },
    };
  };

  const domEvents = {
    mousemove: (view: EditorView, event: MouseEvent) => {
      // Check if mouse is over an element inside a columnList
      // Add offset to detect columnList when hovering slightly to the left
      const columnList = findColumnListAtCoords({
        x: event.clientX + 50 + options.dragHandleWidth,
        y: event.clientY,
      });

      if (columnList) {
        currentColumnListElement = columnList;
        showDragHandle(view);
      } else {
        hideDragHandle();
      }
    },
    dragenter: (view: EditorView) => {
      view.dom.classList.add("dragging");
      hideDragHandle();
    },
    drop: (view: EditorView) => {
      view.dom.classList.remove("dragging");
      hideDragHandle();
    },
    dragend: (view: EditorView) => {
      view.dom.classList.remove("dragging");
    },
  };

  return { view, domEvents };
};
