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
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";
// types
import { EColumnAttributeNames } from "../../types";

// Find a node by its ID attribute
function getNodeById(id: string, doc: ProseMirrorNode): { node: ProseMirrorNode; posBeforeNode: number } | undefined {
  let result: { node: ProseMirrorNode; posBeforeNode: number } | undefined;
  doc.descendants((node, pos) => {
    if (node.attrs[EColumnAttributeNames.ID] === id && !result) {
      result = { node, posBeforeNode: pos };
      return false;
    }
    return true;
  });
  return result;
}

type ColumnState =
  | { type: "default" }
  | { type: "hover"; leftColumnId: string; rightColumnId: string }
  | {
      type: "resize";
      leftColumnId: string;
      rightColumnId: string;
      startX: number;
      startLeftWidth: number;
      startRightWidth: number;
      totalWidthPx: number;
    };

export const columnResizePluginKey = new PluginKey<ColumnState>("ColumnResizePlugin");

class ColumnResizePluginView {
  private readonly COLUMN_MIN_WIDTH_FRACTION = 0.5;
  private readonly isFlagged: boolean;
  private hoverRafId: number | null = null;
  private resizeRafId: number | null = null;
  private pendingHoverEvent: MouseEvent | null = null;
  private pendingResizeEvent: MouseEvent | null = null;

  constructor(
    private editor: Editor,
    private view: EditorView,
    isFlagged: boolean = false
  ) {
    this.isFlagged = isFlagged;
    this.attachEventListeners();
  }

  private attachEventListeners() {
    this.view.dom.addEventListener("mousedown", this.mouseDownHandler);
    this.view.dom.addEventListener("mousemove", this.mouseMoveHandler);
  }

  private detachEventListeners() {
    this.view.dom.removeEventListener("mousedown", this.mouseDownHandler);
    this.view.dom.removeEventListener("mousemove", this.mouseMoveHandler);
    this.detachDocumentListeners();

    if (this.hoverRafId !== null) {
      cancelAnimationFrame(this.hoverRafId);
      this.hoverRafId = null;
    }
    if (this.resizeRafId !== null) {
      cancelAnimationFrame(this.resizeRafId);
      this.resizeRafId = null;
    }
  }

  private attachDocumentListeners() {
    document.addEventListener("mousemove", this.documentMouseMoveHandler);
    document.addEventListener("mouseup", this.mouseUpHandler);
  }

  private detachDocumentListeners() {
    document.removeEventListener("mousemove", this.documentMouseMoveHandler);
    document.removeEventListener("mouseup", this.mouseUpHandler);
  }

  private getColumnHoverOrDefaultState = (event: MouseEvent): ColumnState => {
    if (!this.editor.isEditable) {
      return { type: "default" };
    }

    // Don't show resize handle when multi-column is flagged
    if (this.isFlagged) {
      return { type: "default" };
    }

    // Don't show resize handle when dragging a column list or individual column
    if (this.view.dom.classList.contains("column-dragging")) {
      return { type: "default" };
    }

    const target = event.target as HTMLElement;

    if (!this.view.dom.contains(target)) {
      return { type: "default" };
    }

    const mouseX = event.clientX;

    const columnListElement = target.closest(".editor-column-list");

    if (!columnListElement) {
      return { type: "default" };
    }

    const gap = parseFloat(getComputedStyle(columnListElement).gap || "0");
    const columns = Array.from(columnListElement.querySelectorAll(".editor-column"));

    if (columns.length < 2) {
      return { type: "default" };
    }

    for (let i = 0; i < columns.length - 1; i++) {
      const leftColumn = columns[i];
      const rightColumn = columns[i + 1];

      if (!(leftColumn instanceof HTMLElement) || !(rightColumn instanceof HTMLElement)) {
        continue;
      }

      const leftRect = leftColumn.getBoundingClientRect();
      const handleLeftEdge = leftRect.right + gap / 2 + 2;
      const handleRightEdge = handleLeftEdge + 4;
      const detectionStart = handleLeftEdge - 6;
      const detectionEnd = handleRightEdge + 6;
      const isNearResizeHandle = mouseX >= detectionStart && mouseX <= detectionEnd;

      if (isNearResizeHandle) {
        const leftColumnId = leftColumn.getAttribute("data-id");
        const rightColumnId = rightColumn.getAttribute("data-id");

        if (!leftColumnId || !rightColumnId) {
          continue;
        }

        if (!getNodeById(leftColumnId, this.view.state.doc) || !getNodeById(rightColumnId, this.view.state.doc)) {
          continue;
        }

        return {
          type: "hover",
          leftColumnId,
          rightColumnId,
        };
      }
    }

    return { type: "default" };
  };

  private mouseDownHandler = (event: MouseEvent) => {
    // Prevent column resize when flagged
    if (this.isFlagged) {
      return;
    }

    const hoverState = this.getColumnHoverOrDefaultState(event);
    if (hoverState.type === "default") {
      return;
    }

    event.preventDefault();

    const leftColumnData = getNodeById(hoverState.leftColumnId, this.view.state.doc);
    const rightColumnData = getNodeById(hoverState.rightColumnId, this.view.state.doc);

    if (!leftColumnData || !rightColumnData) {
      return;
    }

    const leftElement = this.view.dom.querySelector(`[data-id="${hoverState.leftColumnId}"]`) as HTMLElement;
    const rightElement = this.view.dom.querySelector(`[data-id="${hoverState.rightColumnId}"]`) as HTMLElement;

    if (!leftElement || !rightElement) {
      return;
    }

    const leftRect = leftElement.getBoundingClientRect();
    const rightRect = rightElement.getBoundingClientRect();
    const totalWidthPx = leftRect.width + rightRect.width;

    const resizeState: ColumnState = {
      type: "resize",
      leftColumnId: hoverState.leftColumnId,
      rightColumnId: hoverState.rightColumnId,
      startX: event.clientX,
      startLeftWidth: leftColumnData.node.attrs[EColumnAttributeNames.WIDTH] as number,
      startRightWidth: rightColumnData.node.attrs[EColumnAttributeNames.WIDTH] as number,
      totalWidthPx,
    };

    this.attachDocumentListeners();

    this.view.dispatch(this.view.state.tr.setMeta(columnResizePluginKey, resizeState));
  };

  private mouseMoveHandler = (event: MouseEvent) => {
    this.pendingHoverEvent = event;

    if (this.hoverRafId !== null) {
      return;
    }

    this.hoverRafId = requestAnimationFrame(() => {
      this.hoverRafId = null;

      if (!this.pendingHoverEvent) {
        return;
      }

      const event = this.pendingHoverEvent;
      this.pendingHoverEvent = null;

      const pluginState = columnResizePluginKey.getState(this.view.state);
      if (!pluginState) {
        return;
      }

      if (pluginState.type === "resize") {
        return;
      }

      const newState = this.getColumnHoverOrDefaultState(event);

      const bothDefaultStates = pluginState.type === "default" && newState.type === "default";
      const sameColumnIds =
        pluginState.type === "hover" &&
        newState.type === "hover" &&
        pluginState.leftColumnId === newState.leftColumnId &&
        pluginState.rightColumnId === newState.rightColumnId;

      if (bothDefaultStates || sameColumnIds) {
        return;
      }

      const tr = this.view.state.tr.setMeta(columnResizePluginKey, newState);
      tr.setMeta("addToHistory", false);
      this.view.dispatch(tr);
    });
  };

  private documentMouseMoveHandler = (event: MouseEvent) => {
    this.pendingResizeEvent = event;

    if (this.resizeRafId !== null) {
      return;
    }

    this.resizeRafId = requestAnimationFrame(() => {
      this.resizeRafId = null;

      if (!this.pendingResizeEvent) {
        return;
      }

      const event = this.pendingResizeEvent;
      this.pendingResizeEvent = null;

      const pluginState = columnResizePluginKey.getState(this.view.state);
      if (!pluginState || pluginState.type !== "resize") {
        return;
      }

      this.handleResize(event, pluginState);
    });
  };

  private handleResize = (event: MouseEvent, pluginState: Extract<ColumnState, { type: "resize" }>) => {
    const deltaX = event.clientX - pluginState.startX;

    const widthChangePercent = deltaX / pluginState.totalWidthPx;

    let newLeftWidth = pluginState.startLeftWidth + widthChangePercent;
    let newRightWidth = pluginState.startRightWidth - widthChangePercent;

    // Ensure that the column widths do not go below the minimum width.
    const minWidth = this.COLUMN_MIN_WIDTH_FRACTION;
    if (newLeftWidth < minWidth) {
      newRightWidth -= minWidth - newLeftWidth;
      newLeftWidth = minWidth;
    } else if (newRightWidth < minWidth) {
      newLeftWidth -= minWidth - newRightWidth;
      newRightWidth = minWidth;
    }

    const leftColumnData = getNodeById(pluginState.leftColumnId, this.view.state.doc);
    const rightColumnData = getNodeById(pluginState.rightColumnId, this.view.state.doc);

    if (!leftColumnData || !rightColumnData) {
      return;
    }

    this.view.dispatch(
      this.view.state.tr
        .setNodeAttribute(leftColumnData.posBeforeNode, EColumnAttributeNames.WIDTH, newLeftWidth)
        .setNodeAttribute(rightColumnData.posBeforeNode, EColumnAttributeNames.WIDTH, newRightWidth)
        .setMeta("addToHistory", false)
    );
  };

  private mouseUpHandler = (event: MouseEvent) => {
    const pluginState = columnResizePluginKey.getState(this.view.state);
    if (!pluginState || pluginState.type !== "resize") {
      return;
    }

    if (this.resizeRafId !== null) {
      cancelAnimationFrame(this.resizeRafId);
      this.resizeRafId = null;
      this.pendingResizeEvent = null;
    }

    this.detachDocumentListeners();

    // Get the final column widths and commit to history
    const leftColumnData = getNodeById(pluginState.leftColumnId, this.view.state.doc);
    const rightColumnData = getNodeById(pluginState.rightColumnId, this.view.state.doc);

    const newState = this.getColumnHoverOrDefaultState(event);
    const tr = this.view.state.tr.setMeta(columnResizePluginKey, newState);

    // Commit the final resize state to history (addToHistory defaults to true)
    if (leftColumnData && rightColumnData) {
      const leftWidth = leftColumnData.node.attrs[EColumnAttributeNames.WIDTH] as number;
      const rightWidth = rightColumnData.node.attrs[EColumnAttributeNames.WIDTH] as number;

      // Only add to history if widths actually changed from the start
      if (leftWidth !== pluginState.startLeftWidth || rightWidth !== pluginState.startRightWidth) {
        tr.setNodeAttribute(leftColumnData.posBeforeNode, EColumnAttributeNames.WIDTH, leftWidth);
        tr.setNodeAttribute(rightColumnData.posBeforeNode, EColumnAttributeNames.WIDTH, rightWidth);
      }
    }

    this.view.dispatch(tr);
  };

  destroy() {
    this.detachEventListeners();
  }
}

export const createColumnResizePlugin = (editor: Editor, isFlagged: boolean) =>
  new Plugin({
    key: columnResizePluginKey,

    state: {
      init: () => ({ type: "default" }) as ColumnState,
      apply: (tr, oldPluginState) => {
        const newPluginState = tr.getMeta(columnResizePluginKey) as ColumnState | undefined;
        return newPluginState === undefined ? oldPluginState : newPluginState;
      },
    },

    props: {
      decorations: (state) => {
        const pluginState = columnResizePluginKey.getState(state);
        if (!pluginState || pluginState.type === "default") return DecorationSet.empty;

        const leftColumnData = getNodeById(pluginState.leftColumnId, state.doc);
        const rightColumnData = getNodeById(pluginState.rightColumnId, state.doc);

        if (!leftColumnData || !rightColumnData) {
          return DecorationSet.empty;
        }

        const isResizing = pluginState.type === "resize";
        const leftColumnClass = isResizing ? "column-resize-active" : "column-resize-hover";

        return DecorationSet.create(state.doc, [
          Decoration.node(leftColumnData.posBeforeNode, leftColumnData.posBeforeNode + leftColumnData.node.nodeSize, {
            class: leftColumnClass,
            style: `cursor: col-resize;`,
          }),
          Decoration.node(
            rightColumnData.posBeforeNode,
            rightColumnData.posBeforeNode + rightColumnData.node.nodeSize,
            { style: `cursor: col-resize;` }
          ),
        ]);
      },
    },

    view: (view) => new ColumnResizePluginView(editor, view, isFlagged),
  });
