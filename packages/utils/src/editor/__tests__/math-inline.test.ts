/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
// local imports
import { isValidInlineMathContent, MATH_INLINE_INPUT_REGEX, serializeMathInlineToMarkdown } from "../math-inline";

describe("isValidInlineMathContent", () => {
  it("accepts regular formulas", () => {
    expect(isValidInlineMathContent("x+1")).toBe(true);
    expect(isValidInlineMathContent("E = mc^2")).toBe(true);
    expect(isValidInlineMathContent("x")).toBe(true);
    expect(isValidInlineMathContent("\\alpha_\\beta")).toBe(true);
  });

  it("rejects currency-like content starting with a digit", () => {
    expect(isValidInlineMathContent("100")).toBe(false);
    expect(isValidInlineMathContent("5.99")).toBe(false);
    expect(isValidInlineMathContent("2x")).toBe(false);
  });

  it("rejects empty and whitespace-padded content", () => {
    expect(isValidInlineMathContent("")).toBe(false);
    expect(isValidInlineMathContent(" x")).toBe(false);
    expect(isValidInlineMathContent("x ")).toBe(false);
  });

  it("rejects content with newlines or `$`", () => {
    expect(isValidInlineMathContent("x\ny")).toBe(false);
    expect(isValidInlineMathContent("x$y")).toBe(false);
  });
});

describe("MATH_INLINE_INPUT_REGEX", () => {
  it("matches inline math with hugging delimiters", () => {
    const match = "$x+1$".match(MATH_INLINE_INPUT_REGEX);
    expect(match?.[1]).toBe("x+1");
  });

  it("does not match currency amounts", () => {
    expect("$100".match(MATH_INLINE_INPUT_REGEX)).toBeNull();
    expect("$5.99".match(MATH_INLINE_INPUT_REGEX)).toBeNull();
    expect("pay $100 and $x$".match(MATH_INLINE_INPUT_REGEX)?.[1]).toBe("x");
  });

  it("does not match spaced delimiters", () => {
    expect("$ x$".match(MATH_INLINE_INPUT_REGEX)).toBeNull();
    expect("$x $".match(MATH_INLINE_INPUT_REGEX)).toBeNull();
  });

  it("does not match unclosed dollars", () => {
    expect("x + $y".match(MATH_INLINE_INPUT_REGEX)).toBeNull();
  });

  it("matches the trailing span of $$x$$ — the editor input rule guards against a preceding $ so $$ blocks win", () => {
    const match = "$$x$$".match(MATH_INLINE_INPUT_REGEX);
    expect(match?.[0]).toBe("$x$");
    expect(match?.index).toBe(1);
  });
});

describe("serializeMathInlineToMarkdown", () => {
  it("serializes latex into an inline span", () => {
    expect(serializeMathInlineToMarkdown("x+1")).toBe("$x+1$");
  });

  it("trims the latex source", () => {
    expect(serializeMathInlineToMarkdown("  x^2  ")).toBe("$x^2$");
  });
});
