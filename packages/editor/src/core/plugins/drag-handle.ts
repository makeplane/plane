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

import type { Node, Schema } from "@tiptap/pm/model";
import { Fragment, Slice } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// extensions
import type { SideMenuHandleOptions, SideMenuPluginProps } from "@/extensions";
import { canCreateColumns, handleColumnDrop } from "@/plane-editor/extensions/multi-column/column-drop";
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";
// utils
import { EDGE_OUTSIDE_THRESHOLD, isInsideColumn, isInsideColumnStructure } from "./utils";
import { columnResizePluginKey } from "@/plane-editor/extensions/multi-column/column/plugins/column-resize";
import type { Editor } from "@tiptap/core";
import type { MultiColumnExtensionOptions } from "src/ee/extensions/multi-column/types";

// Helper function to get isFlagged from editor extension options
function getIsMultiColumnFlagged(editor: Editor): boolean {
  const multiColumnExt = editor.extensionManager.extensions.find(
    (ext) => ext.name === ADDITIONAL_EXTENSIONS.MULTI_COLUMN
  );
  if (!multiColumnExt) return false;
  const multiColumnExtensionOptions = multiColumnExt.options as MultiColumnExtensionOptions;
  return !!multiColumnExtensionOptions?.isFlagged;
}

// Helper function to wrap list items in a list for column creation
function wrapListItemForColumnDrop(node: Node, schema: Schema, listType: string): Node {
  const isListItem = [CORE_EXTENSIONS.LIST_ITEM, CORE_EXTENSIONS.TASK_ITEM].includes(node.type.name as CORE_EXTENSIONS);
  if (!isListItem) return node;

  const listNodeType = listType === "OL" ? schema.nodes.orderedList : schema.nodes.bulletList;
  if (!listNodeType) return node;

  return listNodeType.create(null, [node]);
}

const verticalEllipsisIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>';

const generalSelectors = [
  "li",
  "p.editor-paragraph-block:not(:first-child)",
  ".code-block",
  "blockquote",
  "h1.editor-heading-block, h2.editor-heading-block, h3.editor-heading-block, h4.editor-heading-block, h5.editor-heading-block, h6.editor-heading-block",
  "[data-type=horizontalRule]",
  "table:not(.table-drag-preview)",
  ".issue-embed",
  ".image-component",
  ".image-upload-component",
  ".editor-callout-component",
  ".editor-embed-component",
  ".editor-attachment-component",
  ".page-embed-component",
  ".editor-mathematics-component",
  ".editor-drawio-component",
  ".editor-ai-block-node",
].join(", ");

const maxScrollSpeed = 20;
const acceleration = 0.5;
const scrollParentCache = new WeakMap();

function easeOutQuadAnimation(t: number) {
  return t * (2 - t);
}

const createDragHandleElement = (): HTMLElement => {
  const dragHandleElement = document.createElement("button");
  dragHandleElement.type = "button";
  dragHandleElement.id = "drag-handle";
  dragHandleElement.draggable = true;
  dragHandleElement.dataset.dragHandle = "";
  dragHandleElement.classList.value =
    "hidden sm:flex items-center size-5 aspect-square rounded-xs cursor-grab outline-none hover:bg-layer-1-hover active:bg-layer-1 active:cursor-grabbing transition-[background-color,_opacity] duration-200 ease-linear";

  const iconElement1 = document.createElement("span");
  iconElement1.classList.value = "pointer-events-none text-tertiary";
  iconElement1.innerHTML = verticalEllipsisIcon;
  const iconElement2 = document.createElement("span");
  iconElement2.classList.value = "pointer-events-none text-tertiary -ml-2.5";
  iconElement2.innerHTML = verticalEllipsisIcon;

  dragHandleElement.appendChild(iconElement1);
  dragHandleElement.appendChild(iconElement2);

  return dragHandleElement;
};

const isScrollable = (node: HTMLElement | SVGElement) => {
  if (!(node instanceof HTMLElement || node instanceof SVGElement)) return false;
  const style = getComputedStyle(node);
  return ["overflow", "overflow-y"].some((prop) => {
    const value = style.getPropertyValue(prop);
    return value === "auto" || value === "scroll";
  });
};

export const getScrollParent = (node: HTMLElement | SVGElement) => {
  if (scrollParentCache.has(node)) return scrollParentCache.get(node);

  let currentParent = node.parentElement;
  while (currentParent) {
    if (isScrollable(currentParent)) {
      scrollParentCache.set(node, currentParent);
      return currentParent;
    }
    currentParent = currentParent.parentElement;
  }

  const result = document.scrollingElement || document.documentElement;
  scrollParentCache.set(node, result);
  return result;
};

export const nodeDOMAtCoords = (coords: { x: number; y: number }) => {
  const elements = document.elementsFromPoint(coords.x, coords.y);

  for (const elem of elements) {
    if (elem.matches("table:not(.table-drag-preview)")) return elem;
    // Allow first-child paragraphs that are direct children of ProseMirror (document root)
    if (elem.matches("p:first-child") && elem.parentElement?.matches(".ProseMirror")) return elem;
    if (elem.matches("p:first-child") && elem.parentElement?.matches(".editor-column")) return elem;
    if (elem.closest("table")) continue;
    if (elem.closest(".editor-embed-component") && !elem.matches(".editor-embed-component")) continue;
    if (elem.matches(generalSelectors)) return elem;
  }
  return null;
};

const nodePosAtDOM = (node: Element, view: EditorView, options: SideMenuPluginProps) => {
  const boundingRect = node.getBoundingClientRect();
  return view.posAtCoords({
    left: boundingRect.left + 50 + options.dragHandleWidth,
    top: boundingRect.top + 1,
  })?.inside;
};

const nodePosAtDOMForBlockQuotes = (node: Element, view: EditorView) => {
  const boundingRect = node.getBoundingClientRect();
  return view.posAtCoords({
    left: boundingRect.left + 1,
    top: boundingRect.top + 1,
  })?.inside;
};

function detectEdgeDrop(
  view: EditorView,
  dropPos: { pos: number; inside: number },
  mouseX: number
): { blockPos: number; position: "left" | "right" } | null {
  const resolvedPos = view.state.doc.resolve(dropPos.pos);

  let blockPos = dropPos.pos;
  for (let d = resolvedPos.depth; d > 0; d--) {
    const node = resolvedPos.node(d);
    if (node.isBlock && node.type.name !== CORE_EXTENSIONS.DOCUMENT) {
      blockPos = resolvedPos.before(d);
      break;
    }
  }

  const $blockPos = view.state.doc.resolve(blockPos);
  if ($blockPos.parent.type.name === ADDITIONAL_EXTENSIONS.COLUMN) {
    blockPos = $blockPos.before();
  }

  const blockElement = view.nodeDOM(blockPos);
  if (!(blockElement instanceof HTMLElement)) return null;

  const rect = blockElement.getBoundingClientRect();
  const distanceOutsideLeft = rect.left - mouseX;
  const distanceOutsideRight = mouseX - rect.right;

  // Only trigger when cursor is outside the block but within EDGE_OUTSIDE_THRESHOLD px of its edge
  if (distanceOutsideLeft > 0 && distanceOutsideLeft <= EDGE_OUTSIDE_THRESHOLD) return { blockPos, position: "left" };
  if (distanceOutsideRight > 0 && distanceOutsideRight <= EDGE_OUTSIDE_THRESHOLD)
    return { blockPos, position: "right" };
  return null;
}

export const DragHandlePlugin = (options: SideMenuPluginProps): SideMenuHandleOptions => {
  let listType = "";
  let isDragging = false;
  let lastClientY = 0;
  let scrollAnimationFrame: number | null = null;
  let isDraggedOutsideWindow: "top" | "bottom" | boolean = false;
  let isMouseInsideWhileDragging = false;
  let currentScrollSpeed = 0;
  let dragHandleElement: HTMLElement | null = null;
  const isMultiColumnFlagged = options.editor ? getIsMultiColumnFlagged(options.editor) : false;

  function scroll() {
    if (!isDragging) {
      currentScrollSpeed = 0;
      return;
    }

    const scrollableParent = getScrollParent(dragHandleElement!);
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

    scrollAnimationFrame = requestAnimationFrame(scroll) as unknown as null;
  }

  const handleClick = (event: MouseEvent, view: EditorView) => {
    handleNodeSelection(event, view, false, options);
  };

  const handleDragStart = (event: DragEvent, view: EditorView) => {
    const result = handleNodeSelection(event, view, true, options);
    if (result?.listType) listType = result.listType;
    isDragging = true;
    lastClientY = event.clientY;
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

  const showDragHandle = (view?: EditorView) => {
    if (view) {
      const columnResizeState = columnResizePluginKey.getState(view.state);
      if (columnResizeState && columnResizeState.type !== "default") {
        hideDragHandle();
        return;
      }
    }
    dragHandleElement?.classList.remove("drag-handle-hidden");
  };

  const hideDragHandle = () => {
    if (!dragHandleElement?.classList.contains("drag-handle-hidden")) {
      dragHandleElement?.classList.add("drag-handle-hidden");
    }
  };

  const view = (view: EditorView, sideMenu: HTMLDivElement | null) => {
    dragHandleElement = createDragHandleElement();
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
    mousemove: (view: EditorView) => showDragHandle(view),
    dragenter: (view: EditorView) => {
      view.dom.classList.add("dragging");
      hideDragHandle();
    },
    drop: (view: EditorView, event: DragEvent) => {
      view.dom.classList.remove("dragging");
      hideDragHandle();

      if (!view.dragging?.slice) return;

      const droppedNode = view.dragging.slice.content.firstChild;
      if (!droppedNode) return;

      const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY });
      if (!dropPos) return;

      const $dropPos = view.state.doc.resolve(dropPos.pos);

      // Prevent dropping column/columnList inside another column structure
      if (
        [ADDITIONAL_EXTENSIONS.COLUMN, ADDITIONAL_EXTENSIONS.COLUMN_LIST].includes(
          droppedNode.type.name as ADDITIONAL_EXTENSIONS
        ) &&
        isInsideColumnStructure($dropPos)
      ) {
        event.preventDefault();
        event.stopPropagation();
        view.dragging = null;
        return;
      }

      // Handle edge drops for column creation
      const edgeDrop = detectEdgeDrop(view, dropPos, event.clientX);
      if (edgeDrop) {
        const { blockPos, position } = edgeDrop;
        const $pos = view.state.doc.resolve(blockPos);
        const targetNode = $pos.nodeAfter;

        // Wrap list items in a list for column creation
        const nodeForColumns = wrapListItemForColumnDrop(droppedNode, view.state.schema, listType);

        const isColumnListTarget = targetNode?.type.name === ADDITIONAL_EXTENSIONS.COLUMN_LIST;
        const canCreate = targetNode && canCreateColumns(nodeForColumns, targetNode);

        if (!isInsideColumn($pos) && targetNode && (canCreate || isColumnListTarget)) {
          // Get source info for proper move handling of list items
          const isMove = view.dragging?.move ?? true;
          const selection = view.state.selection;
          const sourceInfoOverride =
            isMove && selection instanceof NodeSelection
              ? { pos: selection.from, size: selection.node.nodeSize }
              : null;

          try {
            if (
              handleColumnDrop(
                view,
                nodeForColumns,
                targetNode,
                blockPos,
                position,
                isMove,
                isMultiColumnFlagged,
                sourceInfoOverride
              )
            ) {
              event.preventDefault();
              event.stopPropagation();
              view.dragging = null;
              return;
            }
          } catch (error) {
            console.error("[Column Drop] Error:", error);
          }
        }
      }

      // Handle list item drops
      if (droppedNode.type.name === (CORE_EXTENSIONS.LIST_ITEM as string)) {
        const resolvedPos = view.state.doc.resolve(dropPos.pos);
        let isDroppedInsideList = false;
        let dropDepth = 0;

        for (let i = resolvedPos.depth; i > 0; i--) {
          if (resolvedPos.node(i).type.name === (CORE_EXTENSIONS.LIST_ITEM as string)) {
            isDroppedInsideList = true;
            dropDepth = i;
            break;
          }
        }

        let slice = view.state.selection.content();
        let newFragment = slice.content;

        if (!isDroppedInsideList || dropDepth !== resolvedPos.depth) {
          newFragment = flattenListStructure(newFragment, view.state.schema);
        }

        if (!isDroppedInsideList) {
          const listNodeType =
            listType === "OL" ? view.state.schema.nodes.orderedList : view.state.schema.nodes.bulletList;
          newFragment = Fragment.from(listNodeType.create(null, newFragment));
        }

        slice = new Slice(newFragment, slice.openStart, slice.openEnd);
        view.dragging = { slice, move: !event.altKey };
      }
    },
    dragend: (view: EditorView) => {
      view.dom.classList.remove("dragging");
    },
  };

  return { view, domEvents };
};

function flattenListStructure(fragment: Fragment, schema: Schema): Fragment {
  const result: Node[] = [];
  fragment.forEach((node) => {
    if (node.type === schema.nodes.listItem || node.type === schema.nodes.taskItem) {
      result.push(node);
      if (
        node.content.firstChild &&
        (node.content.firstChild.type === schema.nodes.bulletList ||
          node.content.firstChild.type === schema.nodes.orderedList)
      ) {
        flattenListStructure(node.content.firstChild.content, schema).forEach((subNode) => result.push(subNode));
      }
    }
  });
  return Fragment.from(result);
}

const handleNodeSelection = (
  event: MouseEvent | DragEvent,
  view: EditorView,
  isDragStart: boolean,
  options: SideMenuPluginProps
) => {
  let listType = "";
  view.focus();

  const node = nodeDOMAtCoords({
    x: event.clientX + 50 + options.dragHandleWidth,
    y: event.clientY,
  });

  if (!(node instanceof Element)) return;

  let draggedNodePos = nodePosAtDOM(node, view, options);
  if (draggedNodePos == null || draggedNodePos < 0) return;

  if (node.matches("table")) {
    draggedNodePos = draggedNodePos - 2;
  } else if (node.matches("blockquote")) {
    draggedNodePos = nodePosAtDOMForBlockQuotes(node, view);
    if (draggedNodePos === null || draggedNodePos === undefined) return;
  } else if (node.closest(".editor-column")) {
    // For elements inside columns, check if we're at a column boundary
    const $pos = view.state.doc.resolve(draggedNodePos);

    // If at column boundary, move inside to get the actual content
    if ($pos.depth === 1 && $pos.parent.type.name === ADDITIONAL_EXTENSIONS.COLUMN_LIST) {
      draggedNodePos = draggedNodePos + 2;
    }

    // Find the block node that's a direct child of the column
    const $finalPos = view.state.doc.resolve(draggedNodePos);
    for (let d = $finalPos.depth; d > 0; d--) {
      const nodeAtDepth = $finalPos.node(d);
      const parentAtDepth = $finalPos.node(d - 1);

      if (nodeAtDepth.isBlock && parentAtDepth?.type.name === ADDITIONAL_EXTENSIONS.COLUMN) {
        draggedNodePos = $finalPos.before(d);
        break;
      }
    }
  } else {
    const $pos = view.state.doc.resolve(draggedNodePos);
    if (
      [CORE_EXTENSIONS.LIST_ITEM, CORE_EXTENSIONS.TASK_ITEM].includes($pos.parent.type.name as CORE_EXTENSIONS) &&
      $pos.depth > 1
    ) {
      draggedNodePos = $pos.before($pos.depth);
    }
  }

  const docSize = view.state.doc.content.size;
  draggedNodePos = Math.max(0, Math.min(draggedNodePos, docSize));

  const nodeSelection = NodeSelection.create(view.state.doc, draggedNodePos);

  // Prevent dragging individual columns
  if (nodeSelection.node.type.name === ADDITIONAL_EXTENSIONS.COLUMN) return;

  view.dispatch(view.state.tr.setSelection(nodeSelection));

  if (isDragStart) {
    if (event instanceof DragEvent && !event.dataTransfer) return;

    if (
      [CORE_EXTENSIONS.LIST_ITEM, CORE_EXTENSIONS.TASK_ITEM].includes(nodeSelection.node.type.name as CORE_EXTENSIONS)
    ) {
      listType = node.closest("ol, ul")?.tagName || "";
    }

    const slice = view.state.selection.content();
    const { dom, text } = view.serializeForClipboard(slice);

    if (event instanceof DragEvent && event.dataTransfer) {
      event.dataTransfer.clearData();
      event.dataTransfer.setData("text/html", dom.innerHTML);
      event.dataTransfer.setData("text/plain", text);
      event.dataTransfer.effectAllowed = "copyMove";
      event.dataTransfer.setDragImage(node, 0, 0);
    }

    view.dragging = { slice, move: !event.altKey };
  }

  return { listType };
};
