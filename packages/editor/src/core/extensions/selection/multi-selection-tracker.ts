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

let isDragging = false;
let selectNodesHandler: (event: MouseEvent) => void;

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

  const editorContainer = view.dom.parentElement;
  if (editorContainer) {
    const containerRect = editorContainer.getBoundingClientRect();
    const mouseY = event.clientY;

    if (mouseY > containerRect.bottom - 50) {
      editorContainer.scrollBy(0, 10);
    } else if (mouseY < containerRect.top + 50) {
      editorContainer.scrollBy(0, -10);
    }
  }
};

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

    if (resolvedPos.depth === 1) {
      const start = resolvedPos.before(1);
      const end = resolvedPos.after(1);

      if (isInRect(start) || isInRect(end)) {
        ranges.push([start, end]);
      }

      return false;
    }
    return true;
  });

  return ranges;
};

const removeActiveUser = () => {
  if (!activeCursor) return;

  activeCursor.remove();
  activeCursor = null;
  document.removeEventListener("mousemove", selectNodesHandler);
  document.removeEventListener("mouseup", removeActiveUser);
};

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
          if (!isDragging) {
            console.log("ran");
            const pluginState = MultipleSelectionPluginKey.getState(view.state);
            if (pluginState?.ranges?.length || pluginState?.lastSelectedRange) {
              view.dispatch(
                view.state.tr.setMeta(MultipleSelectionPluginKey, {
                  ranges: null,
                  lastSelectedRange: undefined,
                })
              );
              return false;
            }
          }

          if (event.target !== view.dom) {
            return false;
          }
          removeActiveUser();

          activeCursor = document.createElement("div");
          activeCursor.className = "multipleSelectionCursor";
          activeCursor.style.width = "0px";
          activeCursor.style.height = "0px";
          activeCursor.style.borderRadius = "2px";
          activeCursor.style.border = "1px solid rgba(var(--color-primary-100), 0.2)";
          activeCursor.style.background = "rgba(var(--color-primary-100), 0.2)";
          activeCursor.style.opacity = "0.5";
          activeCursor.style.position = "fixed";
          activeCursor.style.top = `${event.pageY}px`;
          activeCursor.style.left = `${event.pageX}px`;
          activeCursor.style.pointerEvents = "none";
          activeCursor.style.zIndex = "1000";

          lastActiveSelection.top = event.pageY;
          lastActiveSelection.left = event.pageX;

          document.body.appendChild(activeCursor);

          selectNodesHandler = (e: MouseEvent) => {
            isDragging = true;
            updateCursorPosition(e, view);
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
          document.addEventListener("mouseup", () => {
            removeActiveUser();
            isDragging = false;
          });

          event.preventDefault();
          return true;
        },
      },
      decorations(state) {
        const pluginState = this.getState(state);

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
