import { Plugin, EditorState, PluginKey, NodeSelection } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { dropPoint } from "@tiptap/pm/transform";
import { Editor, Extension } from "@tiptap/core";

interface DropCursorOptions {
  /// The color of the cursor. Defaults to `black`. Use `false` to apply no color and rely only on class.
  color?: string | false;

  /// The precise width of the cursor in pixels. Defaults to 1.
  width?: number;

  /// A CSS class name to add to the cursor element.
  class?: string;
}

/// Create a plugin that, when added to a ProseMirror instance,
/// causes a decoration to show up at the drop position when something
/// is dragged over the editor.
///
/// Nodes may add a `disableDropCursor` property to their spec to
/// control the showing of a drop cursor inside them. This may be a
/// boolean or a function, which will be called with a view and a
/// position, and should return a boolean.
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
        const { isBetweenFlatLists, isNestedList, hasNestedLists, pos, isHoveringOverListContent } =
          isBetweenFlatListsFn(event, tiptapEditorOptions.editor);

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
    // if (pos == this.cursorPos && isBetweenFlatLists == this.isBetweenFlatLists) return;
    this.cursorPos = pos;
    if (pos == null) {
      this.element!.parentNode!.removeChild(this.element!);
      this.element = null;
    } else {
      this.updateOverlay(isBetweenFlatLists);
    }
  }

  updateOverlay(isBetweenFlatLists?: boolean) {
    const isBetweenFlatList = isBetweenFlatLists ?? false;
    const $pos = this.editorView.state.doc.resolve(this.cursorPos!);
    const isBlock = !$pos.parent.inlineContent;
    // const isSpecialCase = isNodeAtDepthAndItsParentIsParagraphWhoseParentIsList($pos);
    let rect: Partial<DOMRect>;
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
          rect = { left: nodeRect.left, right: nodeRect.right, top: top - halfWidth, bottom: top + halfWidth };
        }
      }
    }
    if (!rect) {
      const coords = this.editorView.coordsAtPos(this.cursorPos!);
      const halfWidth = (this.width / 2) * scaleX;
      rect = { left: coords.left - halfWidth, right: coords.left + halfWidth, top: coords.top, bottom: coords.bottom };
    }

    const parent = this.editorView.dom.offsetParent as HTMLElement;
    if (!this.element) {
      this.element = parent.appendChild(document.createElement("div"));
      if (this.class) this.element.className = this.class;
      this.element.style.cssText = "position: absolute; z-index: 50; pointer-events: none; ";
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
      const rect = parent.getBoundingClientRect();
      const parentScaleX = rect.width / parent.offsetWidth,
        parentScaleY = rect.height / parent.offsetHeight;
      parentLeft = rect.left - parent.scrollLeft * parentScaleX;
      parentTop = rect.top - parent.scrollTop * parentScaleY;
    }
    this.element.style.left = (rect.left - parentLeft) / scaleX - (isBetweenFlatList ? 20 : 0) + "px";
    this.element.style.top = (rect.top - parentTop) / scaleY + "px";
    this.element.style.width = (rect.right - rect.left) / scaleX + "px";
    this.element.style.height = (rect.bottom - rect.top) / scaleY + "px";
  }

  scheduleRemoval(timeout: number) {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.setCursor(null), timeout);
  }

  dragover(event: DragEvent) {
    if (!this.editorView.editable) return;
    const pos = this.editorView.posAtCoords({ left: event.clientX, top: event.clientY });

    const {
      isBetweenFlatLists,
      pos: posList,
      isNestedList,
      hasNestedLists,
      listLevel,
      isHoveringOverListContent,
    } = isBetweenFlatListsFn(event, this.editor);
    if (isBetweenFlatLists && this.element) {
      pos.pos = posList;
    }

    if (pos) {
      const node = pos.inside >= 0 && this.editorView.state.doc.nodeAt(pos.inside);
      const disableDropCursor = node && node.type.spec.disableDropCursor;
      const disabled =
        typeof disableDropCursor == "function" ? disableDropCursor(this.editorView, pos, event) : disableDropCursor;

      // if (isHoveringOverListContent) {
      //   this.element.style.backgroundColor = "black";
      //   // apply background color to to this.element ::before
      // } else {
      //   if (this.element) {
      //     this.element.style.backgroundColor = "red";
      //   }
      // }

      if (!disabled) {
        let target = pos.pos;
        if (this.editorView.dragging && this.editorView.dragging.slice) {
          const point = dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice);
          if (point != null) target = point;
        }
        this.dropPosByDropCursorPos = target;
        this.setCursor(target, !!isBetweenFlatLists && !isHoveringOverListContent);
        this.scheduleRemoval(5000);
      }
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
  addProseMirrorPlugins(this) {
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

function isBetweenFlatListsFn(event: DragEvent, editor: Editor) {
  const elementUnderDrag = document.elementFromPoint(event.clientX, event.clientY);

  let editorPos = editor.view.posAtCoords({ left: event.clientX, top: event.clientY });
  let pos = null;
  const currentFlatList = elementUnderDrag?.closest(".prosemirror-flat-list");

  if (!currentFlatList) {
    return;
  }
  let level = null;
  let hasNestedLists = false;
  let firstChild = null;
  let isHoveringOverListContent = false;

  // if the element under drag is a not a flat list but a child of a flat listLevel
  if (currentFlatList && !elementUnderDrag.classList.contains("prosemirror-flat-list")) {
    isHoveringOverListContent = true;
  }

  if (currentFlatList) {
    const sibling = currentFlatList.nextElementSibling;
    if (sibling) {
      const rect = sibling?.getBoundingClientRect();

      pos = editor.view.posAtCoords({
        left: rect.left,
        top: rect.top,
      });
    }

    firstChild = currentFlatList.querySelectorAll(".prosemirror-flat-list")[0] as HTMLElement;
    if (firstChild) {
      const rect = firstChild?.getBoundingClientRect();
      pos = editor.view.posAtCoords({
        left: rect.left,
        top: rect.top,
      });
      hasNestedLists = true;
    }
  }

  level = getListLevel(currentFlatList);
  if (level >= 1) {
    const sibling = currentFlatList.nextElementSibling;
    if (!sibling) {
      const currentFlatListParentSibling = currentFlatList.parentElement;
      // __AUTO_GENERATED_PRINT_VAR_START__
      console.log("isBetweenFlatListsFn#if#if currentFlatListParentSibling: ", currentFlatListParentSibling); // __AUTO_GENERATED_PRINT_VAR_END__
      const rect = currentFlatListParentSibling.getBoundingClientRect();
      pos = editor.view.posAtCoords({
        left: rect.left,
        top: rect.top,
      });
      console.log("pos", pos);
    }
  }

  return {
    isHoveringOverListContent,
    isBetweenFlatLists: !!currentFlatList,
    pos: pos.pos - 1,
    listLevel: level,
    isNestedList: level >= 1,
    hasNestedLists,
  };
}

function getListLevel(element: Element): number {
  let level = 0;
  let current = element.parentElement;

  while (current && current !== document.body) {
    if (current.matches(".prosemirror-flat-list")) {
      level++;
    }
    current = current.parentElement;
  }

  return level;
}

// handle the case where the list has a child list, we need to show drop cursor
// above the first child of the list and not the nextListItem to the list -->
// Done

// handle the case where there's only one list in the list i.e. no sibling list
