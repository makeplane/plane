/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { normalizeHex, parseHexColor } from "./hex";

describe("parseHexColor", () => {
  it("takes both hex lengths, with or without the hash, and lowercases them", () => {
    expect(parseHexColor("#0693E3")).toBe("#0693e3");
    expect(parseHexColor("0693e3")).toBe("#0693e3");
    expect(parseHexColor("  #0693e3  ")).toBe("#0693e3");
  });

  it("expands the three-digit form", () => {
    expect(parseHexColor("#fff")).toBe("#ffffff");
    expect(parseHexColor("ABC")).toBe("#aabbcc");
  });

  it("returns null for anything that is not one of those two forms", () => {
    for (const value of ["", "#", "ab", "abcd", "abcdefa", "red", "#12345g", "rgb(0,0,0)"])
      expect(parseHexColor(value)).toBeNull();
  });
});

describe("normalizeHex", () => {
  it("passes a non-colour through untouched", () => {
    expect(normalizeHex("#abc")).toBe("#aabbcc");
    expect(normalizeHex("rebeccapurple")).toBe("rebeccapurple");
  });
});
