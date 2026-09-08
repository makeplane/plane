/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export const MATH_INLINE_DELIMITER = "$";

/**
 * Source pattern (no delimiters) for valid inline math content:
 * - must not start with a digit, whitespace, or `$` (avoids `$100`, `$ 5`)
 * - must not end with whitespace or `$` (delimiters hug the content)
 * - must be single-line and contain no `$`
 */
export const MATH_INLINE_CONTENT_PATTERN = String.raw`[^\s$\d](?:[^$\n]*[^\s$])?`;

export const MATH_INLINE_CONTENT_REGEX = new RegExp(`^${MATH_INLINE_CONTENT_PATTERN}$`);

/** Full match pattern including delimiters, used by the editor input rule. */
export const MATH_INLINE_INPUT_REGEX = new RegExp(`\\$(${MATH_INLINE_CONTENT_PATTERN})\\$`);

/**
 * Whether a string is valid inline math content (without the `$` delimiters).
 * Currency-like content such as `100` or `5.99` is rejected because it starts
 * with a digit.
 */
export const isValidInlineMathContent = (content: string): boolean => MATH_INLINE_CONTENT_REGEX.test(content);

/** Placeholder char the editor scan uses to represent inline atom nodes inside a text block. */
export const INLINE_MATH_SCAN_ATOM_PLACEHOLDER = "￼";

export type TInlineMathMatch = {
  /** offset of the opening `$` within the scanned text */
  from: number;
  /** offset right after the closing `$` */
  to: number;
  /** LaTeX content without the `$` delimiters */
  latex: string;
};

/**
 * Find the first `$...$` span in a text block's text that qualifies as inline
 * math. Applies the same guards as the editor input rule: the match must not
 * be preceded by `$` (so `$$` block delimiters win) and the content must pass
 * isValidInlineMathContent (so `$100` stays text). Matches spanning an inline
 * atom placeholder (e.g. an already-converted math node) are skipped.
 */
export const findInlineMathMatch = (text: string): TInlineMathMatch | null => {
  const regex = new RegExp(MATH_INLINE_INPUT_REGEX.source, "g");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const latex = match[1];
    if (match.index > 0 && text[match.index - 1] === "$") continue;
    if (latex.includes(INLINE_MATH_SCAN_ATOM_PLACEHOLDER)) continue;
    if (!isValidInlineMathContent(latex)) continue;
    return { from: match.index, to: match.index + match[0].length, latex };
  }
  return null;
};

/**
 * Serialize LaTeX source into an inline `$...$` markdown span.
 */
export const serializeMathInlineToMarkdown = (latex: string): string =>
  `${MATH_INLINE_DELIMITER}${latex.trim()}${MATH_INLINE_DELIMITER}`;
