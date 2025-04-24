// taken from https://github.com/curvenote/editor/tree/main/packages/prosemirror-codemark
import { type PluginSpec, Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { CodemarkState, CursorMetaTr, Options } from "./types";
import { getMarkType, codeMarkPluginKey, safeResolve } from "./utils";
import { createInputRule } from "./input-rules";
import {
  onArrowLeft,
  onArrowRight,
  onBackspace,
  onBacktick,
  onDelete,
  stepOutside,
  stepOutsideNextTrAndPass,
} from "./actions";

function toDom(): Node {
  const span = document.createElement("span");
  span.classList.add("fake-cursor");
  return span;
}

export function getDecorationPlugin(opts?: Options) {
  const plugin: Plugin<CodemarkState> = new Plugin({
    key: codeMarkPluginKey,
    appendTransaction: (trs, oldState, newState) => {
      const prev = plugin.getState(oldState) as CodemarkState;
      const meta = trs[0]?.getMeta(plugin) as CursorMetaTr | null;
      if (prev?.next || meta?.action === "click") {
        return stepOutside(newState, getMarkType(newState, opts));
      }
      return null;
    },
    state: {
      init: () => null,
      apply(tr, value, oldState, state): CodemarkState | null {
        const meta = tr.getMeta(plugin) as CursorMetaTr | null;
        if (meta?.action === "next") return { next: true };

        const markType = getMarkType(state, opts);
        const nextMark = markType.isInSet(state.storedMarks ?? state.doc.resolve(tr.selection.from).marks());
        const inCode = markType.isInSet(state.doc.resolve(tr.selection.from).marks());
        const nextCode = markType.isInSet(safeResolve(state.doc, tr.selection.from + 1).marks());
        const startOfLine = tr.selection.$from.parentOffset === 0;
        if (!tr.selection.empty) return null;
        if (!nextMark && nextCode && (!inCode || startOfLine)) {
          // |`code`
          return { active: true, side: -1 };
        }
        if (nextMark && (!inCode || startOfLine)) {
          // `|code`
          return { active: true, side: 0 };
        }
        if (!nextMark && inCode && !nextCode) {
          // `code`|
          return { active: true, side: 0 };
        }
        if (nextMark && inCode && !nextCode) {
          // `code|`
          return { active: true, side: -1 };
        }
        return null;
      },
    },
    props: {
      attributes: (state) => {
        const { active = false } = plugin.getState(state) ?? {};
        return {
          ...(active ? { class: "no-cursor" } : {}),
        };
      },
      decorations: (state) => {
        const { active, side } = plugin.getState(state) ?? {};
        if (!active) return DecorationSet.empty;
        const deco = Decoration.widget(state.selection.from, toDom, { side });
        return DecorationSet.create(state.doc, [deco]);
      },
      handleKeyDown(view, event) {
        switch (event.key) {
          case "`":
            return onBacktick(view, plugin, event, getMarkType(view, opts));
          case "ArrowRight":
            return onArrowRight(view, plugin, event, getMarkType(view, opts));
          case "ArrowLeft":
            return onArrowLeft(view, plugin, event, getMarkType(view, opts));
          case "Backspace":
            return onBackspace(view, plugin, event, getMarkType(view, opts));
          case "Delete":
            return onDelete(view, plugin, event, getMarkType(view, opts));
          case "ArrowUp":
          case "ArrowDown":
          case "Home":
          case "End":
            return stepOutsideNextTrAndPass(view, plugin);
          case "e":
          case "a":
            if (!event.ctrlKey) return false;
            return stepOutsideNextTrAndPass(view, plugin);
          default:
            return false;
        }
      },
      handleClick(view) {
        return stepOutsideNextTrAndPass(view, plugin, "click");
      },
    },
  } as PluginSpec<CodemarkState>);
  return plugin;
}

export function codemark(opts?: Options) {
  const cursorPlugin = getDecorationPlugin(opts);
  const inputRule = createInputRule(cursorPlugin, opts);
  const rules: Plugin[] = [cursorPlugin, inputRule];
  return rules;
}
