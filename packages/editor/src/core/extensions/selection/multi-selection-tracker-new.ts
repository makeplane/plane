import { Dispatch, Extension } from "@tiptap/core";
import { Node, ResolvedPos, Slice, Fragment } from "@tiptap/pm/model";
import { EditorState, Plugin, PluginKey, Selection, TextSelection, Transaction } from "@tiptap/pm/state";
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
let scrollAnimationFrame: number | null = null;
let lastClientY = 0;
let currentScrollSpeed = 0;
const maxScrollSpeed = 20;
const acceleration = 0.5;
let cachedScrollParent = null;

function easeOutQuadAnimation(t: number) {
  return t * (2 - t);
}

const scrollParentCache = new WeakMap();

const getScrollParent = (element) => {
  if (cachedScrollParent) {
    return cachedScrollParent;
  }

  if (!element) return null;

  let currentParent = element.parentElement;

  while (currentParent) {
    if (isScrollable(currentParent)) {
      cachedScrollParent = currentParent;
      return cachedScrollParent;
    }
    currentParent = currentParent.parentElement;
  }

  cachedScrollParent = document.scrollingElement || document.documentElement;
  return cachedScrollParent;
};

const isScrollable = (node) => {
  if (!(node instanceof HTMLElement || node instanceof SVGElement)) {
    return false;
  }
  const style = getComputedStyle(node);
  return ["overflow", "overflow-y"].some((propertyName) => {
    const value = style.getPropertyValue(propertyName);
    return value === "auto" || value === "scroll";
  });
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

  lastClientY = event.clientY;

  if (!scrollAnimationFrame) {
    scrollAnimationFrame = requestAnimationFrame(scroll);
  }
};

function scroll() {
  if (!isDragging) {
    currentScrollSpeed = 0;
    scrollAnimationFrame = null;
    return;
  }

  const editorContainer = document.querySelector(".editor-container");
  const scrollableParent = getScrollParent(editorContainer);

  if (!scrollableParent) {
    scrollAnimationFrame = requestAnimationFrame(scroll);
    return;
  }

  const scrollRegionUp = 150;
  const scrollRegionDown = scrollableParent.clientHeight - 100;

  let targetScrollAmount = 0;

  if (lastClientY < scrollRegionUp) {
    const ratio = easeOutQuadAnimation((scrollRegionUp - lastClientY) / scrollRegionUp);
    targetScrollAmount = -maxScrollSpeed * ratio;
  } else if (lastClientY > scrollRegionDown) {
    const ratio = easeOutQuadAnimation(
      (lastClientY - scrollRegionDown) / (scrollableParent.clientHeight - scrollRegionDown)
    );
    targetScrollAmount = maxScrollSpeed * ratio;
  }

  currentScrollSpeed += (targetScrollAmount - currentScrollSpeed) * acceleration;

  if (Math.abs(currentScrollSpeed) > 0.1) {
    scrollableParent.scrollBy(0, currentScrollSpeed);
  }

  scrollAnimationFrame = requestAnimationFrame(scroll);
}

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

const removeActiveUser = (view?: EditorView) => {
  if (!activeCursor) return;

  activeCursor.remove();
  activeCursor = null;
  document.removeEventListener("mousemove", selectNodesHandler);
  document.removeEventListener("mouseup", () => removeActiveUser(view));

  if (scrollAnimationFrame) {
    cancelAnimationFrame(scrollAnimationFrame);
    scrollAnimationFrame = null;
  }

  isDragging = false;
};

export class MultipleSelection extends Selection {
  ranges: Array<{ $from: ResolvedPos; $to: ResolvedPos }>;

  constructor(ranges: Array<{ $from: ResolvedPos; $to: ResolvedPos }>) {
    const $anchor = ranges[0].$from;
    const $head = ranges[ranges.length - 1].$to;
    super($anchor, $head);
    this.ranges = ranges;
  }

  map(doc: Node, mapping: any) {
    const newRanges = this.ranges.map(({ $from, $to }) => ({
      $from: doc.resolve(mapping.map($from.pos)),
      $to: doc.resolve(mapping.map($to.pos)),
    }));
    return new MultipleSelection(newRanges);
  }

  eq(other: Selection): boolean {
    if (!(other instanceof MultipleSelection) || other.ranges.length !== this.ranges.length) {
      return false;
    }
    return this.ranges.every(
      (range, i) => range.$from.pos === other.ranges[i].$from.pos && range.$to.pos === other.ranges[i].$to.pos
    );
  }

  content() {
    const nodes: Node[] = [];
    this.ranges.forEach(({ $from, $to }) => {
      const slice = $from.doc.slice($from.pos, $to.pos);
      nodes.push(...slice.content.content);
    });
    return new Slice(Fragment.from(nodes), 0, 0);
  }

  replace(tr: any, content: Slice = Slice.empty) {
    const ranges = this.ranges;
    for (let i = 0; i < ranges.length; i++) {
      const { $from, $to } = ranges[i];
      const mappedFrom = tr.mapping.map($from.pos);
      const mappedTo = tr.mapping.map($to.pos);
      tr.replace(mappedFrom, mappedTo, i ? Slice.empty : content);
    }
    const lastFrom = tr.mapping.map(ranges[ranges.length - 1].$from.pos);
    tr.setSelection(TextSelection.create(tr.doc, lastFrom));
  }

  toJSON() {
    return {
      type: "multiple",
      ranges: this.ranges.map(({ $from, $to }) => ({ from: $from.pos, to: $to.pos })),
    };
  }

  static fromJSON(doc: Node, json: any) {
    if (json.type !== "multiple") throw new Error("Invalid input for MultipleSelection.fromJSON");
    const ranges = json.ranges.map(({ from, to }) => ({
      $from: doc.resolve(from),
      $to: doc.resolve(to),
    }));
    return new MultipleSelection(ranges);
  }

  static create(doc: Node, ranges: Array<[number, number]>) {
    return new MultipleSelection(
      ranges.map(([from, to]) => ({
        $from: doc.resolve(from),
        $to: doc.resolve(to),
      }))
    );
  }
}

// Register the new selection type
Selection.jsonID("multiple", MultipleSelection);

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
            const pluginState = MultipleSelectionPluginKey.getState(view.state);
            if (pluginState?.ranges?.length || pluginState?.lastSelectedRange) {
              view.dispatch(
                view.state.tr.setMeta(MultipleSelectionPluginKey, {
                  ranges: null,
                  lastSelectedRange: undefined,
                })
              );
              console.log("view.state.selection instanceof MultipleSelection", view.state.selection);
              // if (view.state.selection instanceof MultipleSelection) {
              //   let tr: Transaction;
              //   view.state.selection.ranges.forEach(({ $from, $to }) => {
              //     console.log("from", $from.pos, "to", $to.pos);
              //     // Example: Delete content in each range
              //     // tr = view.state.tr.delete($from.pos, $to.pos);
              //   });
              //   view.dispatch(tr);
              // }
              return false;
            }
          }

          if (event.target !== view.dom) {
            return false;
          }
          removeActiveUser(view);

          activeCursor = document.createElement("div");
          activeCursor.className = "multipleSelectionCursor";
          activeCursor.style.width = "0px";
          activeCursor.style.height = "0px";
          activeCursor.style.borderRadius = "2px";
          activeCursor.style.border = "1px solid rgba(var(--color-primary-100), 0.2)";
          activeCursor.style.background = "rgba(var(--color-primary-100), 0.2)";
          activeCursor.style.opacity = "0.5";
          activeCursor.style.position = "absolute";
          activeCursor.style.top = `${event.pageY}px`;
          activeCursor.style.left = `${event.pageX}px`;
          activeCursor.style.pointerEvents = "none";
          activeCursor.style.zIndex = "1000";

          lastActiveSelection.top = event.pageY;
          lastActiveSelection.left = event.pageX;

          document.body.appendChild(activeCursor);

          isDragging = true;
          lastClientY = event.clientY;

          selectNodesHandler = (e: MouseEvent) => {
            updateCursorPosition(e, view);
            if (activeCursor) {
              const rect = activeCursor.getBoundingClientRect();
              const ranges = getNodesInRect(view, rect);

              view.dispatch(
                view.state.tr
                  .setMeta(MultipleSelectionPluginKey, { ranges })
                  .setSelection(MultipleSelection.create(view.state.doc, ranges))
              );
            }
          };

          document.addEventListener("mousemove", selectNodesHandler);
          document.addEventListener("mouseup", () => removeActiveUser(view));

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
                class: "ProseMirror-selectednode",
              })
            )
          );
        }

        return null;
      },
    },
    appendTransaction(transactions, oldState, newState) {
      const oldPluginState = this.getState(oldState);
      const newPluginState = this.getState(newState);

      if (newPluginState?.ranges?.length && !oldPluginState?.ranges?.length) {
        return newState.tr.setSelection(MultipleSelection.create(newState.doc, newPluginState.ranges));
      }

      return null;
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

export const deleteSelectedNodes = (state: EditorState, dispatch: Dispatch) => {
  const { selection } = state;
  if (!(selection instanceof MultipleSelection)) return false;

  if (dispatch) {
    const tr = state.tr;

    // Sort ranges in reverse order (from end to start)
    const sortedRanges = [...selection.ranges].sort((a, b) => b.$from.pos - a.$from.pos);

    // Delete ranges from end to start to avoid position shifts
    sortedRanges.forEach(({ $from, $to }) => {
      tr.delete($from.pos, $to.pos);
    });

    dispatch(tr);
  }
  return true;
};
