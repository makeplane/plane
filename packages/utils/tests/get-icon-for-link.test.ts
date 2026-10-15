/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { describe, expect, it } from "vitest";
import { FileZipOutline, FileSpreadsheetOutline, Github, LinkOutline } from "@makeplane/propel/icons";
import { getIconForLink } from "../src/get-icon-for-link";

describe("link icon matching", () => {
  it.each(["zip", "rar", "7z", "tar", "gz"])("uses the archive glyph for %s links", (extension) => {
    expect(getIconForLink(`https://example.com/REPORT.${extension.toUpperCase()}`)).toBe(FileZipOutline);
  });
  it.each(["xls", "xlsx", "csv"])("uses the spreadsheet glyph for %s links", (extension) => {
    expect(getIconForLink(`https://example.com/report.${extension}`)).toBe(FileSpreadsheetOutline);
  });
  it("preserves social match precedence and unknown-link fallback", () => {
    expect(getIconForLink("https://github.com/report.csv")).toBe(Github);
    expect(getIconForLink("relative-file")).toBe(LinkOutline);
  });
});
