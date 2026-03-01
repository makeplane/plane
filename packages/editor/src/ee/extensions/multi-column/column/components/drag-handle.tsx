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

import {
  shift,
  flip,
  useDismiss,
  useFloating,
  useInteractions,
  autoUpdate,
  useClick,
  useRole,
  FloatingPortal,
  FloatingOverlay,
} from "@floating-ui/react";
import type { Editor } from "@tiptap/core";
import { Ellipsis } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn, ADDITIONAL_EXTENSIONS } from "@plane/utils";
import {
  calculateColumnDropIndex,
  findColumnAtPos,
  findColumnList,
  getColumnListColumns,
  moveColumn,
} from "../../utils";
import { setSelectedColumn } from "../plugins/selection-outline";
import { ColumnOptionsDropdown } from "./drag-handle-dropdown";
import { constructColumnDragPreview } from "../utils/drag-utils";

const DROP_MARKER_THICKNESS = 4;

const createDropIndicator = (rect: DOMRect): HTMLElement => {
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
};

/**
 * Recursively copy computed styles from source to target element
 * Skips positioning properties to avoid conflicts
 */
const copyComputedStyles = (sourceElement: Element, targetElement: Element): void => {
  if (!(sourceElement instanceof HTMLElement) || !(targetElement instanceof HTMLElement)) return;

  const computedStyle = window.getComputedStyle(sourceElement);
  const skipProperties = new Set(["position", "top", "left", "right", "bottom", "transform"]);

  // Copy computed styles efficiently
  for (let i = 0; i < computedStyle.length; i++) {
    const property = computedStyle[i];
    if (skipProperties.has(property)) continue;

    try {
      const value = computedStyle.getPropertyValue(property);
      targetElement.style.setProperty(property, value);
    } catch {
      // Skip read-only properties silently
    }
  }

  // Recursively copy styles for child elements
  const sourceChildren = sourceElement.children;
  const targetChildren = targetElement.children;
  const minLength = Math.min(sourceChildren.length, targetChildren.length);

  for (let i = 0; i < minLength; i++) {
    copyComputedStyles(sourceChildren[i], targetChildren[i]);
  }
};

const createDragPreview = (columnElement: HTMLElement | null, clientX: number, clientY: number): HTMLElement => {
  const preview = constructColumnDragPreview(columnElement);
  preview.style.left = `${clientX + 10}px`;
  preview.style.top = `${clientY + 10}px`;
  return preview;
};

export type ColumnDragHandleProps = {
  columnPos: number;
  editor: Editor;
};

export const ColumnDragHandle: React.FC<ColumnDragHandleProps> = ({ columnPos, editor }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const hasDraggedRef = useRef(false);
  // Track active event listeners for cleanup
  const activeListenersRef = useRef<{
    mouseup?: (e: MouseEvent) => void;
    mousemove?: (e: MouseEvent) => void;
  }>({});

  if (!editor.isEditable) {
    return null;
  }

  const handleOpenChange = useCallback(
    (open: boolean) => {
      // Prevent opening dropdown if we just dragged
      if (open && hasDraggedRef.current) {
        // Reset the flag and prevent opening
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 0);
        return;
      }

      // Highlight the column when dropdown opens, clear when it closes
      if (open) {
        setSelectedColumn(editor, columnPos);
      } else {
        setSelectedColumn(editor, null);
      }

      setIsDropdownOpen(open);
    },
    [editor, columnPos]
  );

  const { refs, floatingStyles, context } = useFloating({
    placement: "bottom-start",
    middleware: [
      flip({
        fallbackPlacements: ["top-start", "bottom-start", "top-end", "bottom-end"],
      }),
      shift({
        padding: 8,
      }),
    ],
    open: isDropdownOpen,
    onOpenChange: handleOpenChange,
    whileElementsMounted: autoUpdate,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useDismiss(context),
    useClick(context),
    useRole(context),
  ]);

  useEffect(() => {
    const listenersRef = activeListenersRef.current;
    return () => {
      // Clear column selection on unmount
      setSelectedColumn(editor, null);

      // Cleanup drag operation on unmount
      if (dragCleanupRef.current) {
        dragCleanupRef.current();
        dragCleanupRef.current = null;
      }
      // Remove any lingering window event listeners when component unmounts
      if (listenersRef.mouseup) {
        window.removeEventListener("mouseup", listenersRef.mouseup);
      }
      if (listenersRef.mousemove) {
        window.removeEventListener("mousemove", listenersRef.mousemove);
      }
    };
  }, [editor]);

  useEffect(() => {
    if (!isDropdownOpen) return;

    // Close dropdown on Escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Close dropdown if the column no longer exists (e.g., deleted)
    const handleEditorUpdate = () => {
      const node = editor.state.doc.nodeAt(columnPos);
      if (!node || node.type.name !== (ADDITIONAL_EXTENSIONS.COLUMN as string)) {
        setIsDropdownOpen(false);
      }
    };

    // Subscribe to editor updates
    editor.on("update", handleEditorUpdate);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      editor.off("update", handleEditorUpdate);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen, editor, columnPos]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Prevent non-left-click
      if (e.button !== 0) return;

      e.stopPropagation();
      e.preventDefault();

      // Cleanup any existing drag operation
      if (activeListenersRef.current.mouseup) {
        window.removeEventListener("mouseup", activeListenersRef.current.mouseup);
        activeListenersRef.current.mouseup = undefined;
      }
      if (activeListenersRef.current.mousemove) {
        window.removeEventListener("mousemove", activeListenersRef.current.mousemove);
        activeListenersRef.current.mousemove = undefined;
      }
      if (dragCleanupRef.current) {
        dragCleanupRef.current();
        dragCleanupRef.current = null;
      }

      // Validate column exists
      const columnInfo = findColumnAtPos(editor.state, columnPos);
      const columnListInfo = findColumnList(editor.state, columnPos);
      if (!columnInfo || !columnListInfo) return;

      const columns = getColumnListColumns(columnListInfo, editor);
      const currentIndex = columns.findIndex((column) => column.pos === columnPos);
      if (currentIndex === -1) return;

      const columnListElement = editor.view.nodeDOM(columnListInfo.pos) as HTMLElement | null;
      const currentColumnElement = editor.view.nodeDOM(columnPos) as HTMLElement | null;
      if (!columnListElement) return;

      const columnListRect = columnListElement.getBoundingClientRect();
      const startLeft = columns[currentIndex].left ?? 0;
      const startX = e.clientX;
      let dropIndex = currentIndex;

      // Lazy-create markers (only created on first move)
      let dropIndicator: HTMLElement | null = null;
      let floatingPreview: HTMLElement | null = null;

      const handleFinish = () => {
        // Cleanup visual elements
        dropIndicator?.remove();
        floatingPreview?.remove();
        editor.view.dom.classList.remove("column-dragging");

        // Apply column swap if position changed
        if (currentIndex !== dropIndex && hasDraggedRef.current) {
          const tr = moveColumn(editor.state.tr, columnListInfo.pos, currentIndex, dropIndex, editor.state);
          editor.view.dispatch(tr);
        }

        // Remove event listeners
        window.removeEventListener("mouseup", handleFinish);
        window.removeEventListener("mousemove", handleMove);
        activeListenersRef.current.mouseup = undefined;
        activeListenersRef.current.mousemove = undefined;
        dragCleanupRef.current = null;
      };

      const handleMove = (moveEvent: MouseEvent) => {
        const currentLeft = startLeft + moveEvent.clientX - startX;
        dropIndex = calculateColumnDropIndex(currentIndex, columns, currentLeft);

        // Create markers on first move
        if (!dropIndicator || !floatingPreview) {
          dropIndicator = createDropIndicator(columnListRect);
          floatingPreview = createDragPreview(currentColumnElement, moveEvent.clientX, moveEvent.clientY);
          editor.view.dom.classList.add("column-dragging");
        }

        const updatedRect = columnListElement.getBoundingClientRect();
        const targetColumn = columns[dropIndex];
        if (!targetColumn || targetColumn.left == null || targetColumn.width == null) return;

        const gap = columnListElement ? parseFloat(getComputedStyle(columnListElement).gap || "0") : 0;
        const dropMarkerLeftPx = dropIndex === 0 ? 0 : targetColumn.left - gap / 2;

        dropIndicator.style.left = `${updatedRect.left + dropMarkerLeftPx - Math.floor(DROP_MARKER_THICKNESS / 2)}px`;
        dropIndicator.style.top = `${updatedRect.top}px`;
        dropIndicator.style.height = `${updatedRect.height}px`;

        floatingPreview.style.left = `${moveEvent.clientX + 10}px`;
        floatingPreview.style.top = `${moveEvent.clientY + 10}px`;
      };

      // Attach event listeners
      activeListenersRef.current.mouseup = handleFinish;
      activeListenersRef.current.mousemove = handleMove;
      window.addEventListener("mouseup", handleFinish);
      window.addEventListener("mousemove", handleMove);
      dragCleanupRef.current = handleFinish;
    },
    [editor, columnPos]
  );

  return (
    <>
      <div className="column-drag-handle-container absolute z-20 top-0 left-0 flex justify-center items-center w-full -translate-y-1/2">
        <button
          ref={refs.setReference}
          {...getReferenceProps()}
          type="button"
          onMouseDown={handleMouseDown}
          className={cn("px-1 bg-layer-1 border border-strong-1 rounded-sm outline-none transition-all duration-200", {
            "!opacity-100 bg-accent-primary border-accent-strong": isDropdownOpen,
            "hover:bg-layer-1-hover": !isDropdownOpen,
          })}
          aria-label="Column options and drag handle"
        >
          <Ellipsis className="size-4 text-primary" />
        </button>
      </div>
      {isDropdownOpen && (
        <FloatingPortal>
          {/* Backdrop */}
          <FloatingOverlay
            style={{
              zIndex: 99,
            }}
            lockScroll
          />
          <div
            className="max-h-[90vh] w-[12rem] overflow-y-auto rounded-md border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 shadow-custom-shadow-rg"
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{
              ...floatingStyles,
              zIndex: 100,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ColumnOptionsDropdown editor={editor} columnPos={columnPos} onClose={() => context.onOpenChange(false)} />
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
