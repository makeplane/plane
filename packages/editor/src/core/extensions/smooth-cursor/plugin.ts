import { type Selection, Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { type EditorView, Decoration, DecorationSet } from "@tiptap/pm/view";

export const PROSEMIRROR_SMOOTH_CURSOR_CLASS = "prosemirror-smooth-cursor";

export function smoothCursorPlugin(): Plugin {
  let smoothCursor: HTMLElement | null = typeof document === "undefined" ? null : document.createElement("div");
  let rafId: number | undefined;
  let isEditorFocused = false;

  function updateCursor(view?: EditorView, cursor?: HTMLElement) {
    if (!view || !view.dom || view.isDestroyed || !cursor) return;

    // Hide cursor if editor is not focused
    if (!isEditorFocused) {
      cursor.style.display = "none";
      return;
    }
    cursor.style.display = "block";

    const { state, dom } = view;
    const { selection } = state;
    if (!isTextSelection(selection)) return;

    const cursorRect = getCursorRect(view, selection.$head === selection.$from);

    if (!cursorRect) return cursor;

    const editorRect = dom.getBoundingClientRect();

    const className = PROSEMIRROR_SMOOTH_CURSOR_CLASS;

    cursor.className = className;
    cursor.style.height = `${cursorRect.bottom - cursorRect.top}px`;

    // Calculate the exact position
    const x = cursorRect.left - editorRect.left;
    const y = cursorRect.top - editorRect.top;

    rafId = requestAnimationFrame(() => {
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }

  return new Plugin({
    key,
    view: (view) => {
      const doc = view.dom.ownerDocument;
      smoothCursor = smoothCursor || document.createElement("div");
      const cursor = smoothCursor;

      const update = () => {
        if (rafId !== undefined) {
          cancelAnimationFrame(rafId);
        }
        updateCursor(view, cursor);
      };

      const handleFocus = () => {
        isEditorFocused = true;
        update();
      };

      const handleBlur = () => {
        isEditorFocused = false;
        update();
      };

      let observer: ResizeObserver | undefined;
      if (window.ResizeObserver) {
        observer = new window.ResizeObserver(update);
        observer?.observe(view.dom);
      }

      doc.addEventListener("selectionchange", update);
      view.dom.addEventListener("focus", handleFocus);
      view.dom.addEventListener("blur", handleBlur);

      return {
        update,
        destroy: () => {
          doc.removeEventListener("selectionchange", update);
          view.dom.removeEventListener("focus", handleFocus);
          view.dom.removeEventListener("blur", handleBlur);
          observer?.unobserve(view.dom);
          // Clean up any pending animation frame
          if (rafId !== undefined) {
            cancelAnimationFrame(rafId);
          }
        },
      };
    },
    props: {
      decorations: (state) => {
        if (!smoothCursor || !isTextSelection(state.selection) || !state.selection.empty) return;

        return DecorationSet.create(state.doc, [
          Decoration.widget(0, smoothCursor, {
            key: PROSEMIRROR_SMOOTH_CURSOR_CLASS,
          }),
        ]);
      },

      attributes: () => ({
        class: isEditorFocused ? "smooth-cursor-enabled" : "",
      }),
    },
  });
}

const key = new PluginKey(PROSEMIRROR_SMOOTH_CURSOR_CLASS);

function getCursorRect(
  view: EditorView,
  toStart: boolean
): { left: number; right: number; top: number; bottom: number } | null {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return null;

  const range = selection?.getRangeAt(0)?.cloneRange();
  if (!range) return null;

  range.collapse(toStart);
  const rects = range.getClientRects();
  const rect = rects?.length ? rects[rects.length - 1] : null;
  if (rect?.height) return rect;

  return view.coordsAtPos(view.state.selection.head);
}

function isTextSelection(selection: Selection): selection is TextSelection {
  return selection && typeof selection === "object" && "$cursor" in selection;
}
