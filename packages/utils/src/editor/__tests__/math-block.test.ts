/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
// local imports
import { escapeHtmlAttribute, extractMathBlock, serializeMathBlockToMarkdown } from "../math-block";

describe("extractMathBlock", () => {
  it("extracts a multi-line block", () => {
    const result = extractMathBlock(["$$", "E = mc^2", "$$"]);
    expect(result).toEqual({ latex: "E = mc^2", endLineIndex: 2 });
  });

  it("extracts a single-line block", () => {
    const result = extractMathBlock(["$$E = mc^2$$"]);
    expect(result).toEqual({ latex: "E = mc^2", endLineIndex: 0 });
  });

  it("keeps inner line breaks of a multi-line block", () => {
    const result = extractMathBlock(["$$", "\\begin{aligned}", "a &= b \\", "c &= d", "\\end{aligned}", "$$"]);
    expect(result?.latex).toBe("\\begin{aligned}\na &= b \\\nc &= d\n\\end{aligned}");
    expect(result?.endLineIndex).toBe(5);
  });

  it("ignores content after the closing delimiter on the same line", () => {
    const result = extractMathBlock(["$$x^2$$ trailing text"]);
    expect(result?.latex).toBe("x^2");
    expect(result?.endLineIndex).toBe(0);
  });

  it("returns null when the first line does not open a block", () => {
    expect(extractMathBlock(["some text $$", "$$"])).toBeNull();
  });

  it("returns null when there is no closing delimiter", () => {
    expect(extractMathBlock(["$$", "E = mc^2"])).toBeNull();
    expect(extractMathBlock(["$$E = mc^2"])).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(extractMathBlock([])).toBeNull();
  });

  it("trims surrounding whitespace of the latex source", () => {
    const result = extractMathBlock(["  $$  ", "  x^2  ", "  $$  "]);
    expect(result?.latex).toBe("x^2");
  });
});

describe("serializeMathBlockToMarkdown", () => {
  it("serializes latex into a fenced block", () => {
    expect(serializeMathBlockToMarkdown("E = mc^2")).toBe("$$\nE = mc^2\n$$");
  });

  it("trims the latex source", () => {
    expect(serializeMathBlockToMarkdown("  x^2  ")).toBe("$$\nx^2\n$$");
  });
});

describe("escapeHtmlAttribute", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtmlAttribute(`a<b>&"c"`)).toBe("a&lt;b&gt;&amp;&quot;c&quot;");
  });
});
