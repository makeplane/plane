import { Editor, Extension } from "@tiptap/core";
import { Plugin, PluginKey, Selection, TextSelection } from "prosemirror-state";
import { EditorView, Decoration, DecorationSet } from "prosemirror-view";
import { ResolvedPos } from "prosemirror-model";

const MultipleSelectionPluginKey = new PluginKey("multipleSelection");

// Custom Selection Class
class MultipleNodeSelection extends Selection {
  constructor($from: ResolvedPos, $to: ResolvedPos) {
    super($from, $to);
  }

  map(doc: any, mapping: any) {
    const $from = doc.resolve(mapping.map(this.$from.pos));
    const $to = doc.resolve(mapping.map(this.$to.pos));
    return new MultipleNodeSelection($from, $to);
  }

  content() {
    return this.$from.node(0).slice(this.$from.pos, this.$to.pos, true);
  }

  eq(other: Selection): boolean {
    return (
      other instanceof MultipleNodeSelection && other.$from.pos === this.$from.pos && other.$to.pos === this.$to.pos
    );
  }

  static create(doc: any, from: number, to: number) {
    const $from = doc.resolve(from);
    const $to = doc.resolve(to);
    return new MultipleNodeSelection($from, $to);
  }

  replaceWith(tr: any, node: any) {
    super.replaceWith(tr, node);
  }
}

interface BlockSelectionState {
  ranges: Array<[number, number]> | null;
  lastSelectedRange?: { from: number; to: number };
}

let activeCursor: HTMLElement | null = null;
const lastActiveSelection = {
  top: 0,
  left: 0,
};

const updateCursorPosition = (event: MouseEvent) => {
  if (!activeCursor) return;

  let newHeight = event.y - lastActiveSelection.top;
  let newWidth = event.x - lastActiveSelection.left;

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

  if (lastView) {
    const pluginState = MultipleSelectionPluginKey.getState(lastView.state);
    const ranges = pluginState?.ranges;

    if (ranges && ranges.length > 0) {
      // Sort ranges by position
      const sortedRanges = [...ranges].sort(([a], [b]) => a - b);
      const from = sortedRanges[0][0];
      const to = sortedRanges[sortedRanges.length - 1][1];

      const tr = lastView.state.tr;

      // Create our custom selection
      const selection = MultipleNodeSelection.create(lastView.state.doc, from, to);

      tr.setSelection(selection).setMeta(MultipleSelectionPluginKey, {
        ranges: sortedRanges,
        lastSelectedRange: { from, to },
      });

      lastView.dispatch(tr);
    }
  }
};

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
          activeCursor.style.position = "absolute";
          activeCursor.style.top = `${event.y}px`;
          activeCursor.style.left = `${event.x}px`;
          activeCursor.style.pointerEvents = "none";
          activeCursor.style.zIndex = "1000";

          lastActiveSelection.top = event.y;
          lastActiveSelection.left = event.x;

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

// Register our custom selection with ProseMirror
Selection.jsonID("multipleNode", MultipleNodeSelection);

export const multipleSelectionExtension = Extension.create({
  name: "multipleSelection",

  addProseMirrorPlugins() {
    return [createMultipleSelectionPlugin()];
  },
});
