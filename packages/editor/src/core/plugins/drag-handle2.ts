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
  dragHandleElement.draggable = false;
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
  let ghostElement: HTMLElement | null = null;
  let mouseDownTime = 0;

  const createGhostElement = (view: EditorView, slice: Slice) => {
    const { dom } = __serializeForClipboard(view, slice);
    dom.classList.add("drag-ghost");
    dom.style.position = "fixed";
    dom.style.pointerEvents = "none";
    dom.style.zIndex = "1000";
    dom.style.opacity = "0.8";
    dom.style.background = "var(--custom-background-100)";
    dom.style.padding = "8px";
    dom.style.borderRadius = "4px";
    dom.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
    return dom;
  };

  const handleMouseDown = (event: MouseEvent, view: EditorView) => {
    if (event.button !== 0) return;

    mouseDownTime = Date.now();

    const node = nodeDOMAtCoords({
      x: event.clientX + 50 + options.dragHandleWidth,
      y: event.clientY,
    });

    if (!(node instanceof Element)) return;

    // Get initial position for selection
    let draggedNodePos = nodePosAtDOM(node, view, options);
    if (draggedNodePos == null || draggedNodePos < 0) return;
    draggedNodePos = calcNodePos(draggedNodePos, view, node);

    const handleMouseMove = (e: MouseEvent) => {
      if (Date.now() - mouseDownTime < 200) return;

      if (!isDragging) {
        isDragging = true;
        event.preventDefault();

        // Apply the same selection logic as in original code
        const { from, to } = view.state.selection;
        const diff = from - to;

        const fromSelectionPos = calcNodePos(from, view, node);
        let differentNodeSelected = false;

        const nodePos = view.state.doc.resolve(fromSelectionPos);

        if (nodePos.node().type.name === "doc") differentNodeSelected = true;
        else {
          const nodeSelection = NodeSelection.create(view.state.doc, nodePos.before());
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

        // Handle special cases
        if (view.state.selection instanceof NodeSelection && view.state.selection.node.type.name === "listItem") {
          listType = node.parentElement!.tagName;
        }

        if (node.matches("blockquote")) {
          let nodePosForBlockQuotes = nodePosAtDOMForBlockQuotes(node, view);
          if (nodePosForBlockQuotes !== null && nodePosForBlockQuotes !== undefined) {
            const docSize = view.state.doc.content.size;
            nodePosForBlockQuotes = Math.max(0, Math.min(nodePosForBlockQuotes, docSize));

            if (nodePosForBlockQuotes >= 0 && nodePosForBlockQuotes <= docSize) {
              const nodeSelection = NodeSelection.create(view.state.doc, nodePosForBlockQuotes);
              view.dispatch(view.state.tr.setSelection(nodeSelection));
            }
          }
        }

        // Create ghost after selection is set
        const slice = view.state.selection.content();
        ghostElement = createGhostElement(view, slice);
        document.body.appendChild(ghostElement);

        // Set dragging state for ProseMirror
        view.dragging = { slice, move: event.ctrlKey };
      }

      if (!ghostElement) return;

      ghostElement.style.left = `${e.clientX}px`;
      ghostElement.style.top = `${e.clientY}px`;

      lastClientY = e.clientY;

      view.dom.dispatchEvent(
        new DragEvent("dragover", {
          clientX: e.clientX,
          clientY: e.clientY,
          bubbles: true,
          dataTransfer: new DataTransfer(),
        })
      );
    };

    const handleMouseUp = (e: MouseEvent) => {
      const dragDuration = Date.now() - mouseDownTime;

      if (dragDuration < 200 || !isDragging) {
        // This was a click, not a drag
        handleClick(event, view);
      } else if (isDragging) {
        // Handle drop
        const dropEvent = new DragEvent("drop", {
          clientX: e.clientX,
          clientY: e.clientY,
          bubbles: true,
          dataTransfer: new DataTransfer(),
        });

        const slice = view.state.selection.content();
        const { dom, text } = __serializeForClipboard(view, slice);
        dropEvent.dataTransfer?.setData("text/html", dom.innerHTML);
        dropEvent.dataTransfer?.setData("text/plain", text);

        view.dom.dispatchEvent(dropEvent);
      }

      // Cleanup
      isDragging = false;
      ghostElement?.remove();
      ghostElement = null;

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

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

    // TODO FIX ERROR
    // Use NodeSelection to select the node at the calculated position
    const nodeSelection = NodeSelection.create(view.state.doc, nodePos);

    // Dispatch the transaction to update the selection
    view.dispatch(view.state.tr.setSelection(nodeSelection));
  };

  function scroll() {
    if (!isDragging) {
      return;
    }

    const scrollableParent = getScrollParent(dragHandleElement);
    if (!scrollableParent) return;
    const scrollThreshold = options.scrollThreshold;

    const maxScrollSpeed = 20;
    const clientY = lastClientY; // Use the last known clientY
    let scrollAmount = 0;

    // Define the upper and lower scroll regions
    const scrollRegionUp = scrollThreshold.up;
    const scrollRegionDown = window.innerHeight - scrollThreshold.down;

    // Calculate scroll amount when mouse is near the top
    if (clientY < scrollRegionUp) {
      const overflow = scrollRegionUp - clientY;
      const ratio = Math.min(Math.pow(overflow / scrollThreshold.up, 2), 1);
      const speed = maxScrollSpeed * ratio;
      scrollAmount = -speed;
    }

    // Calculate scroll amount when mouse is near the bottom
    else if (clientY > scrollRegionDown) {
      const overflow = clientY - scrollRegionDown;
      const ratio = Math.min(Math.pow(overflow / scrollThreshold.down, 2), 1);
      const speed = maxScrollSpeed * ratio;
      scrollAmount = speed;
    }

    // Handle cases when mouse is outside the window (above or below)
    if (clientY <= 0) {
      console.log("ran above");
      const overflow = scrollThreshold.up + Math.abs(clientY);
      const ratio = Math.min(Math.pow(overflow / (scrollThreshold.up + 100), 2), 1);
      const speed = maxScrollSpeed * ratio;
      scrollAmount = -speed;
    } else if (clientY >= window.innerHeight) {
      console.log("ran below");
      const overflow = clientY - window.innerHeight + scrollThreshold.down;
      const ratio = Math.min(Math.pow(overflow / (scrollThreshold.down + 100), 2), 1);
      const speed = maxScrollSpeed * ratio;
      scrollAmount = speed;
    }

    document.addEventListener("mouseout", function (event) {
      // Check if the mouse has left the window from the top or bottom
      if (event.clientY <= 0) {
        console.log("Mouse left from the top");
        // Handle the logic for when the mouse leaves from the top
        const overflow = scrollThreshold.up + Math.abs(event.clientY);
        const ratio = Math.min(Math.pow(overflow / (scrollThreshold.up + 100), 2), 1);
        const speed = maxScrollSpeed * ratio;
        scrollAmount = -speed;
      } else if (event.clientY >= window.innerHeight) {
        console.log("Mouse left from the bottom");
        // Handle the logic for when the mouse leaves from the bottom
        const overflow = event.clientY - window.innerHeight + scrollThreshold.down;
        const ratio = Math.min(Math.pow(overflow / (scrollThreshold.down + 100), 2), 1);
        const speed = maxScrollSpeed * ratio;
        scrollAmount = speed;
      }
    });

    if (scrollAmount !== 0) {
      scrollableParent.scrollBy({ top: scrollAmount });
    }

    // Continue the scrolling loop
    scrollAnimationFrame = requestAnimationFrame(scroll);
  }

  let dragHandleElement: HTMLElement | null = null;
  // drag handle view actions
  const showDragHandle = () => dragHandleElement?.classList.remove("drag-handle-hidden");
  const hideDragHandle = () => {
    if (!dragHandleElement?.classList.contains("drag-handle-hidden"))
      dragHandleElement?.classList.add("drag-handle-hidden");
  };

  const handleCleanup = (event: MouseEvent | FocusEvent, view: EditorView) => {
    event.preventDefault();
    isDragging = false;
    ghostElement?.remove();
    ghostElement = null;

    if (scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = null;
    }

    view.dom.classList.remove("dragging");
  };

  const view = (view: EditorView, sideMenu: HTMLDivElement | null) => {
    dragHandleElement = createDragHandleElement();
    dragHandleElement.addEventListener("mousedown", (e) => handleMouseDown(e, view));
    dragHandleElement.addEventListener("click", (e) => handleClick(e, view));
    dragHandleElement.addEventListener("contextmenu", (e) => handleClick(e, view));

    // Replace dragend/blur handlers with cleanup
    window.addEventListener("blur", (e) => handleCleanup(e, view));

    document.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (isDragging) {
        lastClientY = event.clientY;
      }
    });

    hideDragHandle();

    sideMenu?.appendChild(dragHandleElement);

    return {
      destroy: () => {
        dragHandleElement?.remove?.();
        dragHandleElement = null;
        isDragging = false;
        ghostElement?.remove();
        ghostElement = null;
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
