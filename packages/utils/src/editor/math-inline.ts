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

/**
 * Serialize LaTeX source into an inline `$...$` markdown span.
 */
export const serializeMathInlineToMarkdown = (latex: string): string =>
  `${MATH_INLINE_DELIMITER}${latex.trim()}${MATH_INLINE_DELIMITER}`;
