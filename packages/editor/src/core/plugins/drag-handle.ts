import { Fragment, Slice, Node } from "@tiptap/pm/model";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
// @ts-expect-error __serializeForClipboard's is not exported
import { __serializeForClipboard, EditorView } from "@tiptap/pm/view";
// extensions
import { SideMenuHandleOptions, SideMenuPluginProps } from "@/extensions";

const verticalEllipsisIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>';

const createDragHandleElement = (): HTMLElement => {
  const dragHandleElement = document.createElement("button");
  dragHandleElement.type = "button";
  dragHandleElement.id = "drag-handle";
  dragHandleElement.draggable = true;
  dragHandleElement.dataset.dragHandle = "";
  dragHandleElement.classList.value =
    "hidden sm:flex items-center size-5 aspect-square rounded-sm cursor-grab outline-none hover:bg-custom-background-80 active:bg-custom-background-80 active:cursor-grabbing transition-[background-color,_opacity] duration-200 ease-linear";

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

const isScrollable = (node: HTMLElement | SVGElement) => {
  if (!(node instanceof HTMLElement || node instanceof SVGElement)) {
    return false;
  }
  const style = getComputedStyle(node);
  return ["overflow", "overflow-y"].some((propertyName) => {
    const value = style.getPropertyValue(propertyName);
    return value === "auto" || value === "scroll";
  });
};

const getScrollParent = (node: HTMLElement | SVGElement) => {
  let currentParent = node.parentElement;

  while (currentParent) {
    if (isScrollable(currentParent)) {
      return currentParent;
    }
    currentParent = currentParent.parentElement;
  }
  return document.scrollingElement || document.documentElement;
};

export const nodeDOMAtCoords = (coords: { x: number; y: number }) => {
  const elements = document.elementsFromPoint(coords.x, coords.y);
  const generalSelectors = [
    "li",
    "p:not(:first-child)",
    ".code-block",
    "blockquote",
    "h1, h2, h3, h4, h5, h6",
    "[data-type=horizontalRule]",
    ".table-wrapper",
    ".issue-embed",
    ".image-component",
    ".image-upload-component",
    ".editor-callout-component",
  ].join(", ");

  for (const elem of elements) {
    if (elem.matches("p:first-child") && elem.parentElement?.matches(".ProseMirror")) {
      return elem;
    }

    // if the element is a <p> tag that is the first child of a td or th
    if (
      (elem.matches("td > p:first-child") || elem.matches("th > p:first-child")) &&
      elem?.textContent?.trim() !== ""
    ) {
      return elem; // Return only if p tag is not empty in td or th
    }

    // apply general selector
    if (elem.matches(generalSelectors)) {
      return elem;
    }
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

const calcNodePos = (pos: number, view: EditorView, node: Element) => {
  const maxPos = view.state.doc.content.size;
  const safePos = Math.max(0, Math.min(pos, maxPos));
  const $pos = view.state.doc.resolve(safePos);

  if ($pos.depth > 1) {
    if (node.matches("ul li, ol li")) {
      // only for nested lists
      const newPos = $pos.before($pos.depth);
      return Math.max(0, Math.min(newPos, maxPos));
    }
  }

  return safePos;
};

export const DragHandlePlugin = (options: SideMenuPluginProps): SideMenuHandleOptions => {
  let listType = "";
  let isDragging = false;
  let lastClientY = 0;
  let scrollAnimationFrame = null;
  let isDraggedOutsideWindow: "top" | "bottom" | boolean = false;
  let isMouseInsideWhileDragging = false;

  const handleDragStart = (event: DragEvent, view: EditorView) => {
    view.focus();
    isDragging = true;
    lastClientY = event.clientY;
    scroll();
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
      // TODO FIX ERROR
      const nodeSelection = NodeSelection.create(view.state.doc, draggedNodePos);
      view.dispatch(view.state.tr.setSelection(nodeSelection));
    }

    // If the selected node is a list item, we need to save the type of the wrapping list e.g. OL or UL
    if (view.state.selection instanceof NodeSelection && view.state.selection.node.type.name === "listItem") {
      listType = node.parentElement!.tagName;
    }

    if (node.matches("blockquote")) {
      let nodePosForBlockQuotes = nodePosAtDOMForBlockQuotes(node, view);
      if (nodePosForBlockQuotes === null || nodePosForBlockQuotes === undefined) return;

      const docSize = view.state.doc.content.size;
      nodePosForBlockQuotes = Math.max(0, Math.min(nodePosForBlockQuotes, docSize));

      if (nodePosForBlockQuotes >= 0 && nodePosForBlockQuotes <= docSize) {
        // TODO FIX ERROR
        const nodeSelection = NodeSelection.create(view.state.doc, nodePosForBlockQuotes);
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
  };

  const handleDragEnd = <TEvent extends DragEvent | FocusEvent>(event: TEvent, view?: EditorView, message?: any) => {
    event.preventDefault();
    isDragging = false;
    isMouseInsideWhileDragging = false;
    if (scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = null;
    }

    view?.dom.classList.remove("dragging");
  };

  let currentScrollSpeed = 0;
  const maxScrollSpeed = 10;
  const acceleration = 0.2;

  // Add variables to track scrolling state:
  let isScrolling = false;
  let wasScrolling = false;

  function scroll() {
    const dropCursorElement = document.querySelector(".prosemirror-drop-cursor");
    if (!isDragging) {
      currentScrollSpeed = 0;
      return;
    }

    const scrollableParent = getScrollParent(dragHandleElement);
    if (!scrollableParent) return;

    const scrollRegionUp = options.scrollThreshold.up;
    const scrollRegionDown = window.innerHeight - options.scrollThreshold.down;

    let targetScrollAmount = 0;

    if (isDraggedOutsideWindow === "top") {
      targetScrollAmount = -maxScrollSpeed * 5;
    } else if (isDraggedOutsideWindow === "bottom") {
      targetScrollAmount = maxScrollSpeed * 5;
    } else if (lastClientY < scrollRegionUp) {
      const ratio = easeOutQuad((scrollRegionUp - lastClientY) / options.scrollThreshold.up);
      targetScrollAmount = -maxScrollSpeed * ratio;
    } else if (lastClientY > scrollRegionDown) {
      const ratio = easeOutQuad((lastClientY - scrollRegionDown) / options.scrollThreshold.down);
      targetScrollAmount = maxScrollSpeed * ratio;
    }

    currentScrollSpeed += (targetScrollAmount - currentScrollSpeed) * acceleration;

    const maxSpeedLimit = 50;
    currentScrollSpeed = Math.max(-maxSpeedLimit, Math.min(maxSpeedLimit, currentScrollSpeed));

    // Determine if scrolling should be active:
    isScrolling = Math.abs(currentScrollSpeed) > 0.1;

    // Detect changes from wasScrolling to isScrolling:
    if (!wasScrolling && isScrolling) {
      dropCursorElement?.classList.add("text-transparent");
    } else if (wasScrolling && !isScrolling) {
      dropCursorElement?.classList.remove("text-transparent");
    }

    // Track new state:
    wasScrolling = isScrolling;

    if (isScrolling) {
      scrollableParent.scrollBy({ top: currentScrollSpeed });
    }

    scrollAnimationFrame = requestAnimationFrame(scroll);
  }

  function easeOutQuad(t) {
    return t * (2 - t);
  }

  const handleClick = (event: MouseEvent, view: EditorView) => {
    view.focus();

    const node = nodeDOMAtCoords({
      x: event.clientX + 50 + options.dragHandleWidth,
      y: event.clientY,
    });

    if (!(node instanceof Element)) return;

    if (node.matches("blockquote")) {
      let nodePosForBlockQuotes = nodePosAtDOMForBlockQuotes(node, view);
      if (nodePosForBlockQuotes === null || nodePosForBlockQuotes === undefined) return;

      const docSize = view.state.doc.content.size;
      nodePosForBlockQuotes = Math.max(0, Math.min(nodePosForBlockQuotes, docSize));

      if (nodePosForBlockQuotes >= 0 && nodePosForBlockQuotes <= docSize) {
        // TODO FIX ERROR
        const nodeSelection = NodeSelection.create(view.state.doc, nodePosForBlockQuotes);
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
  };

  let dragHandleElement: HTMLElement | null = null;
  // drag handle view actions
  const showDragHandle = () => dragHandleElement?.classList.remove("drag-handle-hidden");
  const hideDragHandle = () => {
    if (!dragHandleElement?.classList.contains("drag-handle-hidden"))
      dragHandleElement?.classList.add("drag-handle-hidden");
  };

  const view = (view: EditorView, sideMenu: HTMLDivElement | null) => {
    dragHandleElement = createDragHandleElement();
    dragHandleElement.addEventListener("dragstart", (e) => handleDragStart(e, view));
    dragHandleElement.addEventListener("dragend", (e) => handleDragEnd(e, view));
    window.addEventListener("dragleave", (e) => {
      if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        isMouseInsideWhileDragging = true;
      }
    });

    document.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (isDragging) {
        lastClientY = event.clientY;
      }
    });

    dragHandleElement.addEventListener("click", (e) => handleClick(e, view));
    dragHandleElement.addEventListener("contextmenu", (e) => handleClick(e, view));
    document.addEventListener("mousemove", (e) => {
      if (isMouseInsideWhileDragging) {
        handleDragEnd(e, view);
      }
    });

    window.addEventListener("dragleave", (e) => {
      if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        isMouseInsideWhileDragging = true;

        const windowMiddleY = window.innerHeight / 2;

        if (lastClientY < windowMiddleY) {
          isDraggedOutsideWindow = "top";
        } else {
          isDraggedOutsideWindow = "bottom";
        }
      }
    });

    window.addEventListener("dragenter", () => {
      isDraggedOutsideWindow = false;
    });

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
      },
    };
  };
  const domEvents = {
    mousemove: () => showDragHandle(),
    dragenter: (view: EditorView) => {
      view.dom.classList.add("dragging");
      hideDragHandle();
    },
    drop: (view: EditorView, event: DragEvent) => {
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
    dragend: (view: EditorView) => {
      view.dom.classList.remove("dragging");
    },
  };

  return {
    view,
    domEvents,
  };
};
