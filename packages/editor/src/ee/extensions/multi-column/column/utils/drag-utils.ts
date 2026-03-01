/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Editor } from "@tiptap/core";
import { updateColumnDragMeta } from "../../plugins/drag-state";

/**
 * @description Construct a pseudo column element for drag preview.
 * @param {HTMLElement} columnElement - The column element to clone.
 * @returns {HTMLElement} The preview element.
 */
export const constructColumnDragPreview = (columnElement: HTMLElement | null): HTMLElement => {
  const preview = document.createElement("div");
  preview.classList.add("column-drag-preview");
  preview.style.cssText = `
    position: fixed;
    z-index: 10000;
    pointer-events: none;
    opacity: 0.9;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    border: 2px solid var(--border-color-accent-strong);
    border-radius: 0.375rem;
    background-color: var(--background-color-surface-1);
    overflow: hidden;
  `;

  if (columnElement) {
    const cloned = columnElement.cloneNode(true) as HTMLElement;

    // Copy computed styles from original
    const computedStyle = window.getComputedStyle(columnElement);
    const skipProperties = new Set(["position", "top", "left", "right", "bottom", "transform"]);

    for (let i = 0; i < computedStyle.length; i++) {
      const property = computedStyle[i];
      if (skipProperties.has(property)) continue;

      try {
        const value = computedStyle.getPropertyValue(property);
        cloned.style.setProperty(property, value);
      } catch {
        // Skip read-only properties
      }
    }

    const columnRect = columnElement.getBoundingClientRect();
    const dimension = `${columnRect.width}px`;
    const height = `${columnRect.height}px`;

    // Set exact dimensions
    Object.assign(cloned.style, {
      width: dimension,
      height,
      minWidth: dimension,
      minHeight: height,
      maxWidth: dimension,
      maxHeight: height,
      position: "static",
      visibility: "visible",
    });

    // Remove drag handle from preview
    cloned.querySelectorAll(".column-drag-handle-container, .ProseMirror-widget").forEach((el) => el.remove());

    preview.appendChild(cloned);
  }

  document.body.appendChild(preview);
  return preview;
};

/**
 * @description Hide column content using decorations (local only, not persisted).
 * @param {Editor} editor - The editor instance.
 * @param {number} columnPos - The position of the column to hide.
 */
export const hideColumnContent = (editor: Editor, columnPos: number): void => {
  const tr = editor.view.state.tr;
  updateColumnDragMeta(tr, columnPos);
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
};

/**
 * @description Show column content by clearing decorations.
 * @param {Editor} editor - The editor instance.
 */
export const showColumnContent = (editor: Editor): void => {
  const tr = editor.view.state.tr;
  updateColumnDragMeta(tr, null);
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
};
