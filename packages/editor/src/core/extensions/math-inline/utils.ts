/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type MarkdownIt from "markdown-it";
// plane utils
import { escapeHtmlAttribute, isValidInlineMathContent } from "@plane/utils";
// local imports
import { renderLatexToHtml } from "../math-block/utils";

export const MATH_INLINE_TAG_NAME = "math-inline";
export const MATH_INLINE_LATEX_ATTRIBUTE = "data-latex";

/**
 * Render LaTeX source to inline KaTeX HTML (see math-block's renderer).
 */
export const renderInlineLatexToHtml = (latex: string): Promise<string> => renderLatexToHtml(latex, false);

/**
 * markdown-it inline rule that parses `$...$` spans and renders them as
 * `<math-inline>` HTML, which the mathInline TipTap node parses via its
 * `parseHTML` rule. Currency-like content (`$100`, `$5.99`) is rejected by
 * requiring the opening `$` to be followed by a non-digit, non-whitespace,
 * non-`$` character; `$$` blocks are left to the math_block block rule.
 */
export const mathInlineMarkdownPlugin = (md: MarkdownIt): void => {
  md.inline.ruler.after(
    "escape",
    "math_inline",
    (state, silent) => {
      const start = state.pos;
      // must start with `$`
      if (state.src.charCodeAt(start) !== 0x24) return false;
      // escaped `\$`
      if (state.src.charCodeAt(start - 1) === 0x5c) return false;

      const max = state.posMax;
      if (start + 1 >= max) return false;

      const firstContentChar = state.src[start + 1];
      // opening `$` must not be followed by `$`, whitespace, or a digit
      if (firstContentChar === "$" || /\s/.test(firstContentChar) || /\d/.test(firstContentChar)) return false;

      // find a closing `$` hugging its content
      let end = -1;
      for (let i = start + 1; i < max; i++) {
        if (state.src.charCodeAt(i) !== 0x24) continue;
        const prevChar = state.src[i - 1];
        if (prevChar === "\\" || /\s/.test(prevChar)) return false;
        end = i;
        break;
      }
      if (end === -1) return false;

      const latex = state.src.slice(start + 1, end);
      if (!isValidInlineMathContent(latex)) return false;

      if (!silent) {
        const token = state.push("math_inline", MATH_INLINE_TAG_NAME, 0);
        token.markup = "$";
        token.content = latex;
      }

      state.pos = end + 1;
      return true;
    },
    { alt: ["emphasis", "link", "reference", "backticks", "strikethrough"] }
  );

  md.renderer.rules.math_inline = (tokens, idx) => {
    const latex = tokens[idx]?.content ?? "";
    return `<${MATH_INLINE_TAG_NAME} ${MATH_INLINE_LATEX_ATTRIBUTE}="${escapeHtmlAttribute(latex)}"></${MATH_INLINE_TAG_NAME}>`;
  };
};
