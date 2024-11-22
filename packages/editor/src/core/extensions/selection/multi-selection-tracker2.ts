import { Editor, Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

const MultipleSelectionPluginKey = new PluginKey("multipleSelection");

let activeCursor: HTMLElement | null = null;
const lastActiveSelection = {
  top: 0,
  left: 0,
};

const getNodesInRect = (view: EditorView, rect: DOMRect) => {
  const nodes: number[] = [];
  const { doc } = view.state;

  // Helper to check if a position is inside the selection rectangle
  const isInRect = (pos: number) => {
    const coords = view.coordsAtPos(pos);
    return (
      coords &&
      coords.top < rect.bottom &&
      coords.bottom > rect.top &&
      coords.left < rect.right &&
      coords.right > rect.left
    );
  };

  // Iterate through the document to find nodes at depth 1
  doc.nodesBetween(0, doc.content.size, (node, pos) => {
    const resolvedPos = view.state.doc.resolve(pos);

    // Only process nodes at depth 1 (direct children of the document)
    if (resolvedPos.depth === 1) {
      // Check both start and end of the node to ensure proper selection
      const start = resolvedPos.before(1);
      const end = resolvedPos.after(1);

      // If either the start or end of the node is in the selection rectangle
      if (isInRect(start) || isInRect(end)) {
        nodes.push(start);
      }

      // Don't descend into this node's children
      return false;
    }
    return true;
  });
  return nodes;
};

const updateCursorPosition = (view: EditorView, editor: Editor) => (event: MouseEvent) => {
  if (!activeCursor) return;

  let newHeight = event.y - lastActiveSelection.top;
  let newWidth = event.x - lastActiveSelection.left;

  // Update cursor dimensions and position
  if (newHeight < 0) {
    activeCursor.style.marginTop = `${newHeight}px`;
    newHeight *= -1;
  } else {
    activeCursor.style.marginTop = "0px";
  }

  if (newWidth < 0) {
    activeCursor.style.marginLeft = `${newWidth}px`;
    newWidth *= -1;
  } else {
    activeCursor.style.marginLeft = "0px";
  }

  activeCursor.style.height = `${newHeight}px`;
  activeCursor.style.width = `${newWidth}px`;

  // Get selection rectangle
  const selectionRect = activeCursor.getBoundingClientRect();

  // Find nodes within rectangle
  const nodesToSelect = getNodesInRect(view, selectionRect);
  // __AUTO_GENERATED_PRINT_VAR_START__
  console.log("updateCursorPosition#(anon) nodesToSelect: ", nodesToSelect); // __AUTO_GENERATED_PRINT_VAR_END__

  // Create node selections using Tiptap commands
  if (nodesToSelect.length > 0) {
    // Select each node in sequence
    nodesToSelect.forEach((pos) => {
      editor.commands.setNodeSelection(pos);
    });
  }
};
const removeActiveUser = () => {
  if (!activeCursor) return;

  activeCursor.remove();
  activeCursor = null;
  document.removeEventListener("mouseup", removeActiveUser);
};

const createMultipleSelectionPlugin = (editor: Editor) =>
  new Plugin({
    key: MultipleSelectionPluginKey,
    props: {
      handleDOMEvents: {
        mousedown(view: EditorView, event: MouseEvent) {
          if (event.target !== view.dom) return false;

          removeActiveUser();

          activeCursor = document.createElement("div");
          activeCursor.className = "multipleSelectionCursor";
          activeCursor.style.width = "0px";
          activeCursor.style.height = "0px";
          activeCursor.style.borderRadius = "2px";
          activeCursor.style.border = "1px solid rgba(var(--color-primary-100), 0.2)";
          activeCursor.style.background = "rgba(var(--color-primary-100), 0.2)";
          activeCursor.style.opacity = "0.5";
          activeCursor.style.position = "absolute";
          activeCursor.style.top = `${event.y}px`;
          activeCursor.style.left = `${event.x}px`;
          activeCursor.style.pointerEvents = "none";

          lastActiveSelection.top = event.y;
          lastActiveSelection.left = event.x;

          document.body.appendChild(activeCursor);

          // Pass view to updateCursorPosition
          document.addEventListener("mousemove", updateCursorPosition(view, editor));
          document.addEventListener("mouseup", removeActiveUser);

          return false;
        },
      },
    },
    destroy() {
      removeActiveUser();
    },
  });

export const multipleSelectionExtension = Extension.create({
  name: "multipleSelection",
  addProseMirrorPlugins(this) {
    return [createMultipleSelectionPlugin(this.editor)];
  },
});
