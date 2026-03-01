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

import type { Node as ProseMirrorNode, Schema } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorState } from "@tiptap/pm/state";
import { dropPoint } from "@tiptap/pm/transform";
import type { EditorView } from "@tiptap/pm/view";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";
// extensions
import { canCreateColumns } from "@/plane-editor/extensions/multi-column/column-drop";
// utils
import { EDGE_OUTSIDE_THRESHOLD, getTargetBlockInfo, isInsideColumn, isInsideColumnStructure } from "./utils";
import { columnResizePluginKey } from "@/plane-editor/extensions/multi-column/column/plugins/column-resize";

// Helper function to check if a node is a list item for column cursor purposes
function isListItemNode(node: ProseMirrorNode): boolean {
  return [CORE_EXTENSIONS.LIST_ITEM, CORE_EXTENSIONS.TASK_ITEM].includes(node.type.name as CORE_EXTENSIONS);
}

// Helper function to wrap list items in a list for column cursor purposes
function wrapListItemForColumnCheck(node: ProseMirrorNode, schema: Schema): ProseMirrorNode {
  if (!isListItemNode(node)) return node;
  const listNodeType = schema.nodes.bulletList;
  if (!listNodeType) return node;
  return listNodeType.create(null, [node]);
}

export const DropCursorPluginKey = new PluginKey("DropCursor");

interface DropCursorOptions {
  /// The color of the cursor. Defaults to `black`. Use `false` to apply no color and rely only on class.
  color?: string | false;
  /// The precise width of the cursor in pixels. Defaults to 1.
  width?: number;
  /// A CSS class name to add to the cursor element.
  class?: string;
  /// Whether multi-column is flagged (prevents column creation)
  isMultiColumnFlagged: boolean;
}

interface CursorPosition {
  pos: number;
  orientation: "vertical" | "horizontal";
  side?: "left" | "right";
}

declare module "@tiptap/pm/model" {
  interface NodeSpec {
    disableDropCursor?:
      | boolean
      | ((view: EditorView, pos: { pos: number; inside: number }, event: DragEvent) => boolean);
  }
}

export function DropCursorPlugin(options: DropCursorOptions): Plugin {
  return new Plugin({
    key: DropCursorPluginKey,
    view(editorView) {
      return new DropCursorView(editorView, options);
    },
    props: {
      handleDrop(_view, e) {
        return !!(e.target as HTMLElement)?.closest?.("[data-drop-target-active]");
      },
    },
  });
}

class DropCursorView {
  private width: number;
  private color: string | undefined;
  private class: string | undefined;
  private isMultiColumnFlagged: boolean;
  private cursorPos: CursorPosition | null = null;
  private element: HTMLElement | null = null;
  private timeout: ReturnType<typeof setTimeout> | number = -1;
  private handlers: { name: string; handler: (event: Event) => void }[];

  constructor(
    readonly editorView: EditorView,
    options: DropCursorOptions
  ) {
    this.width = options.width ?? 1;
    this.color = options.color === false ? undefined : options.color || "black";
    this.class = options.class;
    this.isMultiColumnFlagged = options.isMultiColumnFlagged;

    this.handlers = ["dragover", "dragend", "drop", "dragleave"].map((name) => {
      const handler = (e: Event) => {
        const method = this[name as keyof this];
        if (typeof method === "function") {
          (method as (event: Event) => void).call(this, e);
        }
      };
      editorView.dom.addEventListener(name, handler);
      return { name, handler };
    });
  }

  destroy() {
    this.handlers.forEach(({ name, handler }) => this.editorView.dom.removeEventListener(name, handler));
  }

  update(editorView: EditorView, prevState: EditorState) {
    if (this.cursorPos != null && prevState.doc != editorView.state.doc) {
      if (this.cursorPos.pos > editorView.state.doc.content.size) {
        this.setCursor(null);
      } else {
        this.updateOverlay();
      }
    }
  }

  private setCursor(cursorPos: CursorPosition | null) {
    if (
      cursorPos?.pos === this.cursorPos?.pos &&
      cursorPos?.orientation === this.cursorPos?.orientation &&
      cursorPos?.side === this.cursorPos?.side
    ) {
      return;
    }

    // If orientation changed, remove the element to avoid animation artifacts
    if (this.cursorPos && cursorPos && this.cursorPos.orientation !== cursorPos.orientation) {
      if (this.element?.parentNode) {
        this.element.parentNode.removeChild(this.element);
        this.element = null;
      }
    }

    this.cursorPos = cursorPos;
    if (cursorPos == null) {
      if (this.element?.parentNode) {
        this.element.parentNode.removeChild(this.element);
        this.element = null;
      }
    } else {
      this.updateOverlay();
    }
  }

  private updateOverlay() {
    const rect = this.calculateCursorRect();
    if (!rect) return;

    const editorDOM = this.editorView.dom;
    const editorRect = editorDOM.getBoundingClientRect();
    const scaleX = editorRect.width / editorDOM.offsetWidth;
    const scaleY = editorRect.height / editorDOM.offsetHeight;

    const parent = this.editorView.dom.offsetParent as HTMLElement;
    if (!parent) return;

    if (!this.element) {
      this.element = parent.appendChild(document.createElement("div"));
      if (this.class) this.element.className = this.class;
      this.element.style.cssText = "position: absolute; z-index: 50; pointer-events: none;";
      if (this.color) {
        this.element.style.backgroundColor = this.color;
      } else if (this.class) {
        this.element.style.backgroundColor = "currentColor";
      }
    }

    const isBlock = this.cursorPos!.orientation === "horizontal";
    this.element.classList.toggle("prosemirror-dropcursor-block", isBlock);
    this.element.classList.toggle("prosemirror-dropcursor-inline", !isBlock);

    let parentLeft, parentTop;
    if (!parent || (parent == document.body && getComputedStyle(parent).position == "static")) {
      parentLeft = -pageXOffset;
      parentTop = -pageYOffset;
    } else {
      const rect = parent.getBoundingClientRect();
      const parentScaleX = rect.width / parent.offsetWidth;
      const parentScaleY = rect.height / parent.offsetHeight;
      parentLeft = rect.left - parent.scrollLeft * parentScaleX;
      parentTop = rect.top - parent.scrollTop * parentScaleY;
    }

    this.element.style.left = (rect.left - parentLeft) / scaleX + "px";
    this.element.style.top = (rect.top - parentTop) / scaleY + "px";
    this.element.style.width = (rect.right - rect.left) / scaleX + "px";
    this.element.style.height = (rect.bottom - rect.top) / scaleY + "px";
  }

  private calculateCursorRect(): { left: number; right: number; top: number; bottom: number } | null {
    if (!this.cursorPos) return null;

    const editorDOM = this.editorView.dom;
    const editorRect = editorDOM.getBoundingClientRect();
    const scaleX = editorRect.width / editorDOM.offsetWidth;
    const scaleY = editorRect.height / editorDOM.offsetHeight;

    // COLUMN-SPECIFIC: Handle vertical (edge) drop cursor
    if (this.cursorPos.orientation === "vertical") {
      const block = this.editorView.nodeDOM(this.cursorPos.pos) as HTMLElement;
      if (!block) return null;

      const rect = block.getBoundingClientRect();
      const edgeX = this.cursorPos.side === "right" ? rect.right : rect.left;
      const halfWidth = (this.width / 2) * scaleX;

      return { left: edgeX - halfWidth, right: edgeX + halfWidth, top: rect.top, bottom: rect.bottom };
    }

    // Standard horizontal drop cursor (same as original)
    const $pos = this.editorView.state.doc.resolve(this.cursorPos.pos);
    const isBlock = !$pos.parent.inlineContent;
    let rect;

    if (isBlock) {
      const before = $pos.nodeBefore;
      const after = $pos.nodeAfter;
      if (before || after) {
        const node = this.editorView.nodeDOM(this.cursorPos.pos - (before ? before.nodeSize : 0));
        if (node) {
          const nodeRect = (node as HTMLElement).getBoundingClientRect();
          let top = before ? nodeRect.bottom : nodeRect.top;
          if (before && after) {
            top = (top + (this.editorView.nodeDOM(this.cursorPos.pos) as HTMLElement).getBoundingClientRect().top) / 2;
          }
          const halfWidth = (this.width / 2) * scaleY;
          rect = { left: nodeRect.left, right: nodeRect.right, top: top - halfWidth, bottom: top + halfWidth };
        }
      }
    }

    if (!rect) {
      const coords = this.editorView.coordsAtPos(this.cursorPos.pos);
      const halfWidth = (this.width / 2) * scaleX;
      rect = { left: coords.left - halfWidth, right: coords.left + halfWidth, top: coords.top, bottom: coords.bottom };
    }

    return rect;
  }

  private scheduleRemoval(timeout: number) {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.setCursor(null), timeout);
  }

  dragover(event: DragEvent) {
    if (!this.editorView.editable) return;
    if ((event.target as HTMLElement)?.closest?.("[data-drop-target-active]")) {
      this.setCursor(null);
      return;
    }
    const pos = this.editorView.posAtCoords({ left: event.clientX, top: event.clientY });

    // Check disableDropCursor (same as original)
    const node = pos && pos.inside >= 0 && this.editorView.state.doc.nodeAt(pos.inside);
    const disableDropCursor = node && node.type.spec.disableDropCursor;
    const disabled =
      typeof disableDropCursor == "function" ? disableDropCursor(this.editorView, pos!, event) : disableDropCursor;

    if (!pos || disabled) {
      this.setCursor(null);
      return;
    }

    const dragging = this.editorView.dragging;
    if (!dragging?.slice) {
      this.setCursor(null);
      return;
    }

    const columnResizeState = columnResizePluginKey.getState(this.editorView.state);
    if (columnResizeState && columnResizeState.type !== "default") {
      this.setCursor(null);
      return;
    }

    const blockInfo = getTargetBlockInfo(this.editorView.state, pos);
    if (!blockInfo.node) {
      this.setCursor(null);
      return;
    }

    if (dragging.slice.content.childCount === 0) {
      this.setCursor(null);
      return;
    }
    const draggedNode = dragging.slice.content.child(0);
    const block = this.editorView.nodeDOM(blockInfo.pos) as HTMLElement;
    if (!block) {
      this.setCursor(null);
      return;
    }

    // Prevent nesting columns inside column structures
    if (
      [ADDITIONAL_EXTENSIONS.COLUMN, ADDITIONAL_EXTENSIONS.COLUMN_LIST].includes(
        draggedNode.type.name as ADDITIONAL_EXTENSIONS
      ) &&
      isInsideColumnStructure(this.editorView.state.doc.resolve(pos.pos))
    ) {
      this.setCursor(null);
      return;
    }

    const rect = block.getBoundingClientRect();
    const distanceOutsideLeft = rect.left - event.clientX;
    const distanceOutsideRight = event.clientX - rect.right;

    // Show vertical indicator only when cursor is outside the block but within
    // EDGE_OUTSIDE_THRESHOLD px of the block edge (a narrow band just outside)
    const isLeftEdge = distanceOutsideLeft > 0 && distanceOutsideLeft <= EDGE_OUTSIDE_THRESHOLD;
    const isRightEdge = distanceOutsideRight > 0 && distanceOutsideRight <= EDGE_OUTSIDE_THRESHOLD;

    const $blockPos = this.editorView.state.doc.resolve(blockInfo.pos);

    // Wrap list items for column creation check
    const nodeForColumns = wrapListItemForColumnCheck(draggedNode, this.editorView.state.schema);

    // Show vertical cursor for edge drops that can create columns
    // Skip if multi-column is flagged
    if (
      !this.isMultiColumnFlagged &&
      (isLeftEdge || isRightEdge) &&
      !isInsideColumn($blockPos) &&
      canCreateColumns(nodeForColumns, blockInfo.node)
    ) {
      const isPrevSiblingColumn =
        blockInfo.node?.type.name === ADDITIONAL_EXTENSIONS.COLUMN &&
        isLeftEdge &&
        $blockPos.nodeBefore?.type.name === ADDITIONAL_EXTENSIONS.COLUMN;

      if (!isPrevSiblingColumn) {
        this.setCursor({
          pos: blockInfo.pos,
          orientation: "vertical",
          side: isRightEdge ? "right" : "left",
        });
      } else {
        let target = pos.pos;
        if (this.editorView.dragging?.slice) {
          const point = dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice);
          if (point != null) target = point;
        }
        this.setCursor({ pos: target, orientation: "horizontal" });
      }
    } else {
      // Standard horizontal drop cursor
      let target = pos.pos;
      if (this.editorView.dragging && this.editorView.dragging.slice) {
        const point = dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice);
        if (point != null) target = point;
      }
      this.setCursor({ pos: target, orientation: "horizontal" });
    }

    this.scheduleRemoval(5000);
  }

  dragend() {
    this.scheduleRemoval(20);
  }

  drop() {
    this.scheduleRemoval(20);
  }

  dragleave(event: DragEvent) {
    if (!this.editorView.dom.contains(event.relatedTarget as Node)) {
      this.setCursor(null);
    }
  }
}
