import { type Selection, Plugin, PluginKey, TextSelection, Transaction } from "@tiptap/pm/state";
import { type EditorView, Decoration, DecorationSet } from "@tiptap/pm/view";
import { codeMarkPluginKey } from "@/extensions/code-mark/utils";

export const PROSEMIRROR_SMOOTH_CURSOR_CLASS = "prosemirror-smooth-cursor";
const BLINK_DELAY = 750;
const FAST_TYPING_THRESHOLD = 70;

export function smoothCursorPlugin({ isEditable = true } = {}): Plugin {
  // Create cursor element only once
  const smoothCursor: HTMLElement | null = typeof document === "undefined" ? null : document.createElement("div");
  let blinkTimeoutId: number | undefined;
  let rafId: number | undefined;
  let isEditorFocused = false;
  let lastCursorPosition = { x: 0, y: 0 };
  let lastDocContentSize = 0;
  let lastFewTypingSpeeds: number[] = [];
  let lastTypeTime = 0;


  // Initialize cursor
  if (smoothCursor) {
    smoothCursor.className = PROSEMIRROR_SMOOTH_CURSOR_CLASS;
    smoothCursor.style.display = "none";
  }

  // Detect if the transaction involves content changes (typing)
  function isTypingContentChange(tr: Transaction | null | undefined): boolean {
    if (!tr) return false;
    return tr.docChanged;
  }

  // Track typing speed for animation control
  function trackTypingSpeed(): boolean {
    const now = performance.now();
    const timeSinceLastType = now - lastTypeTime;

    if (lastTypeTime > 0 && timeSinceLastType < 1000) {
      // Keep a rolling window of the last few typing speeds
      lastFewTypingSpeeds.push(timeSinceLastType);
      if (lastFewTypingSpeeds.length > 5) {
        lastFewTypingSpeeds.shift();
      }
    }

    lastTypeTime = now;

    // Get average of recent typing speeds
    const avgTypingSpeed =
      lastFewTypingSpeeds.length > 0
        ? lastFewTypingSpeeds.reduce((sum, speed) => sum + speed, 0) / lastFewTypingSpeeds.length
        : 1000;

    return avgTypingSpeed < FAST_TYPING_THRESHOLD;
  }

  function updateCursor(view?: EditorView, cursor?: HTMLElement, tr?: Transaction | null) {
    if (!view || !view.dom || view.isDestroyed || !cursor) return;

    // Clear any pending animation frames
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
    }

    // Hide cursor if editor is not focused
    if (!isEditorFocused) {
      cursor.style.display = "none";
      return;
    }

    const { state } = view;
    const { selection } = state;
    const currentDocSize = state.doc.content.size;
    const isTyping = isTypingContentChange(tr) || currentDocSize !== lastDocContentSize;
    const isCodeActive = codeMarkPluginKey.getState(state)?.active === true;

    // Update content size tracker
    lastDocContentSize = currentDocSize;

    // Track typing speed when content changes
    const isTypingFast = isTyping ? trackTypingSpeed() : false;

    // Clear typing speed history after a pause in typing
    if (!isTyping && lastFewTypingSpeeds.length > 0 && performance.now() - lastTypeTime > 500) {
      lastFewTypingSpeeds = [];
    }

    // Hide cursor in certain conditions
    if (!isTextSelection(selection) || !selection.empty || isCodeActive) {
      cursor.style.display = "none";
      return;
    }

    const cursorRect = getCursorRect(view, selection.$head === selection.$from);
    if (!cursorRect) {
      cursor.style.display = "none";
      return;
    }

    const editorRect = view.dom.getBoundingClientRect();

    // Calculate the exact position
    const x = cursorRect.left - editorRect.left;
    const y = cursorRect.top - editorRect.top;

    // Check if cursor position has changed
    if (x !== lastCursorPosition.x || y !== lastCursorPosition.y) {
      lastCursorPosition = { x, y };
      cursor.classList.remove(`${PROSEMIRROR_SMOOTH_CURSOR_CLASS}--blinking`);

      // Clear existing timeout
      if (blinkTimeoutId) {
        window.clearTimeout(blinkTimeoutId);
      }

      // Set new timeout for blinking
      blinkTimeoutId = window.setTimeout(() => {
        if (cursor && isEditorFocused) {
          cursor.classList.add(`${PROSEMIRROR_SMOOTH_CURSOR_CLASS}--blinking`);
        }
      }, BLINK_DELAY);
    }

    // Make cursor visible
    cursor.style.display = "block";
    cursor.style.height = `${cursorRect.bottom - cursorRect.top}px`;

    // Control animation based on typing speed
    if (isTypingFast) {
      cursor.classList.add(`${PROSEMIRROR_SMOOTH_CURSOR_CLASS}--no-transition`);
    } else {
      cursor.classList.remove(`${PROSEMIRROR_SMOOTH_CURSOR_CLASS}--no-transition`);
    }

    // Use requestAnimationFrame for smoother performance
    rafId = requestAnimationFrame(() => {
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }

  return new Plugin({
    key,
    view: (view) => {
      const doc = view.dom.ownerDocument;
      if (!smoothCursor) return { update: () => {}, destroy: () => {} };

      const cursor = smoothCursor;
      lastDocContentSize = view.state.doc.content.size;

      // Define update handler
      const update = () => {
        updateCursor(view, cursor);
      };

      const handleFocus = () => {
        isEditorFocused = true;
        update();
      };

      const handleBlur = () => {
        isEditorFocused = false;
        cursor.style.display = "none";
        cursor.classList.remove(`${PROSEMIRROR_SMOOTH_CURSOR_CLASS}--blinking`);

        if (blinkTimeoutId) {
          window.clearTimeout(blinkTimeoutId);
        }
      };

      // Set up resize observer
      let observer: ResizeObserver | undefined;
      if (window.ResizeObserver) {
        observer = new window.ResizeObserver(update);
        observer?.observe(view.dom);
      }

      // Add document click handler to ensure cursor is hidden when clicking outside
      const handleDocumentClick = (e: MouseEvent) => {
        if (!view.dom.contains(e.target as Node)) {
          cursor.style.display = "none";
        }
      };

      // Set up event listeners
      doc.addEventListener("selectionchange", update);
      view.dom.addEventListener("focus", handleFocus);
      view.dom.addEventListener("blur", handleBlur);
      doc.addEventListener("mousedown", handleDocumentClick);

      return {
        update: (updatedView, prevState) => {
          const tr = updatedView.state.tr.scrollIntoView();
          const hasDocChanged = prevState && updatedView.state.doc !== prevState.doc;
          updateCursor(updatedView, cursor, hasDocChanged ? tr : null);
        },
        destroy: () => {
          doc.removeEventListener("selectionchange", update);
          view.dom.removeEventListener("focus", handleFocus);
          view.dom.removeEventListener("blur", handleBlur);
          doc.removeEventListener("mousedown", handleDocumentClick);

          observer?.unobserve(view.dom);

          if (rafId !== undefined) {
            cancelAnimationFrame(rafId);
          }

          if (blinkTimeoutId) {
            window.clearTimeout(blinkTimeoutId);
          }

          // Hide cursor
          if (cursor) {
            cursor.style.display = "none";
          }
        },
      };
    },
    props: {
      decorations: (state) => {
        if (!smoothCursor || !isEditable) return;
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
  const { state } = view;
  const { selection } = state;

  // Check if the selection is within a codeBlock
  // Use $anchor for simplicity, head should be in the same block for text selections
  const isInsideCodeBlock = selection.$anchor.parent.type.name === "codeBlock";

  // If inside a code block, prefer ProseMirror's coordsAtPos directly
  if (isInsideCodeBlock) {
    return view.coordsAtPos(selection.head);
  }

  // Original logic for non-code-block selections
  const nativeSelection = window.getSelection();
  if (!nativeSelection || !nativeSelection.rangeCount) return null;

  const range = nativeSelection?.getRangeAt(0)?.cloneRange();
  if (!range) return null;

  range.collapse(toStart);
  const rects = range.getClientRects();
  const rect = rects?.length ? rects[0] : null; // using first rect for better performance
  if (rect?.height) return rect;

  // Fallback remains the same
  return view.coordsAtPos(selection.head);
}

function isTextSelection(selection: Selection): selection is TextSelection {
  return selection && typeof selection === "object" && "$cursor" in selection;
}
