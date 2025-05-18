import type { MarkType } from "@tiptap/pm/model";
import { type EditorState, type Plugin, type Transaction, TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { CodemarkState, CursorMetaTr } from "./types";
import { MAX_MATCH, safeResolve } from "./utils";

export function stepOutsideNextTrAndPass(view: EditorView, plugin: Plugin, action: "click" | "next" = "next"): boolean {
  const meta: CursorMetaTr = { action };
  view.dispatch(view.state.tr.setMeta(plugin, meta));
  return false;
}

export function onBacktick(view: EditorView, plugin: Plugin, event: KeyboardEvent, markType: MarkType): boolean {
  if (view.state.selection.empty) return false;
  if (event.metaKey || event.shiftKey || event.altKey || event.ctrlKey) return false;
  // Create a code mark!
  const { from, to } = view.state.selection;
  if (to - from >= MAX_MATCH || view.state.doc.rangeHasMark(from, to, markType)) return false;
  const tr = view.state.tr.addMark(from, to, markType.create());
  const selected = tr.setSelection(TextSelection.create(tr.doc, to)).removeStoredMark(markType);
  view.dispatch(selected);
  return true;
}

function onArrowRightInside(view: EditorView, plugin: Plugin, event: KeyboardEvent, markType: MarkType): boolean {
  if (event.metaKey) return stepOutsideNextTrAndPass(view, plugin);
  if (event.shiftKey || event.altKey || event.ctrlKey) return false;
  const { selection, doc } = view.state;
  if (!selection.empty) return false;
  const pluginState = plugin.getState(view.state) as CodemarkState;
  const pos = selection.$from;
  const inCode = !!markType.isInSet(pos.marks());
  const nextCode = !!markType.isInSet(pos.marksAcross(safeResolve(doc, selection.from + 1)) ?? []);

  if (pos.pos === view.state.doc.nodeSize - 3 && pos.parentOffset === pos.parent.nodeSize - 2 && pluginState?.active) {
    // Behaviour stops: `code`| at the end of the document
    view.dispatch(view.state.tr.removeStoredMark(markType));
    return true;
  }
  if (inCode === nextCode && pos.parentOffset !== 0) return false;
  if (inCode && (!pluginState?.active || pluginState.side === -1) && pos.parentOffset !== 0) {
    // `code|` --> `code`|
    view.dispatch(view.state.tr.removeStoredMark(markType));
    return true;
  }
  if (nextCode && pluginState?.side === -1) {
    // |`code` --> `|code`
    view.dispatch(view.state.tr.addStoredMark(markType.create()));
    return true;
  }
  return false;
}

export function onArrowRight(view: EditorView, plugin: Plugin, event: KeyboardEvent, markType: MarkType): boolean {
  const handled = onArrowRightInside(view, plugin, event, markType);
  if (handled) return true;
  const { selection } = view.state;
  const pos = selection.$from;
  if (selection.empty && pos.parentOffset === pos.parent.nodeSize - 2) {
    return stepOutsideNextTrAndPass(view, plugin);
  }
  return false;
}

function onArrowLeftInside(view: EditorView, plugin: Plugin, event: KeyboardEvent, markType: MarkType): boolean {
  if (event.metaKey) return stepOutsideNextTrAndPass(view, plugin);
  if (event.shiftKey || event.altKey || event.ctrlKey) return false;
  const { selection, doc } = view.state;
  const pluginState = plugin.getState(view.state) as CodemarkState;
  const inCode = !!markType.isInSet(selection.$from.marks());
  const nextCode = !!markType.isInSet(
    safeResolve(doc, selection.empty ? selection.from - 1 : selection.from + 1).marks() ?? []
  );
  if (inCode && pluginState?.side === -1 && selection.$from.parentOffset === 0) {
    // New line!
    // ^|`code` --> |^`code`
    return false;
  }
  if (pluginState?.side === 0 && selection.$from.parentOffset === 0) {
    // New line!
    // ^`|code` --> ^|`code`
    view.dispatch(view.state.tr.removeStoredMark(markType));
    return true;
  }
  if (inCode && nextCode && pluginState?.side === 0) {
    // `code`| --> `code|`
    view.dispatch(view.state.tr.addStoredMark(markType.create()));
    return true;
  }
  if (inCode && !nextCode && pluginState?.active && selection.$from.parentOffset === 0) {
    // ^`|code` --> ^|`code`
    view.dispatch(view.state.tr.removeStoredMark(markType));
    return true;
  }
  if (!inCode && pluginState?.active && pluginState?.side === 0) {
    // `|code` --> |`code`
    view.dispatch(view.state.tr.removeStoredMark(markType));
    return true;
  }
  if (inCode === nextCode) return false;
  if (nextCode || (!selection.empty && inCode)) {
    // `code`_|_ --> `code`|   nextCode
    // `code`███ --> `code`|   !selection.empty && inCode
    // `██de`___ --> `|code`   !selection.empty && nextCode
    const from = selection.empty ? selection.from - 1 : selection.from;
    const selected = view.state.tr.setSelection(TextSelection.create(doc, from));
    if (!selection.empty && nextCode) {
      view.dispatch(selected.addStoredMark(markType.create()));
    } else {
      view.dispatch(selected.removeStoredMark(markType));
    }
    return true;
  }
  if ((nextCode || (!selection.empty && inCode)) && !pluginState?.active) {
    // `code`_|_ --> `code`|
    // `code`███ --> `code`|
    const from = selection.empty ? selection.from - 1 : selection.from;
    view.dispatch(view.state.tr.setSelection(TextSelection.create(doc, from)).removeStoredMark(markType));
    return true;
  }
  if (inCode && !pluginState?.active && selection.$from.parentOffset > 0) {
    // `c|ode` --> `|code`
    view.dispatch(
      view.state.tr.setSelection(TextSelection.create(doc, selection.from - 1)).addStoredMark(markType.create())
    );
    return true;
  }
  if (inCode && !nextCode && pluginState?.active && pluginState.side !== -1) {
    // `x`| --> `x|` - Single character
    view.dispatch(view.state.tr.addStoredMark(markType.create()));
    return true;
  }
  if (inCode && !nextCode && pluginState?.active) {
    // `x|` --> `|x` - Single character inside
    const pos = selection.from - 1;
    view.dispatch(view.state.tr.setSelection(TextSelection.create(doc, pos)).addStoredMark(markType.create()));
    return true;
  }
  return false;
}

export function onArrowLeft(view: EditorView, plugin: Plugin, event: KeyboardEvent, markType: MarkType): boolean {
  const handled = onArrowLeftInside(view, plugin, event, markType);
  if (handled) return true;
  const { selection } = view.state;
  const pos = selection.$from;
  const pluginState = plugin.getState(view.state) as CodemarkState;
  if (pos.pos === 1 && pos.parentOffset === 0 && pluginState?.side === -1) {
    return true;
  }
  if (selection.empty && pos.parentOffset === 0) {
    return stepOutsideNextTrAndPass(view, plugin);
  }
  return false;
}

export function onBackspace(view: EditorView, plugin: Plugin, event: KeyboardEvent, markType: MarkType): boolean {
  if (event.metaKey || event.shiftKey || event.altKey || event.ctrlKey) return false;
  const { selection, doc } = view.state;
  const from = safeResolve(doc, selection.from - 1);
  const fromCode = !!markType.isInSet(from.marks());
  const startOfLine = from.parentOffset === 0;
  const toCode = !!markType.isInSet(safeResolve(doc, selection.to + 1).marks());
  if ((!fromCode || startOfLine) && !toCode) {
    // `x|`    → |
    // `|████` → |
    // `|███`█ → |
    return stepOutsideNextTrAndPass(view, plugin);
  }
  // Firefox has difficulty with the decorations on -1.
  const pluginState = plugin.getState(view.state) as CodemarkState;
  if (selection.empty && pluginState?.side === -1) {
    const tr = view.state.tr.delete(selection.from - 1, selection.from);
    view.dispatch(tr);
    return true;
  }
  return false;
}

export function onDelete(view: EditorView, plugin: Plugin, event: KeyboardEvent, markType: MarkType): boolean {
  if (event.metaKey || event.shiftKey || event.altKey || event.ctrlKey) return false;
  const { selection, doc } = view.state;
  const fromCode = !!markType.isInSet(selection.$from.marks());
  const startOfLine = selection.$from.parentOffset === 0;
  const toCode = !!markType.isInSet(safeResolve(doc, selection.to + 2).marks());
  if ((!fromCode || startOfLine) && !toCode) {
    return stepOutsideNextTrAndPass(view, plugin);
  }
  return false;
}

export function stepOutside(state: EditorState, markType: MarkType): Transaction | null {
  if (!state) return null;
  const { selection, doc } = state;
  if (!selection.empty) return null;
  const stored = !!markType.isInSet(state.storedMarks ?? []);
  const inCode = !!markType.isInSet(selection.$from.marks());
  const nextCode = !!markType.isInSet(safeResolve(doc, selection.from + 1).marks() ?? []);
  const startOfLine = selection.$from.parentOffset === 0;
  // `code|` --> `code`|
  // `|code` --> |`code`
  // ^`|code` --> ^|`code`
  if (inCode !== nextCode || (!inCode && stored !== inCode) || (inCode && startOfLine))
    return state.tr.removeStoredMark(markType);
  return null;
}
