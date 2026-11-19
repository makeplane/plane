/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { getFileExtension, getFileName } from "./attachment";

describe("getFileName", () => {
  it.each([
    ["README", "README"],
    ["Makefile", "Makefile"],
    ["notes with spaces", "notes with spaces"],
    [".gitignore", ".gitignore"],
    [".env", ".env"],
    ["", ""],
    ["report.pdf", "report"],
    ["archive.tar.gz", "archive.tar"],
    [".env.example", ".env"],
    ["trailing.", "trailing"],
  ])("preserves the basename of %j", (name, expected) => {
    expect(getFileName(name)).toBe(expected);
  });

  it.each(["README", "Makefile", ".gitignore", ".env"])(
    "preserves the complete name when %j has no extension",
    (name) => {
      expect(getFileExtension(name)).toBe("");
      expect(getFileName(name)).toBe(name);
    }
  );
});
