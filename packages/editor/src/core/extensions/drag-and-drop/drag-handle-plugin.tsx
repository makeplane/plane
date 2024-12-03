import { createRoot } from "react-dom/client";

import { NodeType, ResolvedPos } from "@tiptap/pm/model";
import { EditorState, NodeSelection, Plugin, PluginKey, TextSelection, Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet, EditorView } from "@tiptap/pm/view";
import { findParentNodeOfTypeClosestToPos } from "prosemirror-utils";
// ui
import { DragHandle } from "@plane/ui";

const PLUGIN_CONFIG = {
  KEY: new PluginKey("dragHandlePlugin"),
  SCROLL: {
    UP_THRESHOLD: 200,
    DOWN_THRESHOLD: 100,
    MIN_SPEED: 1,
    MAX_SPEED: 20,
    BEHAVIOR: "auto" as const,
  },
  ALLOWED_NODE_TYPES: ["paragraph", "listItem", "table", "codeBlock", "blockquote", "image", "imageComponent"],
} as const;

interface ScrollableContainer extends HTMLElement {
  scrollBy(options: ScrollToOptions): void;
  scrollBy(x: number, y: number): void;
}

const DOMHelpers = {
  isScrollable: (element: HTMLElement | SVGElement): boolean => {
    if (!(element instanceof HTMLElement || element instanceof SVGElement)) return false;
    const style = getComputedStyle(element);
    return ["overflow", "overflow-y"].some((property) => ["auto", "scroll"].includes(style.getPropertyValue(property)));
  },

  findScrollableParent: (element: HTMLElement | SVGElement): ScrollableContainer => {
    let parent = element.parentElement;
    while (parent) {
      if (DOMHelpers.isScrollable(parent)) return parent as ScrollableContainer;
      parent = parent.parentElement;
    }
    return (document.scrollingElement || document.documentElement) as ScrollableContainer;
  },
};

const SelectionHandler = {
  selectTextBlock: (position: number, view: EditorView) => {
    const docSize = view.state.doc.content.size;
    const validPosition = Math.max(0, Math.min(position, docSize - 1));
    const node = view.state.doc.nodeAt(validPosition);

    const endPosition =
      validPosition +
      (node?.type.name === "codeBlock" ? node.nodeSize : view.state.doc.resolve(validPosition).parent.nodeSize - 1);

    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, validPosition, endPosition)));
  },

  findClosestParentNode: (position: ResolvedPos, nodeTypes: NodeType[]) => {
    const parents = nodeTypes
      .map((type) => {
        const parent = findParentNodeOfTypeClosestToPos(position, type);
        return parent && { position: parent.pos, node: parent.node };
      })
      .filter(Boolean);

    return parents[0];
  },
};

// Scroll Handler Class
class ScrollHandler {
  private isDragging = false;
  private lastClientY = 0;
  private animationFrame: number | null = null;

  constructor(private readonly handleElement: HTMLElement) {}

  startDragging(clientY: number) {
    this.isDragging = true;
    this.lastClientY = clientY;
    this.scroll();
  }

  stopDragging() {
    this.isDragging = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  updatePosition(clientY: number) {
    if (this.isDragging) {
      this.lastClientY = clientY;
    }
  }

  private scroll() {
    if (!this.isDragging) return;

    const scrollableParent = DOMHelpers.findScrollableParent(this.handleElement);
    if (!scrollableParent) return;

    const scrollAmount = this.calculateScrollAmount();

    if (scrollAmount !== 0) {
      scrollableParent.scrollBy({
        top: scrollAmount,
        behavior: PLUGIN_CONFIG.SCROLL.BEHAVIOR,
      });
    }

    this.animationFrame = requestAnimationFrame(() => this.scroll());
  }

  private calculateScrollAmount(): number {
    const scrollRegionUp = PLUGIN_CONFIG.SCROLL.UP_THRESHOLD;
    const scrollRegionDown = window.innerHeight - PLUGIN_CONFIG.SCROLL.DOWN_THRESHOLD;

    if (this.lastClientY < scrollRegionUp) {
      const ratio = (scrollRegionUp - this.lastClientY) / PLUGIN_CONFIG.SCROLL.UP_THRESHOLD;
      const easedRatio = Math.pow(ratio, 3);
      return -1 * this.calculateDynamicSpeed(easedRatio);
    }

    if (this.lastClientY > scrollRegionDown) {
      const ratio = (this.lastClientY - scrollRegionDown) / PLUGIN_CONFIG.SCROLL.DOWN_THRESHOLD;
      const easedRatio = Math.pow(ratio, 3);
      return this.calculateDynamicSpeed(easedRatio);
    }

    return 0;
  }

  private calculateDynamicSpeed(easedRatio: number): number {
    const baseSpeed =
      PLUGIN_CONFIG.SCROLL.MIN_SPEED + (PLUGIN_CONFIG.SCROLL.MAX_SPEED - PLUGIN_CONFIG.SCROLL.MIN_SPEED) * easedRatio;
    return Math.sign(baseSpeed) * Math.pow(Math.abs(baseSpeed), 1.5);
  }
}

// Main Plugin Factory
function createDragHandlePlugin(isBlock = false, onMouseDown?: () => void, onMouseUp?: () => void) {
  let dragHandleElement: HTMLElement | null = null;
  let scrollHandler: ScrollHandler;
  let currentCleanup: (() => void) | null = null;

  const createDragHandle = (view: EditorView, getPosition: () => number) => {
    // Clean up previous instance if it exists
    if (currentCleanup) {
      currentCleanup();
      currentCleanup = null;
    }

    if (!dragHandleElement) {
      dragHandleElement = document.createElement("div");
      dragHandleElement.contentEditable = "false";

      const root = createRoot(dragHandleElement);
      root.render(<DragHandle className="absolute drag-handle-container" />);
    }

    scrollHandler = new ScrollHandler(dragHandleElement);

    const handleMouseDown = (event: MouseEvent) => {
      event.stopPropagation();
      scrollHandler.startDragging(event.clientY);
      onMouseDown?.();

      const currentPosition = getPosition();
      const { tr } = view.state;
      tr.setSelection(NodeSelection.create(tr.doc, currentPosition - (isBlock ? 0 : 1)));
      view.dispatch(tr);
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      scrollHandler.updatePosition(event.clientY);
    };

    const cleanupDragHandle = () => {
      scrollHandler.stopDragging();
      onMouseUp?.();

      if (view.dragging) {
        SelectionHandler.selectTextBlock(getPosition(), view);
      }
    };

    // Clean up old event listeners
    const cleanup = () => {
      dragHandleElement?.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", cleanupDragHandle);
      document.removeEventListener("drop", cleanupDragHandle);
      document.removeEventListener("mouseenter", cleanupDragHandle);
      document.removeEventListener("dragover", handleDragOver);
      scrollHandler?.stopDragging();
    };

    // Add new event listeners
    dragHandleElement.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", cleanupDragHandle);
    document.addEventListener("drop", cleanupDragHandle);
    document.addEventListener("mouseenter", cleanupDragHandle);
    document.addEventListener("dragover", handleDragOver);

    currentCleanup = cleanup;

    return dragHandleElement;
  };

  return createDragHandle;
}

function handleMouseMoveEvent(view: EditorView, event: MouseEvent) {
  const position = view.posAtCoords({
    left: event.clientX,
    top: event.clientY,
  });

  if (!position) return;

  const resolvedPos = view.state.doc.resolve(Math.min(position.inside + 1, view.state.doc.content.size - 1));
  const allowedNodeTypes = PLUGIN_CONFIG.ALLOWED_NODE_TYPES.map((name) => view.state.schema.nodes[name]);

  const closestParent = SelectionHandler.findClosestParentNode(resolvedPos, allowedNodeTypes);
  const textBlockParent = resolvedPos.node(1);
  const { tr } = view.state;
  const { handlePos } = PLUGIN_CONFIG.KEY.getState(view.state);

  if (position.inside === -1) return;

  if (!textBlockParent || !closestParent?.node || handlePos === position.inside) {
    if (handlePos !== position.inside && handlePos !== null) {
      tr.setMeta("handle", "removeHandle");
      view.dispatch(tr);
    }
    return;
  }

  const handleDecoration = Decoration.widget(position.inside + 1, createDragHandlePlugin(), {
    containerId: textBlockParent.attrs.componentId,
    pos: position.inside,
    side: -1,
  });

  const decorationSet = DecorationSet.empty.add(view.state.doc, [handleDecoration]);

  tr.setMeta("handle", {
    set: decorationSet,
    handlePos: position.inside,
  });
  view.dispatch(tr);
}

export const DragHandlePlugin = () =>
  new Plugin({
    key: PLUGIN_CONFIG.KEY,
    state: {
      init() {
        return {
          set: DecorationSet.empty,
          handlePos: null,
        };
      },
      apply(tr: Transaction, value) {
        const pluginState = tr.getMeta("handle");

        if (pluginState === "removeHandle" || !pluginState) {
          if (tr.selection instanceof NodeSelection && value.handlePos && tr.getMeta("uiEvent") !== "drop") {
            return value;
          }
          return {
            set: DecorationSet.empty,
            handlePos: null,
          };
        }

        return {
          set: pluginState.set,
          handlePos: pluginState.handlePos,
        };
      },
    },
    props: {
      decorations(state: EditorState) {
        return this.getState(state).set;
      },
      handleDOMEvents: {
        mousemove(view: EditorView, event: MouseEvent): boolean {
          event.preventDefault();
          if (!view.dragging) handleMouseMoveEvent(view, event);
          return false;
        },
        mouseleave(view: EditorView, event: MouseEvent): boolean {
          if ((event.target as Element).closest(".editor-container") === view.dom.closest(".editor-container")) {
            const { tr } = view.state;
            tr.setMeta("handle", "removeHandle");
            view.dispatch(tr);
          }
          return false;
        },
      },
    },
  });
