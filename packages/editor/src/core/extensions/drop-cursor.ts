import { Editor, Extension } from "@tiptap/core";
import { Plugin, EditorState, PluginKey, NodeSelection } from "@tiptap/pm/state";
import { dropPoint } from "@tiptap/pm/transform";
import { EditorView } from "@tiptap/pm/view";

interface DropCursorOptions {
  /// The color of the cursor. Defaults to `black`. Use `false` to apply no color and rely only on class.
  color?: string | false;

  /// The precise width of the cursor in pixels. Defaults to 1.
  width?: number;

  /// A CSS class name to add to the cursor element.
  class?: string;
}

export function dropCursor(options: DropCursorOptions = {}, tiptapEditorOptions: { editor: Editor }): Plugin {
  const pluginKey = new PluginKey("dropCursor");

  return new Plugin({
    key: pluginKey,
    state: {
      init() {
        return { dropPosByDropCursorPos: null };
      },
      apply(tr, state) {
        // Get the new state from meta
        const meta = tr.getMeta(pluginKey);
        if (meta) {
          return { dropPosByDropCursorPos: meta.dropPosByDropCursorPos };
        }
        return state;
      },
    },
    view(editorView) {
      return new DropCursorView(editorView, options, tiptapEditorOptions.editor, pluginKey);
    },
    props: {
      handleDrop(view, event, slice, moved) {
        const { isBetweenFlatLists, isHoveringOverListContent } =
          rawIsBetweenFlatListsFn(event, tiptapEditorOptions.editor) || {};

        const state = pluginKey.getState(view.state);
        let dropPosByDropCursorPos = state?.dropPosByDropCursorPos;
        if (isHoveringOverListContent) {
          dropPosByDropCursorPos -= 1;
        }

        if (isBetweenFlatLists && dropPosByDropCursorPos) {
          const tr = view.state.tr;

          if (moved) {
            // Get the size of content to be deleted
            const selection = tr.selection;
            const deleteSize = selection.to - selection.from;

            // Adjust drop position if it's after the deletion point
            if (dropPosByDropCursorPos > selection.from) {
              dropPosByDropCursorPos -= deleteSize;
            }

            tr.deleteSelection();
          }

          // Insert the content
          tr.insert(dropPosByDropCursorPos, slice.content);

          // Create a NodeSelection on the newly inserted content
          const $pos = tr.doc.resolve(dropPosByDropCursorPos);
          const node = $pos.nodeAfter;

          if (node) {
            const nodeSelection = NodeSelection.create(tr.doc, dropPosByDropCursorPos);
            tr.setSelection(nodeSelection);
          }

          view.dispatch(tr);
          return true;
        }
        return false;
      },
    },
  });
}

// Add disableDropCursor to NodeSpec
declare module "prosemirror-model" {
  interface NodeSpec {
    disableDropCursor?:
      | boolean
      | ((view: EditorView, pos: { pos: number; inside: number }, event: DragEvent) => boolean);
  }
}

class DropCursorView {
  private width: number;
  private color: string | undefined;
  private class: string | undefined;
  private cursorPos: number | null = null;
  private element: HTMLElement | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private handlers: { name: string; handler: (event: Event) => void }[];
  private editor: Editor;

  // Throttled version of our isBetweenFlatListsFn
  private isBetweenFlatListsFn: (event: DragEvent) => ReturnType<typeof rawIsBetweenFlatListsFn>;

  constructor(
    private readonly editorView: EditorView,
    options: DropCursorOptions,
    editor: Editor,
    private readonly pluginKey: PluginKey
  ) {
    this.width = options.width ?? 1;
    this.color = options.color === false ? undefined : options.color || `rgb(115, 115, 115)`;
    this.class = options.class;
    this.editor = editor;

    // Create the throttled function and store for use in dragover
    this.isBetweenFlatListsFn = createThrottledIsBetweenFlatListsFn(editor);

    this.handlers = ["dragover", "dragend", "drop", "dragleave"].map((name) => {
      const handler = (e: Event) => {
        (this as any)[name](e);
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
      if (this.cursorPos > editorView.state.doc.content.size) this.setCursor(null);
      else this.updateOverlay();
    }
  }

  setCursor(pos: number | null, isBetweenFlatLists?: boolean) {
    this.cursorPos = pos;
    if (pos == null) {
      if (this.element?.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
    } else {
      this.updateOverlay(isBetweenFlatLists);
    }
  }

  updateOverlay(isBetweenFlatLists?: boolean) {
    const isBetweenFlatList = isBetweenFlatLists ?? false;
    const $pos = this.editorView.state.doc.resolve(this.cursorPos!);
    const isBlock = !$pos.parent.inlineContent;
    let rect: Partial<DOMRect> | undefined;
    const editorDOM = this.editorView.dom;
    const editorRect = editorDOM.getBoundingClientRect();
    const scaleX = editorRect.width / editorDOM.offsetWidth;
    const scaleY = editorRect.height / editorDOM.offsetHeight;

    if (isBlock) {
      const before = $pos.nodeBefore;
      const after = $pos.nodeAfter;
      if (before || after) {
        const node = this.editorView.nodeDOM(this.cursorPos! - (before ? before.nodeSize : 0));
        if (node) {
          const nodeRect = (node as HTMLElement).getBoundingClientRect();
          let top = before ? nodeRect.bottom : nodeRect.top;
          if (before && after) {
            top = (top + (this.editorView.nodeDOM(this.cursorPos!) as HTMLElement).getBoundingClientRect().top) / 2;
          }
          const halfWidth = (this.width / 2) * scaleY;
          rect = {
            left: nodeRect.left,
            right: nodeRect.right,
            top: top - halfWidth,
            bottom: top + halfWidth,
          };
        }
      }
    }
    if (!rect) {
      const coords = this.editorView.coordsAtPos(this.cursorPos!);
      const halfWidth = (this.width / 2) * scaleX;
      rect = {
        left: coords.left - halfWidth,
        right: coords.left + halfWidth,
        top: coords.top,
        bottom: coords.bottom,
      };
    }

    const parent = this.editorView.dom.offsetParent as HTMLElement;
    if (!this.element) {
      this.element = parent.appendChild(document.createElement("div"));
      if (this.class) this.element.className = this.class;
      this.element.style.cssText = "position: absolute; z-index: 50; pointer-events: none";
      if (this.color) {
        this.element.style.backgroundColor = this.color;
      }
    }
    this.element.classList.toggle("prosemirror-dropcursor-block", isBlock);
    this.element.classList.toggle("prosemirror-dropcursor-inline", !isBlock);

    let parentLeft: number, parentTop: number;
    if (!parent || (parent == document.body && getComputedStyle(parent).position == "static")) {
      parentLeft = -window.scrollX;
      parentTop = -window.scrollY;
    } else {
      const parentRect = parent.getBoundingClientRect();
      const parentScaleX = parentRect.width / parent.offsetWidth;
      const parentScaleY = parentRect.height / parent.offsetHeight;
      parentLeft = parentRect.left - parent.scrollLeft * parentScaleX;
      parentTop = parentRect.top - parent.scrollTop * parentScaleY;
    }

    // Adjust left if we're between flat lists
    const finalLeft = (rect.left! - parentLeft) / scaleX;
    const finalTop = (rect.top! - parentTop) / scaleY;
    const finalWidth = (rect.right! - rect.left!) / scaleX;
    const finalHeight = (rect.bottom! - rect.top!) / scaleY;
    this.element.style.transform = isBetweenFlatList ? `translateX(${-20}px` : `translateX(0px)`;
    this.element.style.left = finalLeft + "px";
    this.element.style.top = finalTop + "px";
    this.element.style.width = finalWidth + "px";
    this.element.style.height = finalHeight + "px";
  }

  scheduleRemoval(timeout: number) {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.setCursor(null), timeout);
  }

  dragover(event: DragEvent) {
    if (!this.editorView.editable) return;

    const pos = this.editorView.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    });

    if (!pos) return;

    // Throttled call to the function
    const result = this.isBetweenFlatListsFn(event);

    let isHoveringOverListContentVar = false;
    let isBetweenFlatListsVar = false;
    if (result) {
      if ("pos" in result) {
        const { isBetweenFlatLists, pos: posList, isHoveringOverListContent } = result;
        isBetweenFlatListsVar = isBetweenFlatLists;
        isHoveringOverListContentVar = isHoveringOverListContent;
        if (isBetweenFlatLists && this.element) {
          pos.pos = posList;
        }
      } else {
        const { isBetweenFlatLists, isHoveringOverListContent } = result;
        isBetweenFlatListsVar = isBetweenFlatLists;
        isHoveringOverListContentVar = isHoveringOverListContent;
      }
    }

    const node = pos.inside >= 0 && this.editorView.state.doc.nodeAt(pos.inside);
    const disableDropCursor = node && node.type.spec.disableDropCursor;
    const disabled =
      typeof disableDropCursor == "function" ? disableDropCursor(this.editorView, pos, event) : disableDropCursor;

    if (pos && !disabled) {
      let target = pos.pos;
      if (this.editorView.dragging && this.editorView.dragging.slice) {
        const point = dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice);
        if (point != null) target = point;
      }
      this.dropPosByDropCursorPos = target;
      this.setCursor(target, !!isBetweenFlatListsVar && !isHoveringOverListContentVar);
      this.scheduleRemoval(5000);
    }
  }

  dragend() {
    this.scheduleRemoval(20);
  }

  drop() {
    this.scheduleRemoval(20);
  }

  dragleave(event: DragEvent) {
    const relatedTarget = event.relatedTarget as Node | null;
    if (relatedTarget && !this.editorView.dom.contains(relatedTarget)) {
      this.setCursor(null);
    }
  }

  set dropPosByDropCursorPos(pos: number | null) {
    const tr = this.editorView.state.tr;
    tr.setMeta(this.pluginKey, { dropPosByDropCursorPos: pos });
    this.editorView.dispatch(tr);
  }

  get dropPosByDropCursorPos(): number | null {
    return this.pluginKey.getState(this.editorView.state)?.dropPosByDropCursorPos;
  }
}

export const DropCursorExtension = Extension.create({
  name: "dropCursor",
  addProseMirrorPlugins() {
    return [
      dropCursor(
        {
          width: 2,
          class: "transition-all duration-200 ease-[cubic-bezier(0.165, 0.84, 0.44, 1)]",
        },
        this
      ),
    ];
  },
});

function findDirectChild(element: HTMLElement, parentClass: string) {
  const parent = element.closest(`.${parentClass}`);
  if (!parent) return null;

  // Get all direct children of parent that contain our element
  const directChildren = Array.from(parent.children);
  return directChildren.find((child) => child.contains(element));
}

function rawIsBetweenFlatListsFn(event: DragEvent, editor: Editor) {
  const coords = {
    left: event.clientX,
    top: event.clientY,
  };

  const positionCache = new WeakMap();

  const elementUnderDrag = document.elementFromPoint(coords.left, coords.top);
  if (!elementUnderDrag) return null;

  const currentFlatList = elementUnderDrag.closest(".prosemirror-flat-list");
  if (!currentFlatList) return null;
  const currentListContent = currentFlatList.querySelector(".list-content");

  const children = Array.from(currentListContent?.childNodes || []);

  if (event.target instanceof HTMLElement) {
    const child = findDirectChild(event.target as HTMLElement, "list-content");
    const offset = children.indexOf(child as HTMLElement);
    if (offset > 0) {
      return { isBetweenFlatLists: false, isHoveringOverListContent: false };
    }
  }

  let isInsideToggleOrTask = false;
  if (
    currentFlatList.getAttribute("data-list-kind") === "toggle" ||
    currentFlatList.getAttribute("data-list-kind") === "task"
  ) {
    isInsideToggleOrTask = true;
  }

  const state = {
    isHoveringOverListContent: !elementUnderDrag.classList.contains("prosemirror-flat-list"),
    isBetweenFlatLists: true,
    hasNestedLists: false,
    pos: null as number | null,
    listLevel: 0,
    isNestedList: false,
  };

  if (isInsideToggleOrTask) {
    const firstChildListMarker = currentFlatList.firstChild as HTMLElement;
    state.isHoveringOverListContent = firstChildListMarker?.classList.contains("list-marker");
  }

  const getPositionFromElement = (element: Element, some?: boolean): number | null => {
    if (positionCache.has(element)) {
      return positionCache.get(element);
    }

    const pos = editor.view.posAtDOM(element, 0);
    function getNodeAtPos(state: EditorState, pos: number) {
      const $pos = state.doc.resolve(pos);
      return $pos.node();
    }
    const editorNode = getNodeAtPos(editor.view.state, pos);

    let result = pos ?? null;
    if (some) {
      result = pos + editorNode.nodeSize;
    }
    positionCache.set(element, result);
    return result;
  };

  // Check for child list within the current list item
  const childList = currentFlatList?.querySelector(".prosemirror-flat-list");
  if (childList) {
    state.pos = getPositionFromElement(childList);
    state.hasNestedLists = true;
    state.isNestedList = true;
  } else {
    // Existing logic for other cases
    const sibling = currentFlatList.nextElementSibling;
    const firstNestedList = currentFlatList.querySelector(":scope > .prosemirror-flat-list");

    const level = getListLevelOptimized(currentFlatList);
    state.listLevel = level;
    state.isNestedList = level >= 1;

    if (sibling) {
      state.pos = getPositionFromElement(sibling);
    } else if (firstNestedList) {
      state.pos = getPositionFromElement(firstNestedList);
      state.hasNestedLists = true;
    } else if (level >= 1 && !sibling) {
      const parent = currentFlatList.parentElement?.parentElement;
      const poss = getPositionFromElement(currentFlatList as Element, true);
      if (parent) {
        state.pos = poss;
      }
    }
  }

  if (!state.pos) return null;

  return {
    ...state,
    pos: state.pos - 1,
  };
}

// Optimized list level calculation
function getListLevelOptimized(element: Element): number {
  let level = 0;
  let current = element.parentElement;

  // Use a more efficient selector matching
  while (current && !current.classList.contains("ProseMirror")) {
    if (current.classList.contains("prosemirror-flat-list")) {
      level++;
    }
    current = current.parentElement;
  }

  return level;
}

function createThrottledIsBetweenFlatListsFn(
  editor: Editor,
  moveThreshold = 8 // px of mouse movement before re-checking
) {
  let lastX = 0;
  let lastY = 0;
  let lastResult: ReturnType<typeof rawIsBetweenFlatListsFn> | null = null;

  return function throttledIsBetweenFlatListsFn(event: DragEvent) {
    const dx = Math.abs(event.clientX - lastX);
    const dy = Math.abs(event.clientY - lastY);

    // Only recalc if we moved enough OR enough time passed
    if (dx < moveThreshold && dy < moveThreshold) {
      return lastResult;
    }

    lastX = event.clientX;
    lastY = event.clientY;
    lastResult = rawIsBetweenFlatListsFn(event, editor);
    return lastResult;
  };
}
