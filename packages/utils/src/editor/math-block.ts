/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export const MATH_BLOCK_DELIMITER = "$$";

const MATH_BLOCK_DELIMITER_LENGTH = MATH_BLOCK_DELIMITER.length;

export type TExtractedMathBlock = {
  /** LaTeX source captured between the `$$` delimiters. */
  latex: string;
  /** Index (relative to `lines`) of the line holding the closing delimiter. */
  endLineIndex: number;
};

/**
 * Extract the LaTeX source from a list of lines that starts with an opening
 * `$$` delimiter. Supports both multi-line blocks:
 *
 *   $$
 *   E = mc^2
 *   $$
 *
 * and single-line blocks:
 *
 *   $$E = mc^2$$
 *
 * Returns `null` when the first line does not open a `$$` block or when no
 * closing delimiter exists. Content after the closing delimiter on the same
 * line is ignored.
 */
export const extractMathBlock = (lines: string[]): TExtractedMathBlock | null => {
  const firstLine = lines[0];
  if (firstLine === undefined) return null;

  const trimmedFirstLine = firstLine.trim();
  if (!trimmedFirstLine.startsWith(MATH_BLOCK_DELIMITER)) return null;

  const latexLines: string[] = [];

  // single-line block: `$$...$$`
  if (trimmedFirstLine.length > MATH_BLOCK_DELIMITER_LENGTH) {
    const rest = trimmedFirstLine.slice(MATH_BLOCK_DELIMITER_LENGTH);
    const closingDelimiterIndex = rest.indexOf(MATH_BLOCK_DELIMITER);
    if (closingDelimiterIndex === -1) return null;
    latexLines.push(rest.slice(0, closingDelimiterIndex));
    return { latex: latexLines.join("\n").trim(), endLineIndex: 0 };
  }

  // multi-line block: `$$\n...\n$$`
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    const closingDelimiterIndex = line.indexOf(MATH_BLOCK_DELIMITER);
    if (closingDelimiterIndex !== -1) {
      latexLines.push(line.slice(0, closingDelimiterIndex));
      return { latex: latexLines.join("\n").trim(), endLineIndex: i };
    }
    latexLines.push(line);
  }

  return null;
};

/**
 * Serialize LaTeX source into a fenced `$$` markdown block.
 */
export const serializeMathBlockToMarkdown = (latex: string): string =>
  `${MATH_BLOCK_DELIMITER}\n${latex.trim()}\n${MATH_BLOCK_DELIMITER}`;

/**
 * Escape a string for safe interpolation into a double-quoted HTML attribute.
 */
export const escapeHtmlAttribute = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
