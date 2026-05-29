import type { Node, Schema } from "@tiptap/pm/model";
import { Fragment, Slice } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// extensions
import type { SideMenuHandleOptions, SideMenuPluginProps } from "@/extensions";

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
  ".editor-drawio-component",
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
  if (!(node instanceof HTMLElement || node instanceof SVGElement)) {
    return false;
  }
  const style = getComputedStyle(node);
  return ["overflow", "overflow-y"].some((propertyName) => {
    const value = style.getPropertyValue(propertyName);
    return value === "auto" || value === "scroll";
  });
};

export const getScrollParent = (node: HTMLElement | SVGElement) => {
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

  for (const elem of elements) {
    // Check for table wrapper first
    if (elem.matches("table:not(.table-drag-preview)")) {
      return elem;
    }

    if (elem.matches("p:first-child") && elem.parentElement?.matches(".ProseMirror")) {
      return elem;
    }

    // Skip table cells
    if (elem.closest("table")) {
      continue;
    }

    // Skip elements inside .editor-embed-component
    if (elem.closest(".editor-embed-component") && !elem.matches(".editor-embed-component")) {
      continue;
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
  let isDragging = false;
  let lastClientY = 0;
  let scrollAnimationFrame: number | null = null;
  let isDraggedOutsideWindow: "top" | "bottom" | boolean = false;
  let isMouseInsideWhileDragging = false;
  let currentScrollSpeed = 0;
  let dragHandleElement: HTMLElement | null = null;

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
      const ratio = easeOutQuadAnimation((scrollRegionUp - lastClientY) / options.scrollThreshold.up);
      targetScrollAmount = -maxScrollSpeed * ratio;
    } else if (lastClientY > scrollRegionDown) {
      const ratio = easeOutQuadAnimation((lastClientY - scrollRegionDown) / options.scrollThreshold.down);
      targetScrollAmount = maxScrollSpeed * ratio;
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
    const { listType: listTypeFromDragStart } = handleNodeSelection(event, view, true, options) ?? {};
    if (listTypeFromDragStart) {
      listType = listTypeFromDragStart;
    }
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
        if (resolvedPos.node(i).type.name === CORE_EXTENSIONS.LIST_ITEM) {
          isDroppedInsideList = true;
          dropDepth = i;
          break;
        }
      }

      // Handle nested list items and task items
      if (droppedNode.type.name === CORE_EXTENSIONS.LIST_ITEM) {
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
        const subList = node.content.firstChild;
        const flattened = flattenListStructure(subList.content, schema);
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

  if (node.matches("table")) {
    draggedNodePos = draggedNodePos - 2;
  } else if (node.matches("blockquote")) {
    draggedNodePos = nodePosAtDOMForBlockQuotes(node, view);
    if (draggedNodePos === null || draggedNodePos === undefined) return;
  } else {
    // Resolve the position to get the parent node
    const $pos = view.state.doc.resolve(draggedNodePos);

    // If it's a nested list item or task item, move up to the item level
    if (
      [CORE_EXTENSIONS.LIST_ITEM, CORE_EXTENSIONS.TASK_ITEM].includes($pos.parent.type.name as CORE_EXTENSIONS) &&
      $pos.depth > 1
    ) {
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

    view.dragging = { slice, move: event.ctrlKey };
  }

  return { listType };
};
