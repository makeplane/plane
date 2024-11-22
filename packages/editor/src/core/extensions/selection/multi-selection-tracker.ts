import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, NodeSelection } from "@tiptap/pm/state";
import { EditorView, Decoration, DecorationSet } from "@tiptap/pm/view";

const MultipleSelectionPluginKey = new PluginKey("multipleSelection");

interface BlockSelectionState {
  ranges: Array<[number, number]> | null;
  lastSelectedRange?: { from: number; to: number };
}

let activeCursor: HTMLElement | null = null;
const lastActiveSelection = {
  top: 0,
  left: 0,
};

const updateCursorPosition = (event: MouseEvent, view: EditorView) => {
  if (!activeCursor) return;

  const x = event.pageX;
  const y = event.pageY;

  let newHeight = y - lastActiveSelection.top;
  let newWidth = x - lastActiveSelection.left;

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

  // Get the editor's container
  const editorContainer = view.dom.parentElement;
  if (editorContainer) {
    const containerRect = editorContainer.getBoundingClientRect();
    const mouseY = event.clientY;

    // Check if mouse is near the bottom of the visible area
    if (mouseY > containerRect.bottom - 50) {
      editorContainer.scrollBy(0, 10); // Scroll down
    }
    // Check if mouse is near the top of the visible area
    else if (mouseY < containerRect.top + 50) {
      editorContainer.scrollBy(0, -10); // Scroll up
    }
  }
}; //   if (!activeCursor) return;
//
//   let newHeight = event.y - lastActiveSelection.top;
//   let newWidth = event.x - lastActiveSelection.left;
//
//   if (newHeight < 0) {
//     activeCursor.style.marginTop = `${newHeight}px`;
//     newHeight *= -1;
//   } else {
//     activeCursor.style.marginTop = "0px";
//   }
//
//   if (newWidth < 0) {
//     activeCursor.style.marginLeft = `${newWidth}px`;
//     newWidth *= -1;
//   } else {
//     activeCursor.style.marginLeft = "0px";
//   }
//
//   activeCursor.style.height = `${newHeight}px`;
//   activeCursor.style.width = `${newWidth}px`;
// };

const getNodesInRect = (view: EditorView, rect: DOMRect) => {
  const ranges: Array<[number, number]> = [];
  const { doc } = view.state;

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

  doc.nodesBetween(0, doc.content.size, (node, pos) => {
    const resolvedPos = view.state.doc.resolve(pos);

    // Only process nodes at depth 1 (direct children of the document)
    if (resolvedPos.depth === 1) {
      const start = resolvedPos.before(1);
      const end = resolvedPos.after(1);

      if (isInRect(start) || isInRect(end)) {
        ranges.push([start, end]);
      }

      // Don't descend into this node's children
      return false;
    }
    return true;
  });

  return ranges;
};

// ... previous code remains the same ...

const removeActiveUser = () => {
  if (!activeCursor) return;

  activeCursor.remove();
  activeCursor = null;
  document.removeEventListener("mousemove", selectNodesHandler);
  document.removeEventListener("mouseup", removeActiveUser);

  // Get the current plugin state before clearing
  if (lastView) {
    const pluginState = MultipleSelectionPluginKey.getState(lastView.state);
    const ranges = pluginState?.ranges;

    if (ranges && ranges.length > 0) {
      // Sort ranges by position to ensure we get the correct span
      const sortedRanges = [...ranges].sort(([a], [b]) => a - b);
      const from = sortedRanges[0][0]; // First position of first range
      const to = sortedRanges[sortedRanges.length - 1][1]; // Last position of last range

      const tr = lastView.state.tr;

      // First set the plugin state
      tr.setMeta(MultipleSelectionPluginKey, {
        ranges: null,
        lastSelectedRange: { from, to },
      });

      // Then create a selection that spans all selected nodes
      const $from = lastView.state.doc.resolve(from);
      const $to = lastView.state.doc.resolve(to);

      // Create a node selection that spans the entire range
      const selection = NodeSelection.create(lastView.state.doc, $from.pos);
      tr.setSelection(selection);

      lastView.dispatch(tr);
    } else {
      // Clear the selection if no ranges
      lastView.dispatch(
        lastView.state.tr.setMeta(MultipleSelectionPluginKey, {
          ranges: null,
          lastSelectedRange: undefined,
        })
      );
    }
  }
};

// ... rest of the code remains the same ...
let selectNodesHandler: (event: MouseEvent) => void;
let lastView: EditorView | null = null;

const createMultipleSelectionPlugin = () =>
  new Plugin<BlockSelectionState>({
    key: MultipleSelectionPluginKey,
    state: {
      init() {
        return { ranges: null };
      },
      apply(tr, state) {
        const action = tr.getMeta(MultipleSelectionPluginKey);
        if (action) {
          return action;
        }
        return state;
      },
    },
    props: {
      handleDOMEvents: {
        mousedown(view: EditorView, event: MouseEvent) {
          if (event.target !== view.dom) {
            return false;
          }

          lastView = view;
          removeActiveUser();

          activeCursor = document.createElement("div");
          activeCursor.className = "multipleSelectionCursor";
          activeCursor.style.width = "0px";
          activeCursor.style.height = "0px";
          activeCursor.style.borderRadius = "2px";
          activeCursor.style.border = "1px solid rgba(var(--color-primary-100), 0.2)";
          activeCursor.style.background = "rgba(var(--color-primary-100), 0.2)";
          activeCursor.style.opacity = "0.5";
          activeCursor.style.position = "fixed"; // Change to fixed positioning
          activeCursor.style.top = `${event.pageY}px`; // Use pageY
          activeCursor.style.left = `${event.pageX}px`; // Use pageX
          activeCursor.style.pointerEvents = "none";
          activeCursor.style.zIndex = "1000";

          lastActiveSelection.top = event.pageY; // Use pageY
          lastActiveSelection.left = event.pageX; // Use pageX

          document.body.appendChild(activeCursor);

          selectNodesHandler = (e: MouseEvent) => {
            updateCursorPosition(e);
            if (activeCursor) {
              const rect = activeCursor.getBoundingClientRect();
              const ranges = getNodesInRect(view, rect);

              view.dispatch(
                view.state.tr.setMeta(MultipleSelectionPluginKey, {
                  ranges,
                  lastSelectedRange: undefined,
                })
              );
            }
          };

          document.addEventListener("mousemove", selectNodesHandler);
          document.addEventListener("mouseup", removeActiveUser);

          event.preventDefault();
          return true;
        },
      },
      decorations(state) {
        const pluginState = this.getState(state);

        // If we have active ranges, show those
        if (pluginState?.ranges?.length) {
          return DecorationSet.create(
            state.doc,
            pluginState.ranges.map(([from, to]) =>
              Decoration.node(from, to, {
                class: "custom-selection",
              })
            )
          );
        }

        // If we have a last selected range, show that
        if (pluginState?.lastSelectedRange) {
          const { from, to } = pluginState.lastSelectedRange;
          return DecorationSet.create(state.doc, [
            Decoration.node(from, to, {
              class: "custom-selection final",
            }),
          ]);
        }

        return null;
      },
    },
    view() {
      return {
        destroy() {
          removeActiveUser();
          lastView = null;
        },
      };
    },
  });

export const multipleSelectionExtension = Extension.create({
  name: "multipleSelection",

  addProseMirrorPlugins() {
    return [createMultipleSelectionPlugin()];
  },
});

// ... keep all the imports and MultipleNodeSelection class ...

// ... in the mousedown handler ...
