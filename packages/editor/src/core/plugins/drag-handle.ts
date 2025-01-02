import { Fragment, Slice, Node, Schema } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
// @ts-expect-error __serializeForClipboard's is not exported
import { __serializeForClipboard, EditorView } from "@tiptap/pm/view";
// extensions
import { SideMenuHandleOptions, SideMenuPluginProps } from "@/extensions";

const verticalEllipsisIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>';

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
  if (scrollParentCache.has(node)) {
    return scrollParentCache.get(node);
  }

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
    ".prosemirror-flat-list",
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

export const DragHandlePlugin = (options: SideMenuPluginProps): SideMenuHandleOptions => {
  let listType = "";
  const handleDragStart = (event: DragEvent, view: EditorView) => {
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
      // TODO FIX ERROR
      const nodeSelection = NodeSelection.create(view.state.doc, nodePos.before());
      // Check if the node where the drag event started is part of the current selection
      differentNodeSelected = !(
        draggedNodePos + 1 >= nodeSelection.$from.pos && draggedNodePos <= nodeSelection.$to.pos
      );
    }

    console.log("draggedNodePos", draggedNodePos, node);
    // if (node.className.includes("prosemirror-flat-list")) {
    //   draggedNodePos = draggedNodePos - 1;
    //   console.log("draggedNodePos", draggedNodePos);
    // }

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

  const handleClick = (event: MouseEvent, view: EditorView) => {
    handleNodeSelection(event, view, false, options);
  };

  const handleDragStart = (event: DragEvent, view: EditorView) => {
    const { listType: listTypeFromDragStart } = handleNodeSelection(event, view, true, options);
    listType = listTypeFromDragStart;
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

  function scroll() {
    if (!isDragging) {
      currentScrollSpeed = 0;
      return;
    }

    const scrollableParent = getScrollParent(dragHandleElement);
    if (!scrollableParent) return;

    const scrollRegionUp = options.scrollThreshold.up;
    const scrollRegionDown = window.innerHeight - options.scrollThreshold.down;

    let targetScrollAmount = 0;

    // if (node.className.includes("prosemirror-flat-list")) {
    //   console.log("nodePos", nodePos);
    //   nodePos = nodePos - 1;
    // }

    // TODO FIX ERROR
    // Use NodeSelection to select the node at the calculated position
    const nodeSelection = NodeSelection.create(view.state.doc, nodePos);

    currentScrollSpeed += (targetScrollAmount - currentScrollSpeed) * acceleration;

    if (Math.abs(currentScrollSpeed) > 0.1) {
      scrollableParent.scrollBy({ top: currentScrollSpeed });
    }

    scrollAnimationFrame = requestAnimationFrame(scroll);
  }

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
    dragHandleElement.addEventListener("click", (e) => handleClick(e, view));
    dragHandleElement.addEventListener("contextmenu", (e) => handleClick(e, view));

    const dragOverHandler = (e: DragEvent) => {
      e.preventDefault();
      if (isDragging) {
        lastClientY = e.clientY;
      }
    };

    const mouseMoveHandler = (e: MouseEvent) => {
      if (isMouseInsideWhileDragging) {
        handleDragEnd(e, view);
      }
    };

    const dragLeaveHandler = (e: DragEvent) => {
      if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        isMouseInsideWhileDragging = true;

        const windowMiddleY = window.innerHeight / 2;

        if (lastClientY < windowMiddleY) {
          isDraggedOutsideWindow = "top";
        } else {
          isDraggedOutsideWindow = "bottom";
        }
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
      let dropDepth = 0;

      // Traverse up the document tree to find if we're inside a list item
      for (let i = resolvedPos.depth; i > 0; i--) {
        if (resolvedPos.node(i).type.name === "listItem") {
          isDroppedInsideList = true;
          dropDepth = i;
          break;
        }
      }

      // Handle nested list items and task items
      if (droppedNode.type.name === "listItem") {
        let slice = view.state.selection.content();
        let newFragment = slice.content;

        // If dropping outside a list or at a different depth, adjust the structure
        if (!isDroppedInsideList || dropDepth !== resolvedPos.depth) {
          // Flatten the structure if needed
          newFragment = flattenListStructure(newFragment, view.state.schema);
        }

        // Wrap in appropriate list type if dropped outside a list
        if (!isDroppedInsideList) {
          const listNodeType =
            listType === "OL" ? view.state.schema.nodes.orderedList : view.state.schema.nodes.bulletList;
          newFragment = Fragment.from(listNodeType.create(null, newFragment));
        }

        slice = new Slice(newFragment, slice.openStart, slice.openEnd);
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

// Helper function to flatten nested list structure
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
        const sublist = node.content.firstChild;
        const flattened = flattenListStructure(sublist.content, schema);
        flattened.forEach((subNode) => result.push(subNode));
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

  // Handle blockquotes separately
  if (node.matches("blockquote")) {
    draggedNodePos = nodePosAtDOMForBlockQuotes(node, view);
    if (draggedNodePos === null || draggedNodePos === undefined) return;
  } else {
    // Resolve the position to get the parent node
    const $pos = view.state.doc.resolve(draggedNodePos);

    // If it's a nested list item or task item, move up to the item level
    if (($pos.parent.type.name === "listItem" || $pos.parent.type.name === "taskItem") && $pos.depth > 1) {
      draggedNodePos = $pos.before($pos.depth);
    }
  }

  const docSize = view.state.doc.content.size;
  draggedNodePos = Math.max(0, Math.min(draggedNodePos, docSize));

  // Use NodeSelection to select the node at the calculated position
  const nodeSelection = NodeSelection.create(view.state.doc, draggedNodePos);

  // Dispatch the transaction to update the selection
  view.dispatch(view.state.tr.setSelection(nodeSelection));

  if (isDragStart) {
    // Additional logic for drag start
    if (event instanceof DragEvent && !event.dataTransfer) return;

    if (nodeSelection.node.type.name === "listItem" || nodeSelection.node.type.name === "taskItem") {
      listType = node.closest("ol, ul")?.tagName || "";
    }

    const slice = view.state.selection.content();
    const { dom, text } = __serializeForClipboard(view, slice);

    if (event instanceof DragEvent) {
      event.dataTransfer.clearData();
      event.dataTransfer.setData("text/html", dom.innerHTML);
      event.dataTransfer.setData("text/plain", text);
      event.dataTransfer.effectAllowed = "copyMove";
      event.dataTransfer.setDragImage(node, 0, 0);
    }

    view.dragging = { slice, move: event.ctrlKey };
  }

  return { listType };
};
