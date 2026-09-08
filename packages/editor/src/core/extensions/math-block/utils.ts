/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type MarkdownIt from "markdown-it";
// plane utils
import { escapeHtmlAttribute, extractMathBlock, MATH_BLOCK_DELIMITER } from "@plane/utils";

export const MATH_BLOCK_TAG_NAME = "math-block";
export const MATH_BLOCK_LATEX_ATTRIBUTE = "data-latex";

/**
 * Render LaTeX source to KaTeX HTML. KaTeX is code-split and only loaded
 * on demand. Throws when the source is invalid — callers are expected to
 * catch and fall back to showing the raw source.
 */
export const renderLatexToHtml = async (latex: string, displayMode = true): Promise<string> => {
  const katexModule = await import("katex");
  const katex = katexModule.default;
  return katex.renderToString(latex, {
    displayMode,
    strict: true,
    trust: false,
    throwOnError: true,
  });
};

/**
 * markdown-it block rule that parses `$$...$$` blocks (both `$$\n...\n$$`
 * and single-line `$$...$$`) and renders them as `<math-block>` HTML, which
 * the mathBlock TipTap node parses via its `parseHTML` rule.
 */
export const mathBlockMarkdownPlugin = (md: MarkdownIt): void => {
  md.block.ruler.before(
    "fence",
    "math_block",
    (state, startLine, endLine, silent) => {
      const pos = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];
      if (pos >= max) return false;

      const firstLine = state.src.slice(pos, max);
      if (!firstLine.trim().startsWith(MATH_BLOCK_DELIMITER)) return false;

      const blockLines = state.src.slice(state.bMarks[startLine], state.eMarks[endLine - 1]).split("\n");
      const mathBlock = extractMathBlock(blockLines);
      if (!mathBlock) return false;

      // in silent mode, only validate — don't push tokens
      if (silent) return true;

      state.line = startLine + mathBlock.endLineIndex + 1;

      const token = state.push("math_block", MATH_BLOCK_TAG_NAME, 0);
      token.block = true;
      token.markup = MATH_BLOCK_DELIMITER;
      token.content = mathBlock.latex;
      token.map = [startLine, state.line];

      return true;
    },
    { alt: ["paragraph", "reference", "blockquote", "list"] }
  );

  md.renderer.rules.math_block = (tokens, idx) => {
    const latex = tokens[idx]?.content ?? "";
    return `<${MATH_BLOCK_TAG_NAME} ${MATH_BLOCK_LATEX_ATTRIBUTE}="${escapeHtmlAttribute(latex)}"></${MATH_BLOCK_TAG_NAME}>\n`;
  };
};
