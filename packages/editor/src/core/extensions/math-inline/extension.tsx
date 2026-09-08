/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { InputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
// plane utils
import { isValidInlineMathContent, MATH_INLINE_INPUT_REGEX } from "@plane/utils";
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

  addNodeView() {
    return ReactNodeViewRenderer(MathInlineNodeView, { as: "span" });
  },
});
