/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
// utils
import { formatMermaidError, getMermaidTheme, isMermaidLanguage, MERMAID_LANGUAGE } from "../src/editor/mermaid";

describe("isMermaidLanguage", () => {
  it("should return true for the mermaid language", () => {
    expect(isMermaidLanguage("mermaid")).toBe(true);
    expect(isMermaidLanguage("MERMAID")).toBe(true);
    expect(isMermaidLanguage(" Mermaid ")).toBe(true);
  });

  it("should return false for other languages", () => {
    expect(isMermaidLanguage("ts")).toBe(false);
    expect(isMermaidLanguage("markdown")).toBe(false);
    expect(isMermaidLanguage("mermaidjs")).toBe(false);
  });

  it("should return false for non-string values", () => {
    expect(isMermaidLanguage(null)).toBe(false);
    expect(isMermaidLanguage(undefined)).toBe(false);
    expect(isMermaidLanguage(42)).toBe(false);
    expect(isMermaidLanguage({})).toBe(false);
  });

  it("should be consistent with the MERMAID_LANGUAGE constant", () => {
    expect(isMermaidLanguage(MERMAID_LANGUAGE)).toBe(true);
  });
});

describe("getMermaidTheme", () => {
  it("should return dark for dark-based theme attributes", () => {
    expect(getMermaidTheme("dark")).toBe("dark");
    expect(getMermaidTheme("dark-contrast")).toBe("dark");
  });

  it("should return default for light-based theme attributes", () => {
    expect(getMermaidTheme("light")).toBe("default");
    expect(getMermaidTheme("light-contrast")).toBe("default");
  });

  it("should return default for missing or empty theme attributes", () => {
    expect(getMermaidTheme(null)).toBe("default");
    expect(getMermaidTheme(undefined)).toBe("default");
    expect(getMermaidTheme("")).toBe("default");
  });
});

describe("formatMermaidError", () => {
  it("should extract the message from an Error instance", () => {
    expect(formatMermaidError(new Error("Parse error on line 3"))).toBe("Parse error on line 3");
  });

  it("should pass through string errors", () => {
    expect(formatMermaidError("Syntax error in graph")).toBe("Syntax error in graph");
  });

  it("should return a fallback message for unknown errors", () => {
    expect(formatMermaidError(null)).toBe("Unable to render the diagram. Please check the Mermaid syntax.");
    expect(formatMermaidError(undefined)).toBe("Unable to render the diagram. Please check the Mermaid syntax.");
    expect(formatMermaidError({})).toBe("Unable to render the diagram. Please check the Mermaid syntax.");
    expect(formatMermaidError(new Error())).toBe("Unable to render the diagram. Please check the Mermaid syntax.");
  });
});
