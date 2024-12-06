import { Plugin, EditorState, NodeSelection } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { dropPoint } from "@tiptap/pm/transform";
import { Editor, Extension } from "@tiptap/core";
import { Node as ProseMirrorNode, ResolvedPos } from "@tiptap/pm/model";

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
export function dropCursor(
  options: DropCursorOptions = {},
  tiptapEditorOptions: {
    name: string;
    options: any;
    storage: any;
    editor: Editor;
    parent: () => Plugin<any>[];
  }
): Plugin {
  return new Plugin({
    view(editorView) {
      return new DropCursorView(editorView, options, tiptapEditorOptions.editor);
    },
    props: {
      handleDrop(view, event) {
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (pos) {
          const $pos = view.state.doc.resolve(pos.pos);
          // Only prevent default if we're between lists
          if (isBetweenNodesOfType($pos, "list").isBetweenNodesOfType) {
            return true;
          }
        }
        return false; // Let other drop handlers work normally
      },
    },
  });
}

function isBetweenNodesOfType(
  $pos: ResolvedPos,
  nodeType: string
): { isBetweenNodesOfType: boolean; isDirectlyBetweenLists: boolean; position?: number } {
  // Check direct siblings first
  if ($pos.nodeBefore?.type.name === nodeType && $pos.nodeAfter?.type.name === nodeType) {
    return { isBetweenNodesOfType: true, isDirectlyBetweenLists: true, position: $pos.pos };
  }

  // Helper function to get all parent types up to root and their positions
  const getParentTypes = (
    node: ProseMirrorNode | null,
    $pos: ResolvedPos
  ): { types: Set<string>; position?: number } => {
    const types = new Set<string>();
    if (!node) return { types };

    types.add(node.type.name);
    if (node.type.name === nodeType) {
      return { types, position: $pos.pos };
    }

    // Traverse up through all depths
    for (let depth = $pos.depth; depth > 0; depth--) {
      const parent = $pos.node(depth);
      types.add(parent.type.name);
      if (parent.type.name === nodeType) {
        return { types, position: $pos.before(depth) };
      }
    }
    return { types };
  };

  // Get parent types and positions for both before and after nodes
  const before = getParentTypes($pos.nodeBefore, $pos);
  const after = getParentTypes($pos.nodeAfter, $pos);

  console.log("before", before.position);
  console.log("after", after.position);
  // Check if both branches contain the nodeType and return the relevant position
  if (before.types.has(nodeType) && before.position !== undefined) {
    return { isBetweenNodesOfType: true, isDirectlyBetweenLists: false, position: before.position };
  }
  if (after.types.has(nodeType) && after.position !== undefined) {
    return { isBetweenNodesOfType: true, isDirectlyBetweenLists: false, position: after.position };
  }

  return { isBetweenNodesOfType: false, isDirectlyBetweenLists: false };
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
  private lastValidPosition: number | null = null;

  constructor(
    private readonly editorView: EditorView,
    options: DropCursorOptions,
    editor: Editor
  ) {
    this.width = options.width ?? 1;
    this.color = options.color === false ? undefined : options.color || "red";
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

  setCursor(pos: number | null) {
    if (pos == this.cursorPos) return;
    this.cursorPos = pos;
    if (pos == null) {
      this.element!.parentNode!.removeChild(this.element!);
      this.element = null;
    } else {
      this.updateOverlay();
    }
  }

  updateOverlay() {
    const $pos = this.editorView.state.doc.resolve(this.cursorPos!);
    const isBlock = !$pos.parent.inlineContent;
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
      this.element.style.cssText = "position: absolute; z-index: 50; pointer-events: none;";
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
    this.element.style.left = (rect.left - parentLeft) / scaleX + "px";
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

    if (pos) {
      const $pos = this.editorView.state.doc.resolve(pos.pos);

      const node = pos.inside >= 0 && this.editorView.state.doc.nodeAt(pos.inside);
      const disableDropCursor = node && node.type.spec.disableDropCursor;
      const disabled =
        typeof disableDropCursor == "function" ? disableDropCursor(this.editorView, pos, event) : disableDropCursor;

      if (!disabled) {
        const { isBetweenNodesOfType: isBetweenNodesOfTypeLists, position } = isBetweenNodesOfType($pos, "list");

        if (isBetweenNodesOfTypeLists && position !== undefined) {
          this.lastValidPosition = position;
          this.setCursor(position);
          console.log("cursor set at ", position);
          return;
        }

        let target = pos.pos;
        if (this.editorView.dragging && this.editorView.dragging.slice) {
          const point = dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice);
          if (point != null) target = point;
        }
        this.setCursor(target);
        this.scheduleRemoval(5000);
      }
    }
  }

  dragend() {
    this.scheduleRemoval(20);
  }

  drop(event: DragEvent) {
    const pos = this.editorView.posAtCoords({ left: event.clientX, top: event.clientY });
    if (pos) {
      const $pos = this.editorView.state.doc.resolve(pos.pos);
      if (isBetweenNodesOfType($pos, "list").isBetweenNodesOfType) {
        event.preventDefault();
        event.stopPropagation();

        let draggedContent: ProseMirrorNode | null = null;
        let originalFrom: number | null = null;
        let originalTo: number | null = null;

        if (this.lastValidPosition !== null) {
          if (this.editorView.state.selection instanceof NodeSelection) {
            draggedContent = this.editorView.state.selection.node;
            originalFrom = this.editorView.state.selection.from;
            originalTo = this.editorView.state.selection.to;
          }

          if (draggedContent && originalFrom !== null && originalTo !== null) {
            const tr = this.editorView.state.tr;
            // Remove the node from its original position
            tr.delete(originalFrom, originalTo);
            // Insert the node at the new position
            tr.insert(this.lastValidPosition, draggedContent);
            // Apply the transaction
            this.editorView.dispatch(tr);
          }
          this.lastValidPosition = null;
        }
      }
    }
    this.scheduleRemoval(20);
    return true;
  }

  dragleave(event: DragEvent) {
    const relatedTarget = event.relatedTarget as Node | null;
    if (relatedTarget && !this.editorView.dom.contains(relatedTarget)) {
      this.setCursor(null);
    }
  }
}

export const DropCursorExtension = Extension.create({
  name: "dropCursor",
  addProseMirrorPlugins(this) {
    return [
      dropCursor(
        {
          width: 2,
          class: "transition-all duration-200 ease-[cubic-bezier(0.165, 0.84, 0.44, 1)] text-custom-text-300",
        },
        this
      ),
    ];
  },
});
