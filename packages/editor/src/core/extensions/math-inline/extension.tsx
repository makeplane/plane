/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { InputRule } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorState } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// plane utils
import {
  findInlineMathMatch,
  INLINE_MATH_SCAN_ATOM_PLACEHOLDER,
  isValidInlineMathContent,
  MATH_INLINE_INPUT_REGEX,
} from "@plane/utils";
// types
import { EMathInlineAttributeNames } from "./types";
import { MathInlineExtensionConfig } from "./extension-config";
// components
import { MathInlineNodeView } from "./node-view";

export const MathInlineExtension = MathInlineExtensionConfig.extend({
  addCommands() {
    return {
      insertMathInline:
        (attributes) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              [EMathInlineAttributeNames.LATEX]: "",
              ...attributes,
            },
          }),
    };
  },

  addInputRules() {
    return [
      // typing a closing `$` converts `$...$` to an inline math node.
      // the trailing typed `$` is consumed by the rule, so only the
      // matched range (without the last char) needs replacing.
      new InputRule({
        find: MATH_INLINE_INPUT_REGEX,
        handler: ({ state, range, match }) => {
          const latex = match[1];
          if (!latex || !isValidInlineMathContent(latex)) return;
          // a preceding `$` means this is part of a `$$` block — block math wins
          const charBeforeMatch = state.doc.textBetween(range.from - 1, range.from, "", "￼");
          if (charBeforeMatch === "$") return;
          const node = this.type.create({
            [EMathInlineAttributeNames.LATEX]: latex,
          });
          state.tr.replaceWith(range.from, range.to, node);
        },
      }),
    ];
  },

  addProseMirrorPlugins() {
    const mathInlineType = this.type;
    // convert a `$...$` text span in the edited text block even when the
    // closing `$` was typed before the content (e.g. typing `$$` first and
    // filling the middle afterwards) — the input rule above only fires when
    // the closing `$` is typed last
    const scanTextBlockForInlineMath = (state: EditorState, pos: number) => {
      const $pos = state.doc.resolve(pos);
      if (!$pos.parent.inlineContent || $pos.parent.type.name === CORE_EXTENSIONS.CODE_BLOCK) return null;
      // mask inline atoms (e.g. already-converted math nodes) so their text
      // representation can never match
      const text = $pos.parent.textBetween(0, $pos.parent.content.size, null, INLINE_MATH_SCAN_ATOM_PLACEHOLDER);
      const match = findInlineMathMatch(text);
      if (!match) return null;
      const matchFrom = $pos.start() + match.from;
      const matchTo = $pos.start() + match.to;
      // don't convert while the cursor is inside the span — the user is
      // still typing the content
      const { empty, from, to } = state.selection;
      if (!empty && from < matchTo && to > matchFrom) return null;
      if (from > matchFrom && from < matchTo) return null;
      // never convert text carrying a code mark
      let hasCodeMark = false;
      state.doc.nodesBetween(matchFrom, matchTo, (node) => {
        if (node.marks.some((mark) => mark.type.name === CORE_EXTENSIONS.CODE_INLINE)) hasCodeMark = true;
        return !hasCodeMark;
      });
      if (hasCodeMark) return null;
      const node = mathInlineType.create({
        [EMathInlineAttributeNames.LATEX]: match.latex,
      });
      return state.tr.replaceWith(matchFrom, matchTo, node);
    };
    return [
      new Plugin({
        key: new PluginKey("mathInlineTextConversion"),
        appendTransaction: (transactions, oldState, newState) => {
          try {
            // scan the block around the new selection, plus the block the
            // selection just left (mapped into the new state) so clicking or
            // arrowing out of a `$...$` span converts it
            const mappedOldPos = transactions.reduce((pos, tr) => tr.mapping.map(pos), oldState.selection.from);
            const positions = [newState.selection.from];
            if (mappedOldPos !== newState.selection.from) positions.push(mappedOldPos);
            for (const pos of positions) {
              const tr = scanTextBlockForInlineMath(newState, pos);
              if (tr) return tr;
            }
            return null;
          } catch (error) {
            console.error("Error converting inline math text:", error);
            return null;
          }
        },
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathInlineNodeView, {
      as: "span",
      // ProseMirror turns a click on a selectable node into a node selection,
      // which interferes with click-to-edit; the node view handles its own
      // events, only drag & drop stay with ProseMirror
      stopEvent: ({ event }) => !event.type.startsWith("drag") && event.type !== "drop",
    });
  },
});
