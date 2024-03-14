import { Extension } from "@tiptap/core";

import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
// @ts-expect-error __serializeForClipboard's is not exported
import { __serializeForClipboard, EditorView } from "@tiptap/pm/view";

export interface DragHandleOptions {
  dragHandleWidth: number;
  setHideDragHandle?: (hideDragHandlerFromDragDrop: () => void) => void;
}

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
  return document
    .elementsFromPoint(coords.x, coords.y)
    .find(
      (elem: Element) =>
        elem.parentElement?.matches?.(".ProseMirror") ||
        elem.matches(
          ["li", "p:not(:first-child)", "pre", "blockquote", "h1, h2, h3", "table", "[data-type=horizontalRule]"].join(
            ", "
          )
        )
    );
}

function nodePosAtDOM(node: Element, view: EditorView, options: DragHandleOptions) {
  const boundingRect = node.getBoundingClientRect();

  return view.posAtCoords({
    left: boundingRect.left + 50 + options.dragHandleWidth,
    top: boundingRect.top + 1,
  })?.inside;
}

function DragHandle(options: DragHandleOptions) {
  function handleDragStart(event: DragEvent, view: EditorView) {
    view.focus();

    if (!event.dataTransfer) return;

    const node = nodeDOMAtCoords({
      x: event.clientX + 50 + options.dragHandleWidth,
      y: event.clientY,
    });

    if (!(node instanceof Element)) return;

    const nodePos = nodePosAtDOM(node, view, options);
    if (nodePos == null || nodePos < 0) return;

    view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, nodePos)));

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

    view.dom.classList.remove("dragging");

    const node = nodeDOMAtCoords({
      x: event.clientX + 50 + options.dragHandleWidth,
      y: event.clientY,
    });

    if (!(node instanceof Element)) return;

    const nodePos = nodePosAtDOM(node, view, options);
    if (!nodePos) return;

    view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, nodePos)));
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

      dragHandleElement.addEventListener("dragstart", (e) => {
        handleDragStart(e, view);
      });
      dragHandleElement.addEventListener("click", (e) => {
        handleClick(e, view);
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
            rect.left -= options.dragHandleWidth;
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
        drop: (view) => {
          view.dom.classList.remove("dragging");
          hideDragHandle();
        },
        dragend: (view) => {
          view.dom.classList.remove("dragging");
        },
      },
    },
  });
}

export const DragAndDrop = (setHideDragHandle?: (hideDragHandlerFromDragDrop: () => void) => void) =>
  Extension.create({
    name: "dragAndDrop",

    addProseMirrorPlugins() {
      return [
        DragHandle({
          dragHandleWidth: 24,
          setHideDragHandle,
        }),
      ];
    },
  });
