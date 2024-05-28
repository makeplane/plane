import { Extension } from "@tiptap/core";

import { NodeSelection, Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Fragment, Slice, Node } from "@tiptap/pm/model";
// @ts-expect-error __serializeForClipboard's is not exported
import { __serializeForClipboard, EditorView } from "@tiptap/pm/view";

export interface DragHandleOptions {
  dragHandleWidth: number;
  setHideDragHandle?: (hideDragHandlerFromDragDrop: () => void) => void;
  scrollThreshold: {
    up: number;
    down: number;
  };
}

export const DragAndDrop = (setHideDragHandle?: (hideDragHandlerFromDragDrop: () => void) => void) =>
  Extension.create({
    name: "dragAndDrop",

    addProseMirrorPlugins() {
      return [
        DragHandle({
          dragHandleWidth: 24,
          scrollThreshold: { up: 300, down: 100 },
          setHideDragHandle,
        }),
      ];
    },
  });

function createDragHandleElement(): HTMLElement {
  const dragHandleElement = document.createElement("div");
  dragHandleElement.draggable = true;
  dragHandleElement.dataset.dragHandle = "";
  dragHandleElement.classList.add("drag-handle");

  const dragHandleContainer = document.createElement("div");
  dragHandleContainer.classList.add("drag-handle-container");
  dragHandleElement.appendChild(dragHandleContainer);

  const dotsContainer = document.createElement("div");
  dotsContainer.classList.add("drag-handle-dots");

  for (let i = 0; i < 6; i++) {
    const spanElement = document.createElement("span");
    spanElement.classList.add("drag-handle-dot");
    dotsContainer.appendChild(spanElement);
  }

  dragHandleContainer.appendChild(dotsContainer);

  return dragHandleElement;
}

function absoluteRect(node: Element) {
  const data = node.getBoundingClientRect();

  return {
    top: data.top,
    left: data.left,
    width: data.width,
  };
}

function nodeDOMAtCoords(coords: { x: number; y: number }) {
  const elements = document.elementsFromPoint(coords.x, coords.y);
  const generalSelectors = [
    "li",
    "p:not(:first-child)",
    ".code-block",
    "blockquote",
    "h1, h2, h3",
    ".table-wrapper",
    "[data-type=horizontalRule]",
  ].join(", ");

  for (const elem of elements) {
    // if the element is a <p> tag that is the first child of a td or th
    if (
      (elem.matches("td > p:first-child") || elem.matches("th > p:first-child")) &&
      elem?.textContent?.trim() !== ""
    ) {
      return elem; // Return only if p tag is not empty
    }
    // apply general selector
    if (elem.matches(generalSelectors)) {
      return elem;
    }
  }
  return null;
}

function nodePosAtDOM(node: Element, view: EditorView, options: DragHandleOptions) {
  const boundingRect = node.getBoundingClientRect();

  return view.posAtCoords({
    left: boundingRect.left + 50 + options.dragHandleWidth,
    top: boundingRect.top + 1,
  })?.inside;
}

function nodePosAtDOMForBlockquotes(node: Element, view: EditorView) {
  const boundingRect = node.getBoundingClientRect();

  return view.posAtCoords({
    left: boundingRect.left + 1,
    top: boundingRect.top + 1,
  })?.inside;
}

function calcNodePos(pos: number, view: EditorView, node: Element) {
  const maxPos = view.state.doc.content.size;
  const safePos = Math.max(0, Math.min(pos, maxPos));
  const $pos = view.state.doc.resolve(safePos);

  if ($pos.depth > 1) {
    if (node.matches("ul:not([data-type=taskList]) li, ol li")) {
      // only for nested lists
      const newPos = $pos.before($pos.depth);
      return Math.max(0, Math.min(newPos, maxPos));
    }
  }

  return safePos;
}

function DragHandle(options: DragHandleOptions) {
  let listType = "";
  function handleDragStart(event: DragEvent, view: EditorView) {
    view.focus();

    if (!event.dataTransfer) return;

    const node = nodeDOMAtCoords({
      x: event.clientX + 50 + options.dragHandleWidth,
      y: event.clientY,
    });

    if (!(node instanceof Element)) return;

    let draggedNodePos = nodePosAtDOM(node, view, options);
    if (draggedNodePos == null || draggedNodePos < 0) return;
    draggedNodePos = calcNodePos(draggedNodePos, view, node);

    const { from, to } = view.state.selection;
    const diff = from - to;

    const fromSelectionPos = calcNodePos(from, view, node);
    let differentNodeSelected = false;

    const nodePos = view.state.doc.resolve(fromSelectionPos);

    // Check if nodePos points to the top level node
    if (nodePos.node().type.name === "doc") differentNodeSelected = true;
    else {
      const nodeSelection = NodeSelection.create(view.state.doc, nodePos.before());
      // Check if the node where the drag event started is part of the current selection
      differentNodeSelected = !(
        draggedNodePos + 1 >= nodeSelection.$from.pos && draggedNodePos <= nodeSelection.$to.pos
      );
    }

    if (!differentNodeSelected && diff !== 0 && !(view.state.selection instanceof NodeSelection)) {
      const endSelection = NodeSelection.create(view.state.doc, to - 1);
      const multiNodeSelection = TextSelection.create(view.state.doc, draggedNodePos, endSelection.$to.pos);
      view.dispatch(view.state.tr.setSelection(multiNodeSelection));
    } else {
      const nodeSelection = NodeSelection.create(view.state.doc, draggedNodePos);
      view.dispatch(view.state.tr.setSelection(nodeSelection));
    }

    // If the selected node is a list item, we need to save the type of the wrapping list e.g. OL or UL
    if (view.state.selection instanceof NodeSelection && view.state.selection.node.type.name === "listItem") {
      listType = node.parentElement!.tagName;
    }

    if (node.matches("blockquote")) {
      let nodePosForBlockquotes = nodePosAtDOMForBlockquotes(node, view);
      if (nodePosForBlockquotes === null || nodePosForBlockquotes === undefined) return;

      const docSize = view.state.doc.content.size;
      nodePosForBlockquotes = Math.max(0, Math.min(nodePosForBlockquotes, docSize));

      if (nodePosForBlockquotes >= 0 && nodePosForBlockquotes <= docSize) {
        const nodeSelection = NodeSelection.create(view.state.doc, nodePosForBlockquotes);
        view.dispatch(view.state.tr.setSelection(nodeSelection));
      }
    }

    const slice = view.state.selection.content();
    const { dom, text } = __serializeForClipboard(view, slice);

    event.dataTransfer.clearData();
    event.dataTransfer.setData("text/html", dom.innerHTML);
    event.dataTransfer.setData("text/plain", text);
    event.dataTransfer.effectAllowed = "copyMove";

    event.dataTransfer.setDragImage(node, 0, 0);

    view.dragging = { slice, move: event.ctrlKey };
  }

  function handleClick(event: MouseEvent, view: EditorView) {
    view.focus();

    const node = nodeDOMAtCoords({
      x: event.clientX + 50 + options.dragHandleWidth,
      y: event.clientY,
    });

    if (!(node instanceof Element)) return;

    if (node.matches("blockquote")) {
      let nodePosForBlockquotes = nodePosAtDOMForBlockquotes(node, view);
      if (nodePosForBlockquotes === null || nodePosForBlockquotes === undefined) return;

      const docSize = view.state.doc.content.size;
      nodePosForBlockquotes = Math.max(0, Math.min(nodePosForBlockquotes, docSize));

      if (nodePosForBlockquotes >= 0 && nodePosForBlockquotes <= docSize) {
        const nodeSelection = NodeSelection.create(view.state.doc, nodePosForBlockquotes);
        view.dispatch(view.state.tr.setSelection(nodeSelection));
      }
      return;
    }

    let nodePos = nodePosAtDOM(node, view, options);

    if (nodePos === null || nodePos === undefined) return;

    // Adjust the nodePos to point to the start of the node, ensuring NodeSelection can be applied
    nodePos = calcNodePos(nodePos, view, node);

    // Use NodeSelection to select the node at the calculated position
    const nodeSelection = NodeSelection.create(view.state.doc, nodePos);

    // Dispatch the transaction to update the selection
    view.dispatch(view.state.tr.setSelection(nodeSelection));
  }

  let dragHandleElement: HTMLElement | null = null;

  function hideDragHandle() {
    if (dragHandleElement) {
      dragHandleElement.classList.add("hidden");
    }
  }

  function showDragHandle() {
    if (dragHandleElement) {
      dragHandleElement.classList.remove("hidden");
    }
  }

  options.setHideDragHandle?.(hideDragHandle);

  return new Plugin({
    key: new PluginKey("dragHandle"),
    view: (view) => {
      dragHandleElement = createDragHandleElement();
      dragHandleElement.addEventListener("dragstart", (e) => {
        handleDragStart(e, view);
      });
      dragHandleElement.addEventListener("click", (e) => {
        handleClick(e, view);
      });
      dragHandleElement.addEventListener("contextmenu", (e) => {
        handleClick(e, view);
      });

      dragHandleElement.addEventListener("drag", (e) => {
        hideDragHandle();
        const a = document.querySelector(".frame-renderer");
        if (!a) return;
        if (e.clientY < options.scrollThreshold.up) {
          a.scrollBy({ top: -70, behavior: "smooth" });
        } else if (window.innerHeight - e.clientY < options.scrollThreshold.down) {
          a.scrollBy({ top: 70, behavior: "smooth" });
        }
      });

      hideDragHandle();

      view?.dom?.parentElement?.appendChild(dragHandleElement);

      return {
        destroy: () => {
          dragHandleElement?.remove?.();
          dragHandleElement = null;
        },
      };
    },
    props: {
      handleDOMEvents: {
        mousemove: (view, event) => {
          if (!view.editable) {
            return;
          }

          const node = nodeDOMAtCoords({
            x: event.clientX + 50 + options.dragHandleWidth,
            y: event.clientY,
          });

          if (!(node instanceof Element) || node.matches("ul, ol")) {
            hideDragHandle();
            return;
          }

          const compStyle = window.getComputedStyle(node);
          const lineHeight = parseInt(compStyle.lineHeight, 10);
          const paddingTop = parseInt(compStyle.paddingTop, 10);

          const rect = absoluteRect(node);

          rect.top += (lineHeight - 20) / 2;
          rect.top += paddingTop;

          // Li markers
          if (node.matches("ul:not([data-type=taskList]) li, ol li")) {
            rect.left -= 18;
          }
          if (node.matches(".table-wrapper")) {
            rect.top += 8;
          }

          rect.width = options.dragHandleWidth;

          if (!dragHandleElement) return;

          dragHandleElement.style.left = `${rect.left - rect.width}px`;
          dragHandleElement.style.top = `${rect.top}px`;
          showDragHandle();
        },
        keydown: () => {
          hideDragHandle();
        },
        mousewheel: () => {
          hideDragHandle();
        },
        dragenter: (view) => {
          view.dom.classList.add("dragging");
          hideDragHandle();
        },
        drop: (view, event) => {
          view.dom.classList.remove("dragging");
          hideDragHandle();
          let droppedNode: Node | null = null;
          const dropPos = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });

          if (!dropPos) return;

          if (view.state.selection instanceof NodeSelection) {
            droppedNode = view.state.selection.node;
          }
          if (!droppedNode) return;

          const resolvedPos = view.state.doc.resolve(dropPos.pos);
          let isDroppedInsideList = false;

          // Traverse up the document tree to find if we're inside a list item
          for (let i = resolvedPos.depth; i > 0; i--) {
            if (resolvedPos.node(i).type.name === "listItem") {
              isDroppedInsideList = true;
              break;
            }
          }

          // If the selected node is a list item and is not dropped inside a list, we need to wrap it inside <ol> tag otherwise ol list items will be transformed into ul list item when dropped
          if (
            view.state.selection instanceof NodeSelection &&
            view.state.selection.node.type.name === "listItem" &&
            !isDroppedInsideList &&
            listType == "OL"
          ) {
            const text = droppedNode.textContent;
            if (!text) return;
            const paragraph = view.state.schema.nodes.paragraph?.createAndFill({}, view.state.schema.text(text));
            const listItem = view.state.schema.nodes.listItem?.createAndFill({}, paragraph);

            const newList = view.state.schema.nodes.orderedList?.createAndFill(null, listItem);
            const slice = new Slice(Fragment.from(newList), 0, 0);
            view.dragging = { slice, move: event.ctrlKey };
          }
        },
        dragend: (view) => {
          view.dom.classList.remove("dragging");
        },
      },
    },
  });
}
